import io
import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.main import app

client = TestClient(app)

def run_tests():
    print("=== STARTING COMPLETE ROLE & DATA ISOLATION TESTS ===")

    # 1. Test Admin Login
    res = client.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    admin_data = res.json()
    admin_token = admin_data["token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[PASS] Admin Login successful. Token generated.")

    # 2. Test Admin can list users
    res = client.get("/api/auth/users", headers=admin_headers)
    assert res.status_code == 200, f"Admin list users failed: {res.text}"
    users = res.json()
    assert len(users) >= 5, "Expected at least 5 users in database"
    assert "recovery_code" in users[0], "Admin should see recovery code"
    print(f"[PASS] Admin can view all {len(users)} users with recovery codes.")

    # 3. Test Student 1 Login
    res = client.post("/api/auth/login", json={"username": "student1", "password": "study123"})
    assert res.status_code == 200, f"Student1 login failed: {res.text}"
    s1_data = res.json()
    s1_token = s1_data["token"]
    s1_headers = {"Authorization": f"Bearer {s1_token}"}
    print("[PASS] Student 1 (Alex Turner) Login successful.")

    # 4. Test Student 1 CANNOT access Admin Users API
    res = client.get("/api/auth/users", headers=s1_headers)
    assert res.status_code == 403, f"Security Breach! Student1 got access to users list: {res.status_code}"
    print("[PASS] Security Check: Student 1 GET /api/auth/users is BLOCKED with 403 Forbidden.")

    # 5. Test Student 1 CANNOT delete accounts
    res = client.delete("/api/auth/users/student2", headers=s1_headers)
    assert res.status_code == 403, "Security Breach! Student1 was able to delete user."
    print("[PASS] Security Check: Student 1 DELETE /api/auth/users is BLOCKED with 403 Forbidden.")

    # 6. Test Student 1 CANNOT change another user's password
    res = client.post("/api/auth/change-password", headers=s1_headers, json={
        "username": "student2",
        "current_password": "study123",
        "new_password": "hackedpassword"
    })
    assert res.status_code == 403, "Security Breach! Student1 was able to change Student2 password."
    print("[PASS] Security Check: Student 1 cannot change Student 2 password (403 Forbidden).")

    # 7. Test Student 2 Login
    res = client.post("/api/auth/login", json={"username": "student2", "password": "study123"})
    assert res.status_code == 200, f"Student2 login failed: {res.text}"
    s2_data = res.json()
    s2_token = s2_data["token"]
    s2_headers = {"Authorization": f"Bearer {s2_token}"}
    print("[PASS] Student 2 (Maya Patel) Login successful.")

    # 8. Test Data Isolation: Student 1 uploads a document
    dummy_pdf_1 = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000117 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n212\n%%EOF"
    upload_res1 = client.post(
        "/api/upload",
        headers=s1_headers,
        files={"file": ("Student1_Biology_Notes.pdf", dummy_pdf_1, "application/pdf")}
    )
    assert upload_res1.status_code == 200, f"Student 1 upload failed: {upload_res1.text}"
    s1_doc = upload_res1.json()
    s1_doc_id = s1_doc["id"]
    print(f"[PASS] Student 1 uploaded private document '{s1_doc['filename']}' (ID: {s1_doc_id}).")

    # 9. Verify Student 1 sees their document
    res = client.get("/api/documents", headers=s1_headers)
    assert res.status_code == 200
    s1_docs = res.json()["documents"]
    assert any(d["id"] == s1_doc_id for d in s1_docs), "Student 1 should see their uploaded document"
    print("[PASS] Student 1 document list contains Student 1's document.")

    # 10. CRITICAL CHECK: Verify Student 2 CANNOT see Student 1's document in list
    res = client.get("/api/documents", headers=s2_headers)
    assert res.status_code == 200
    s2_docs = res.json()["documents"]
    assert not any(d["id"] == s1_doc_id for d in s2_docs), "Security Breach! Student 2 sees Student 1's document in list!"
    print("[PASS] CRITICAL PASS: Student 2 CANNOT see Student 1's document in /api/documents.")

    # 11. CRITICAL CHECK: Student 2 attempts to download Student 1's document directly by ID
    res = client.get(f"/api/documents/{s1_doc_id}/download", headers=s2_headers)
    assert res.status_code in [403, 404], f"Security Breach! Student 2 was able to download Student 1's document: {res.status_code}"
    print(f"[PASS] CRITICAL PASS: Student 2 direct download of Student 1 doc ID is BLOCKED ({res.status_code}).")

    # 12. CRITICAL CHECK: Student 2 attempts to delete Student 1's document directly by ID
    res = client.delete(f"/api/documents/{s1_doc_id}", headers=s2_headers)
    assert res.status_code in [403, 404], f"Security Breach! Student 2 was able to delete Student 1's document: {res.status_code}"
    print(f"[PASS] CRITICAL PASS: Student 2 direct deletion of Student 1 doc ID is BLOCKED ({res.status_code}).")

    # 13. CRITICAL CHECK: Student 2 attempts to generate a quiz using Student 1's doc ID
    res = client.post("/api/quiz/generate", headers=s2_headers, json={"document_id": s1_doc_id, "num_questions": 3})
    assert res.status_code in [403, 404], f"Security Breach! Student 2 generated quiz on Student 1 doc: {res.status_code}"
    print(f"[PASS] CRITICAL PASS: Student 2 quiz generation on Student 1 doc is BLOCKED ({res.status_code}).")

    # 14. CRITICAL CHECK: Student 2 attempts to generate revision using Student 1's doc ID
    res = client.post("/api/revision/generate", headers=s2_headers, json={"document_id": s1_doc_id})
    assert res.status_code in [403, 404], f"Security Breach! Student 2 generated revision on Student 1 doc: {res.status_code}"
    print(f"[PASS] CRITICAL PASS: Student 2 revision generation on Student 1 doc is BLOCKED ({res.status_code}).")

    # 15. CRITICAL CHECK: Student 2 attempts to RAG chat with Student 1's doc ID
    res = client.post("/api/chat", headers=s2_headers, json={"question": "What is in this note?", "document_id": s1_doc_id})
    assert res.status_code in [403, 404], f"Security Breach! Student 2 chatted with Student 1 doc: {res.status_code}"
    print(f"[PASS] CRITICAL PASS: Student 2 RAG chat on Student 1 doc is BLOCKED ({res.status_code}).")

    # 16. Test Student 2 uploads their OWN document
    upload_res2 = client.post(
        "/api/upload",
        headers=s2_headers,
        files={"file": ("Student2_Chemistry_Notes.pdf", dummy_pdf_1, "application/pdf")}
    )
    assert upload_res2.status_code == 200, f"Student 2 upload failed: {upload_res2.text}"
    s2_doc_id = upload_res2.json()["id"]
    print(f"[PASS] Student 2 uploaded private document 'Student2_Chemistry_Notes.pdf' (ID: {s2_doc_id}).")

    # Verify Student 2 sees ONLY their document and not Student 1's
    res = client.get("/api/documents", headers=s2_headers)
    s2_docs_after = res.json()["documents"]
    assert any(d["id"] == s2_doc_id for d in s2_docs_after)
    assert not any(d["id"] == s1_doc_id for d in s2_docs_after)
    print("[PASS] Student 2 document list contains ONLY Student 2's document.")

    # Clean up test documents
    client.delete(f"/api/documents/{s1_doc_id}", headers=s1_headers)
    client.delete(f"/api/documents/{s2_doc_id}", headers=s2_headers)
    print("[PASS] Test cleanup completed.")

    print("\n=======================================================")
    print("ALL SECURITY, ROLE & DATA ISOLATION TESTS PASSED 100%!")
    print("=======================================================")

if __name__ == "__main__":
    run_tests()
