import hashlib
import json
import os
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from pathlib import Path

from app.config import DATA_DIR

USERS_FILE = DATA_DIR / "users.json"

class AuthService:
    def __init__(self):
        self._init_users_store()

    def _hash_password(self, password: str, salt: str = "study_salt_2026") -> str:
        return hashlib.sha256(f"{password}_{salt}".encode("utf-8")).hexdigest()

    def _init_users_store(self):
        """
        Seeds 5 default pre-configured accounts if users.json does not exist.
        """
        if not USERS_FILE.exists():
            default_users = {
                "admin": {
                    "id": "usr_admin",
                    "username": "admin",
                    "password_hash": self._hash_password("admin123"),
                    "name": "Administrator",
                    "role": "Admin",
                    "email": "admin@studyassistant.ai",
                    "recovery_code": "ADMIN2026",
                    "created_at": "Sep 15, 2026",
                },
                "student1": {
                    "id": "usr_student1",
                    "username": "student1",
                    "password_hash": self._hash_password("study123"),
                    "name": "Alex Turner",
                    "role": "Student",
                    "email": "alex@studyassistant.ai",
                    "recovery_code": "STUDENT1",
                    "created_at": "Sep 15, 2026",
                },
                "student2": {
                    "id": "usr_student2",
                    "username": "student2",
                    "password_hash": self._hash_password("study123"),
                    "name": "Maya Patel",
                    "role": "Student",
                    "email": "maya@studyassistant.ai",
                    "recovery_code": "STUDENT2",
                    "created_at": "Sep 15, 2026",
                },
                "student3": {
                    "id": "usr_student3",
                    "username": "student3",
                    "password_hash": self._hash_password("study123"),
                    "name": "Liam Johnson",
                    "role": "Student",
                    "email": "liam@studyassistant.ai",
                    "recovery_code": "STUDENT3",
                    "created_at": "Sep 15, 2026",
                },
                "teacher1": {
                    "id": "usr_teacher1",
                    "username": "teacher1",
                    "password_hash": self._hash_password("teach123"),
                    "name": "Prof. Sharma",
                    "role": "Faculty",
                    "email": "sharma@studyassistant.ai",
                    "recovery_code": "TEACHER1",
                    "created_at": "Sep 15, 2026",
                },
            }
            with open(USERS_FILE, "w", encoding="utf-8") as f:
                json.dump(default_users, f, indent=2)

    def _read_users(self) -> Dict[str, Any]:
        try:
            with open(USERS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}

    def _write_users(self, data: Dict[str, Any]):
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def authenticate_user(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        users = self._read_users()
        user = users.get(username.strip().lower())
        if not user:
            return None
        if user["password_hash"] != self._hash_password(password):
            return None

        # Return sanitized profile
        return {
            "id": user["id"],
            "username": user["username"],
            "name": user["name"],
            "role": user["role"],
            "email": user["email"],
            "created_at": user.get("created_at", "2026"),
            "token": f"token_{user['username']}_{uuid.uuid4().hex[:12]}"
        }

    def change_password(self, username: str, current_password: str, new_password: str) -> bool:
        users = self._read_users()
        user_key = username.strip().lower()
        user = users.get(user_key)
        if not user:
            raise ValueError("User not found")
        if user["password_hash"] != self._hash_password(current_password):
            raise ValueError("Current password is incorrect")
        if len(new_password) < 4:
            raise ValueError("New password must be at least 4 characters long")

        user["password_hash"] = self._hash_password(new_password)
        self._write_users(users)
        return True

    def forgot_password_recovery(self, username: str, recovery_input: str, new_password: str) -> bool:
        """
        Validates recovery via either recovery_code or email, then sets new password.
        """
        users = self._read_users()
        user_key = username.strip().lower()
        user = users.get(user_key)
        if not user:
            raise ValueError("User not found")

        recovery_val = recovery_input.strip().lower()
        is_email_match = user.get("email", "").strip().lower() == recovery_val
        is_code_match = user.get("recovery_code", "").strip().lower() == recovery_val

        if not (is_email_match or is_code_match):
            raise ValueError("Recovery email or secret code did not match our records for this username")

        if len(new_password) < 4:
            raise ValueError("New password must be at least 4 characters long")

        user["password_hash"] = self._hash_password(new_password)
        self._write_users(users)
        return True

    def register_user(self, username: str, password: str, name: str, email: str, role: str = "Student", recovery_code: str = "") -> Dict[str, Any]:
        users = self._read_users()
        user_key = username.strip().lower()
        if user_key in users:
            raise ValueError(f"Username '{username}' already exists")
        if len(password) < 4:
            raise ValueError("Password must be at least 4 characters long")

        new_user = {
            "id": f"usr_{uuid.uuid4().hex[:8]}",
            "username": user_key,
            "password_hash": self._hash_password(password),
            "name": name.strip() or username,
            "role": role.strip() or "Student",
            "email": email.strip() or f"{user_key}@studyassistant.ai",
            "recovery_code": recovery_code.strip() or "STUDY2026",
            "created_at": datetime.now().strftime("%b %d, %Y"),
        }
        users[user_key] = new_user
        self._write_users(users)

        return {
            "id": new_user["id"],
            "username": new_user["username"],
            "name": new_user["name"],
            "role": new_user["role"],
            "email": new_user["email"],
            "created_at": new_user["created_at"]
        }

    def get_all_users(self) -> List[Dict[str, Any]]:
        users = self._read_users()
        output = []
        for u in users.values():
            output.append({
                "id": u["id"],
                "username": u["username"],
                "name": u["name"],
                "role": u["role"],
                "email": u["email"],
                "created_at": u.get("created_at", "2026"),
                "recovery_code": u.get("recovery_code", "STUDY2026")
            })
    def delete_user(self, username: str) -> bool:
        users = self._read_users()
        user_key = username.strip().lower()
        if user_key == "admin":
            raise ValueError("The primary admin account cannot be deleted")
        if user_key not in users:
            raise ValueError("User not found")
        del users[user_key]
        self._write_users(users)
        return True

    def admin_reset_password(self, target_username: str, new_password: str) -> bool:
        users = self._read_users()
        user_key = target_username.strip().lower()
        if user_key not in users:
            raise ValueError("User not found")
        if len(new_password) < 4:
            raise ValueError("New password must be at least 4 characters long")
        users[user_key]["password_hash"] = self._hash_password(new_password)
        self._write_users(users)
        return True

auth_service = AuthService()
