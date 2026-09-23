import json
import os
import re
from pathlib import Path
from typing import List, Dict, Any, Optional
import httpx
import chromadb
from chromadb.config import Settings as ChromaSettings
from chromadb.utils import embedding_functions

from app.config import settings, DATA_DIR, CHROMA_DIR

DOCS_META_FILE = DATA_DIR / "documents_meta.json"
STATS_FILE = DATA_DIR / "stats.json"

class VectorService:
    def __init__(self):
        self._init_storage()
        self._init_chroma()
        
    def _init_storage(self):
        if not DOCS_META_FILE.exists():
            with open(DOCS_META_FILE, "w", encoding="utf-8") as f:
                json.dump({}, f)
        if not STATS_FILE.exists():
            with open(STATS_FILE, "w", encoding="utf-8") as f:
                json.dump({
                    "tests_taken": 0,
                    "total_score_sum": 0,
                    "total_questions_answered": 0,
                    "topics_revised": 0
                }, f)

    def _init_chroma(self):
        self.chroma_client = chromadb.PersistentClient(
            path=str(CHROMA_DIR),
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        # Default fallback embedding function (runs locally via ONNX)
        self.default_ef = embedding_functions.DefaultEmbeddingFunction()
        
        self.collection = self.chroma_client.get_or_create_collection(
            name=settings.chroma_collection_name,
            embedding_function=self.default_ef,
            metadata={"hnsw:space": "cosine"}
        )

    def _split_into_chunks(self, text: str, chunk_size: int = 800, overlap: int = 150) -> List[str]:
        """
        Splits text into overlapping chunks, respecting paragraph and sentence boundaries.
        """
        paragraphs = text.split("\n\n")
        chunks = []
        current_chunk = ""
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
                
            if len(current_chunk) + len(para) + 2 <= chunk_size:
                current_chunk = f"{current_chunk}\n\n{para}" if current_chunk else para
            else:
                if current_chunk:
                    chunks.append(current_chunk)
                    # Keep overlap from the end of current chunk
                    overlap_text = current_chunk[-overlap:] if len(current_chunk) > overlap else current_chunk
                    current_chunk = f"{overlap_text}\n\n{para}"
                else:
                    # Paragraph is longer than chunk_size, split by sentences or hard chunks
                    sentences = re.split(r'(?<=[.!?])\s+', para)
                    sub_chunk = ""
                    for s in sentences:
                        if len(sub_chunk) + len(s) + 1 <= chunk_size:
                            sub_chunk = f"{sub_chunk} {s}" if sub_chunk else s
                        else:
                            if sub_chunk:
                                chunks.append(sub_chunk)
                                sub_chunk = s
                            else:
                                # Hard cut
                                chunks.append(s[:chunk_size])
                                sub_chunk = s[chunk_size:]
                    if sub_chunk:
                        current_chunk = sub_chunk

        if current_chunk:
            chunks.append(current_chunk)
            
        return [c.strip() for c in chunks if len(c.strip()) > 30]

    async def _get_ollama_embeddings(self, texts: List[str]) -> Optional[List[List[float]]]:
        """
        Attempts to generate embeddings using Ollama's nomic-embed-text.
        Returns None if Ollama is not reachable.
        """
        try:
            embeddings = []
            async with httpx.AsyncClient(timeout=1.5) as client:
                for t in texts:
                    res = await client.post(
                        f"{settings.ollama_base_url}/api/embeddings",
                        json={"model": settings.ollama_embed_model, "prompt": t}
                    )
                    if res.status_code == 200:
                        embeddings.append(res.json().get("embedding"))
                    else:
                        return None
            return embeddings
        except Exception:
            return None

    async def add_document(self, doc_id: str, filename: str, pages_data: List[Dict[str, Any]], meta: Dict[str, Any]) -> int:
        """
        Chunks page text, embeds, and stores in ChromaDB.
        """
        all_chunks = []
        ids = []
        metadatas = []
        chunk_idx = 0
        
        for page_info in pages_data:
            page_num = page_info["page"]
            text = page_info["text"]
            chunks = self._split_into_chunks(text, settings.chunk_size, settings.chunk_overlap)
            
            for c in chunks:
                chunk_id = f"{doc_id}_{chunk_idx}"
                all_chunks.append(c)
                ids.append(chunk_id)
                metadatas.append({
                    "document_id": doc_id,
                    "filename": filename,
                    "page": page_num,
                    "chunk_index": chunk_idx
                })
                chunk_idx += 1

        if not all_chunks:
            # Empty document fallback
            all_chunks.append(f"Document {filename} contains minimal readable text.")
            ids.append(f"{doc_id}_0")
            metadatas.append({
                "document_id": doc_id,
                "filename": filename,
                "page": 1,
                "chunk_index": 0
            })
            chunk_idx = 1

        # Attempt Ollama nomic-embed-text first
        ollama_embs = await self._get_ollama_embeddings(all_chunks)
        if ollama_embs and len(ollama_embs) == len(all_chunks):
            self.collection.add(
                ids=ids,
                documents=all_chunks,
                embeddings=ollama_embs,
                metadatas=metadatas
            )
        else:
            # Fall back to Chroma's default local embedding function
            self.collection.add(
                ids=ids,
                documents=all_chunks,
                metadatas=metadatas
            )

        # Update metadata JSON store
        self._save_document_meta(doc_id, {
            "id": doc_id,
            "filename": filename,
            "upload_date": meta.get("upload_date"),
            "file_size": meta.get("file_size", 0),
            "page_count": meta.get("page_count", 1),
            "chunk_count": chunk_idx,
            "summary": meta.get("summary", "")
        })

        return chunk_idx

    def _save_document_meta(self, doc_id: str, meta: Dict[str, Any]):
        try:
            with open(DOCS_META_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            data[doc_id] = meta
            with open(DOCS_META_FILE, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Error saving doc metadata: {e}")

    def get_all_documents(self) -> List[Dict[str, Any]]:
        try:
            with open(DOCS_META_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            return list(data.values())
        except Exception:
            return []

    def get_document_by_id(self, doc_id: str) -> Optional[Dict[str, Any]]:
        try:
            with open(DOCS_META_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            return data.get(doc_id)
        except Exception:
            return None

    def delete_document(self, doc_id: str) -> bool:
        # Delete from ChromaDB
        try:
            self.collection.delete(where={"document_id": doc_id})
        except Exception as e:
            print(f"Error deleting from Chroma: {e}")

        # Delete from meta store
        try:
            with open(DOCS_META_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            if doc_id in data:
                del data[doc_id]
                with open(DOCS_META_FILE, "w", encoding="utf-8") as f:
                    json.dump(data, f, indent=2)
            return True
        except Exception:
            return False

    async def query_relevant_chunks(self, query: str, document_id: Optional[str] = None, n_results: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieves top n_results most relevant chunks for a query.
        """
        where_filter = {"document_id": document_id} if document_id else None
        
        # Check if Ollama embeddings are used
        query_embs = await self._get_ollama_embeddings([query])
        if query_embs:
            results = self.collection.query(
                query_embeddings=query_embs,
                n_results=n_results,
                where=where_filter
            )
        else:
            results = self.collection.query(
                query_texts=[query],
                n_results=n_results,
                where=where_filter
            )

        output = []
        if results and results.get("documents") and len(results["documents"]) > 0:
            docs = results["documents"][0]
            metas = results["metadatas"][0] if results.get("metadatas") else []
            distances = results["distances"][0] if results.get("distances") else []
            
            for i, doc_text in enumerate(docs):
                meta = metas[i] if i < len(metas) else {}
                dist = distances[i] if i < len(distances) else 0.0
                similarity = round(max(0.0, 1.0 - float(dist)), 4) if dist is not None else 0.85
                output.append({
                    "text": doc_text,
                    "document_id": meta.get("document_id", ""),
                    "filename": meta.get("filename", "Unknown Document"),
                    "page": meta.get("page", 1),
                    "chunk_index": meta.get("chunk_index", 0),
                    "similarity": similarity
                })
        return output

    def get_document_full_text(self, doc_id: str) -> str:
        """
        Retrieves all chunks for a document to form full content.
        """
        try:
            results = self.collection.get(
                where={"document_id": doc_id},
                include=["documents", "metadatas"]
            )
            if not results or not results.get("documents"):
                return ""
            
            # Sort by chunk_index
            combined = []
            for doc, meta in zip(results["documents"], results["metadatas"]):
                combined.append((meta.get("chunk_index", 0), doc))
            combined.sort(key=lambda x: x[0])
            return "\n\n".join(item[1] for item in combined)
        except Exception as e:
            print(f"Error fetching full text: {e}")
            return ""

    # Stats management
    def get_stats(self) -> Dict[str, Any]:
        try:
            with open(STATS_FILE, "r", encoding="utf-8") as f:
                stats = json.load(f)
            docs = self.get_all_documents()
            tests_taken = stats.get("tests_taken", 0)
            avg_score = 0.0
            if tests_taken > 0 and stats.get("total_questions_answered", 0) > 0:
                avg_score = round((stats.get("total_score_sum", 0) / stats.get("total_questions_answered", 0)) * 100, 1)
            return {
                "documents_uploaded": len(docs),
                "tests_taken": tests_taken,
                "avg_score": avg_score,
                "topics_revised": stats.get("topics_revised", 0)
            }
        except Exception:
            return {"documents_uploaded": 0, "tests_taken": 0, "avg_score": 0.0, "topics_revised": 0}

    def record_test_result(self, score: int, total_questions: int):
        try:
            with open(STATS_FILE, "r", encoding="utf-8") as f:
                stats = json.load(f)
            stats["tests_taken"] = stats.get("tests_taken", 0) + 1
            stats["total_score_sum"] = stats.get("total_score_sum", 0) + score
            stats["total_questions_answered"] = stats.get("total_questions_answered", 0) + total_questions
            with open(STATS_FILE, "w", encoding="utf-8") as f:
                json.dump(stats, f, indent=2)
        except Exception as e:
            print(f"Error updating test stats: {e}")

    def increment_topics_revised(self):
        try:
            with open(STATS_FILE, "r", encoding="utf-8") as f:
                stats = json.load(f)
            stats["topics_revised"] = stats.get("topics_revised", 0) + 1
            with open(STATS_FILE, "w", encoding="utf-8") as f:
                json.dump(stats, f, indent=2)
        except Exception as e:
            print(f"Error updating revision stats: {e}")

vector_service = VectorService()
