"""Backend API tests for YOGI INTERNET portal."""
import os
import pytest
import requests
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else None
if not BASE_URL:
    # fall back to frontend .env
    fe = Path("/app/frontend/.env").read_text()
    for line in fe.splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
            break

ADMIN_EMAIL = "prabhassudeep38@gmail.com"
ADMIN_PASSWORD = "Yogi@31184"


@pytest.fixture(scope="session")
def token():
    r = requests.post(f"{BASE_URL}/api/auth/login",
                      json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    body = r.json()
    assert "token" in body and "user" in body
    assert body["user"]["email"] == ADMIN_EMAIL
    assert body["user"]["role"] == "admin"
    return body["token"]


@pytest.fixture(scope="session")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---------------- Auth ----------------
class TestAuth:
    def test_login_invalid(self):
        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": ADMIN_EMAIL, "password": "wrongpass"}, timeout=30)
        assert r.status_code == 401

    def test_login_second_admin(self):
        r = requests.post(f"{BASE_URL}/api/auth/login",
                          json={"email": "g1yogimelyagp@gmail.com", "password": ADMIN_PASSWORD}, timeout=30)
        assert r.status_code == 200

    def test_me_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/auth/me", timeout=30)
        assert r.status_code == 401

    def test_me_with_token(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=auth_headers, timeout=30)
        assert r.status_code == 200
        assert r.json()["role"] == "admin"


# ---------------- Public routes ----------------
class TestPublic:
    def test_applications_list(self):
        r = requests.get(f"{BASE_URL}/api/applications", timeout=30)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_categories_seeded(self):
        r = requests.get(f"{BASE_URL}/api/categories", timeout=30)
        assert r.status_code == 200
        cats = r.json()
        assert len(cats) >= 9
        names = [c["name"] for c in cats]
        assert "Scholarships" in names

    def test_documents_list(self):
        r = requests.get(f"{BASE_URL}/api/documents", timeout=30)
        assert r.status_code == 200

    def test_settings(self):
        r = requests.get(f"{BASE_URL}/api/settings", timeout=30)
        assert r.status_code == 200
        assert "brand_name" in r.json()


# ---------------- Admin auth guard ----------------
class TestAdminGuard:
    @pytest.mark.parametrize("path,method", [
        ("/api/admin/applications", "GET"),
        ("/api/admin/applications", "POST"),
        ("/api/admin/stats", "GET"),
        ("/api/admin/settings", "PUT"),
        ("/api/admin/categories", "POST"),
        ("/api/admin/documents", "POST"),
    ])
    def test_admin_requires_token(self, path, method):
        r = requests.request(method, f"{BASE_URL}{path}", json={}, timeout=30)
        assert r.status_code in (401, 403), f"{method} {path} -> {r.status_code}"


# ---------------- Application CRUD ----------------
class TestApplicationCRUD:
    created_id = None

    def test_create_application(self, auth_headers):
        payload = {
            "name": "TEST_App Scholarship",
            "short_description": "Test scholarship",
            "full_description": "Full description",
            "category": "Scholarships",
            "keywords": ["scholarship", "test"],
            "start_date": "2026-01-01",
            "last_date": "2026-01-05",
            "status": "Open",
            "apply_url": "https://example.com",
            "documents_required": ["Aadhaar Card"],
            "important_instructions": "Be careful",
            "thumbnail_url": "",
            "trending": True,
            "published": True,
        }
        r = requests.post(f"{BASE_URL}/api/admin/applications", json=payload, headers=auth_headers, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == payload["name"]
        assert data["trending"] is True
        assert "id" in data
        TestApplicationCRUD.created_id = data["id"]

    def test_get_application_public(self):
        r = requests.get(f"{BASE_URL}/api/applications/{TestApplicationCRUD.created_id}", timeout=30)
        assert r.status_code == 200
        assert r.json()["name"] == "TEST_App Scholarship"

    def test_appears_in_public_list(self):
        r = requests.get(f"{BASE_URL}/api/applications", timeout=30)
        ids = [a["id"] for a in r.json()]
        assert TestApplicationCRUD.created_id in ids

    def test_update_application(self, auth_headers):
        payload = {
            "name": "TEST_App Updated",
            "short_description": "Updated",
            "full_description": "u",
            "category": "Scholarships",
            "keywords": [],
            "start_date": "2026-01-01",
            "last_date": "2026-01-05",
            "status": "Open",
            "apply_url": "https://example.com",
            "documents_required": ["Aadhaar Card"],
            "important_instructions": "",
            "thumbnail_url": "",
            "trending": True,
            "published": True,
        }
        r = requests.put(f"{BASE_URL}/api/admin/applications/{TestApplicationCRUD.created_id}",
                         json=payload, headers=auth_headers, timeout=30)
        assert r.status_code == 200
        assert r.json()["name"] == "TEST_App Updated"

    def test_patch_unpublish(self, auth_headers):
        r = requests.patch(f"{BASE_URL}/api/admin/applications/{TestApplicationCRUD.created_id}",
                           json={"published": False}, headers=auth_headers, timeout=30)
        assert r.status_code == 200
        # Should now not appear on public list
        r2 = requests.get(f"{BASE_URL}/api/applications", timeout=30)
        ids = [a["id"] for a in r2.json()]
        assert TestApplicationCRUD.created_id not in ids
        # And public GET by id 404
        r3 = requests.get(f"{BASE_URL}/api/applications/{TestApplicationCRUD.created_id}", timeout=30)
        assert r3.status_code == 404

    def test_patch_trending_toggle(self, auth_headers):
        r = requests.patch(f"{BASE_URL}/api/admin/applications/{TestApplicationCRUD.created_id}",
                           json={"trending": False, "published": True}, headers=auth_headers, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["trending"] is False
        assert d["published"] is True

    def test_stats(self, auth_headers):
        r = requests.get(f"{BASE_URL}/api/admin/stats", headers=auth_headers, timeout=30)
        assert r.status_code == 200
        data = r.json()
        for k in ["total", "trending", "published", "unpublished", "ending_soon"]:
            assert k in data
        assert data["total"] >= 1

    def test_delete_application(self, auth_headers):
        r = requests.delete(f"{BASE_URL}/api/admin/applications/{TestApplicationCRUD.created_id}",
                            headers=auth_headers, timeout=30)
        assert r.status_code == 200
        r2 = requests.get(f"{BASE_URL}/api/applications/{TestApplicationCRUD.created_id}", timeout=30)
        assert r2.status_code == 404


# ---------------- Categories ----------------
class TestCategories:
    cat_id = None

    def test_create(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/admin/categories",
                          json={"name": "TEST_Category"}, headers=auth_headers, timeout=30)
        assert r.status_code == 200
        TestCategories.cat_id = r.json()["id"]

    def test_appears_public(self):
        r = requests.get(f"{BASE_URL}/api/categories", timeout=30)
        names = [c["name"] for c in r.json()]
        assert "TEST_Category" in names

    def test_update(self, auth_headers):
        r = requests.put(f"{BASE_URL}/api/admin/categories/{TestCategories.cat_id}",
                        json={"name": "TEST_Category2"}, headers=auth_headers, timeout=30)
        assert r.status_code == 200
        assert r.json()["name"] == "TEST_Category2"

    def test_delete(self, auth_headers):
        r = requests.delete(f"{BASE_URL}/api/admin/categories/{TestCategories.cat_id}",
                            headers=auth_headers, timeout=30)
        assert r.status_code == 200


# ---------------- Documents ----------------
class TestDocuments:
    doc_id = None

    def test_create(self, auth_headers):
        r = requests.post(f"{BASE_URL}/api/admin/documents",
                          json={"name": "TEST_Doc"}, headers=auth_headers, timeout=30)
        assert r.status_code == 200
        TestDocuments.doc_id = r.json()["id"]

    def test_update_order(self, auth_headers):
        r = requests.put(f"{BASE_URL}/api/admin/documents/{TestDocuments.doc_id}",
                        json={"name": "TEST_Doc2", "order": 5}, headers=auth_headers, timeout=30)
        assert r.status_code == 200
        assert r.json()["order"] == 5

    def test_delete(self, auth_headers):
        r = requests.delete(f"{BASE_URL}/api/admin/documents/{TestDocuments.doc_id}",
                            headers=auth_headers, timeout=30)
        assert r.status_code == 200


# ---------------- Settings ----------------
class TestSettings:
    def test_update_and_persist(self, auth_headers):
        payload = {
            "brand_name": "YOGI INTERNET",
            "location_text": "GAURIBIDANURU",
            "about": "Test about",
            "landline": "080-1234567",
            "whatsapp": "+919999999999",
            "gmail": "test@yogi.com",
            "footer_info": "Footer text",
        }
        r = requests.put(f"{BASE_URL}/api/admin/settings", json=payload, headers=auth_headers, timeout=30)
        assert r.status_code == 200
        # GET public
        r2 = requests.get(f"{BASE_URL}/api/settings", timeout=30)
        assert r2.json()["landline"] == "080-1234567"
        assert r2.json()["whatsapp"] == "+919999999999"
