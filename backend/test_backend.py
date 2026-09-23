import asyncio
from pathlib import Path
import httpx
from app.main import app
from app.services.vector_service import vector_service

async def run_integration_tests():
    print("=== STARTING BACKEND INTEGRATION TESTS ===")
    sample_pdf = Path(__file__).parent / "sample_docs" / "Operating_Systems_Concurrency.pdf"
    assert sample_pdf.exists(), f"Sample PDF missing: {sample_pdf}"

    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
        # 1. Health Check
        print("\n1. Testing /api/health ...")
        res = await client.get("/api/health")
        assert res.status_code == 200, res.text
        health_data = res.json()
        print(f"   Health OK: Active Provider={health_data['active_provider']}, Connected Docs={health_data['document_count']}")

        # 2. Upload Sample PDF
        print("\n2. Testing /api/upload with Operating_Systems_Concurrency.pdf ...")
        with open(sample_pdf, "rb") as f:
            files = {"file": ("Operating_Systems_Concurrency.pdf", f, "application/pdf")}
            res = await client.post("/api/upload", files=files)
        assert res.status_code == 200, res.text
        doc_data = res.json()
        doc_id = doc_data["id"]
        print(f"   Upload Success! Doc ID: {doc_id}, Pages: {doc_data['page_count']}, Chunks: {doc_data['chunk_count']}")

        # 3. List Documents
        print("\n3. Testing /api/documents ...")
        res = await client.get("/api/documents")
        assert res.status_code == 200
        docs_list = res.json()["documents"]
        assert len(docs_list) >= 1
        print(f"   Documents count: {len(docs_list)} (Found: '{docs_list[0]['filename']}')")

        # 4. RAG Chat
        print("\n4. Testing /api/chat (Grounded Question) ...")
        chat_payload = {
            "question": "What are the four necessary conditions for a deadlock?",
            "document_id": doc_id,
            "history": []
        }
        res = await client.post("/api/chat", json=chat_payload)
        assert res.status_code == 200, res.text
        chat_data = res.json()
        print(f"   Provider Used: {chat_data['provider_used']}")
        print(f"   Answer Snippet: {chat_data['answer'][:180]}...")
        print(f"   Citations Count: {len(chat_data['citations'])}")
        assert len(chat_data['citations']) > 0, "Expected at least 1 citation"
        print(f"   Top Citation: [{chat_data['citations'][0]['document_name']} | Page {chat_data['citations'][0]['page']}]")

        # 5. Mock Test Generation
        print("\n5. Testing /api/quiz/generate ...")
        quiz_payload = {
            "document_id": doc_id,
            "topic": "Deadlocks and Semaphores",
            "num_questions": 3
        }
        res = await client.post("/api/quiz/generate", json=quiz_payload)
        assert res.status_code == 200, res.text
        quiz_data = res.json()
        questions = quiz_data["questions"]
        print(f"   Generated {len(questions)} MCQs:")
        for q in questions:
            print(f"   - Q{q['id']}: {q['question'][:75]}... (Answer: Opt {q['correct_answer']})")
        assert len(questions) == 3

        # 6. Submit Quiz Results
        print("\n6. Testing /api/quiz/submit ...")
        submit_payload = {
            "quiz_id": quiz_data["quiz_id"],
            "document_id": doc_id,
            "score": 3,
            "total_questions": 3
        }
        res = await client.post("/api/quiz/submit", json=submit_payload)
        assert res.status_code == 200
        print(f"   Score recorded: {res.json()['percentage']}%")

        # 7. One-Shot Revision Sheet
        print("\n7. Testing /api/revision/generate ...")
        rev_payload = {
            "document_id": doc_id,
            "topic": "Process Management & Critical Section"
        }
        res = await client.post("/api/revision/generate", json=rev_payload)
        assert res.status_code == 200, res.text
        rev_data = res.json()
        print(f"   Definitions Count: {len(rev_data['key_definitions'])}")
        print(f"   Key Points Count: {len(rev_data['key_points'])}")
        print(f"   Example Q&As: {len(rev_data['example_qas'])}")

        # 8. Stats Check
        print("\n8. Testing /api/stats ...")
        res = await client.get("/api/stats")
        assert res.status_code == 200
        stats = res.json()
        print(f"   Stats: Uploaded={stats['documents_uploaded']}, Tests={stats['tests_taken']}, AvgScore={stats['avg_score']}%, Revised={stats['topics_revised']}")
        assert stats["documents_uploaded"] >= 1
        assert stats["tests_taken"] >= 1

    print("\n=== ALL BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    asyncio.run(run_integration_tests())
