import json
import uuid
import re
import random
from typing import List, Dict, Any, Optional

from app.services.vector_service import vector_service
from app.services.llm_service import llm_service
from app.models.schemas import QuizQuestion, QuizResponse

class QuizService:
    async def generate_quiz(
        self,
        document_id: str,
        topic: Optional[str] = None,
        num_questions: int = 5
    ) -> QuizResponse:
        doc_meta = vector_service.get_document_by_id(document_id)
        doc_name = doc_meta["filename"] if doc_meta else "Document"

        # Retrieve relevant chunks for the topic or document
        query_text = topic if topic and topic.strip() else "key concepts, definitions, principles and important topics"
        chunks = await vector_service.query_relevant_chunks(
            query=query_text,
            document_id=document_id,
            n_results=min(8, max(4, num_questions * 2))
        )

        if not chunks:
            # Fallback to full document text if vector query had no chunks
            full_text = vector_service.get_document_full_text(document_id)
            context_text = full_text[:4000] if full_text else f"Study material for {doc_name}"
        else:
            context_text = "\n\n".join([f"[Page {c['page']}]: {c['text']}" for c in chunks])

        prompt = f"""You are a professional educational test maker. Create {num_questions} high-quality Multiple Choice Questions (MCQs) strictly based on the provided study notes.

Study Material:
{context_text}

Rules:
1. Each question must test understanding of key concepts from the material.
2. Provide exactly 4 options per question (indices 0, 1, 2, 3).
3. Exactly ONE option must be correct.
4. Set "correct_answer" as the 0-based integer index of the correct option (0, 1, 2, or 3).
5. Provide a clear educational explanation of why the correct option is right.
6. Return ONLY valid JSON matching this schema:
{{
  "questions": [
    {{
      "id": 1,
      "question": "Clear question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": 0,
      "explanation": "Detailed explanation here."
    }}
  ]
}}"""

        system_prompt = "You are a test assessment engine. You strictly output valid JSON containing challenging, well-formulated multiple choice questions."

        def offline_quiz_fallback() -> str:
            # Intelligent heuristic question generator from chunks
            questions_list = []
            sentences = []
            for c in chunks:
                for line in c["text"].split(". "):
                    s = line.strip()
                    if 35 < len(s) < 180 and any(kw in s.lower() for kw in ["is", "are", "refers to", "means", "used for", "called", "known as"]):
                        sentences.append((s, c))

            if not sentences and chunks:
                sentences = [(chunks[0]["text"][:120], chunks[0])]

            random.shuffle(sentences)
            for idx in range(min(num_questions, max(1, len(sentences)))):
                target_sent, target_chunk = sentences[idx % len(sentences)]
                words = target_sent.split()
                # Find a key term to blank out or question
                key_phrase = words[0] if len(words) > 0 else "Concept"
                for w in words:
                    if len(w) > 5 and w[0].isupper():
                        key_phrase = w
                        break

                q_text = f"According to the study material on Page {target_chunk['page']}, which statement accurately describes the following concept: '{target_sent[:70]}...'?"
                correct_opt = target_sent
                opt2 = f"It represents an unrelated secondary mechanism not described in {doc_name}."
                opt3 = f"It is deprecated and superseded by non-standard approaches."
                opt4 = f"It applies only when no operational constraints or dependencies exist."
                
                opts = [correct_opt, opt2, opt3, opt4]
                random.shuffle(opts)
                correct_idx = opts.index(correct_opt)

                questions_list.append({
                    "id": idx + 1,
                    "question": q_text,
                    "options": opts,
                    "correct_answer": correct_idx,
                    "explanation": f"Grounded directly in {doc_name} (Page {target_chunk['page']}): \"{target_sent}\""
                })

            return json.dumps({"questions": questions_list})

        resp_text, provider = await llm_service.generate_completion(
            prompt=prompt,
            system_prompt=system_prompt,
            json_mode=True,
            fallback_offline_fn=offline_quiz_fallback
        )

        parsed_questions = []
        try:
            parsed_data = llm_service.clean_json_response(resp_text)
            raw_qs = parsed_data.get("questions", [])
            for i, q in enumerate(raw_qs, 1):
                options = q.get("options", [])
                # Ensure 4 options
                while len(options) < 4:
                    options.append(f"Option {chr(65 + len(options))}")
                options = options[:4]
                
                correct_ans = q.get("correct_answer", 0)
                if isinstance(correct_ans, str):
                    # In case LLM returned "A", "B", "C", "D"
                    letter_map = {"A": 0, "B": 1, "C": 2, "D": 3}
                    correct_ans = letter_map.get(correct_ans.strip().upper(), 0)
                elif not isinstance(correct_ans, int) or correct_ans < 0 or correct_ans > 3:
                    correct_ans = 0

                parsed_questions.append(QuizQuestion(
                    id=i,
                    question=q.get("question", f"Question {i}"),
                    options=options,
                    correct_answer=correct_ans,
                    explanation=q.get("explanation", "Correct based on the uploaded material.")
                ))
        except Exception as e:
            print(f"Error parsing quiz JSON from {provider}: {e}")
            # Run offline generator
            offline_json = json.loads(offline_quiz_fallback())
            for i, q in enumerate(offline_json.get("questions", []), 1):
                parsed_questions.append(QuizQuestion(
                    id=i,
                    question=q["question"],
                    options=q["options"],
                    correct_answer=q["correct_answer"],
                    explanation=q["explanation"]
                ))

        quiz_id = str(uuid.uuid4())[:8]
        return QuizResponse(
            quiz_id=quiz_id,
            document_id=document_id,
            document_name=doc_name,
            topic=topic or "Comprehensive Topic Review",
            questions=parsed_questions
        )

quiz_service = QuizService()
