from dotenv import load_dotenv
from pathlib import Path
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, UploadFile, File, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import logging
from pydantic import BaseModel, Field, ConfigDict, BeforeValidator
from typing import List, Optional, Annotated
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import requests
from bson import ObjectId

# ---------------- DB ----------------
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ---------------- Auth helpers ----------------
JWT_ALGORITHM = "HS256"

def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ---------------- Object storage ----------------
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "yogi-internet"
storage_key = None

def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data, timeout=120,
        )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    if resp.status_code == 404:
        key = init_storage(force=True)
        resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ---------------- Models ----------------
PyObjectId = Annotated[str, BeforeValidator(str)]

def now_iso():
    return datetime.now(timezone.utc).isoformat()

class ApplicationBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    short_description: str = ""
    full_description: str = ""
    category: str = ""
    keywords: List[str] = []
    start_date: Optional[str] = None
    last_date: Optional[str] = None
    status: str = "Open"
    apply_url: Optional[str] = None
    documents_required: List[str] = []
    important_instructions: str = ""
    thumbnail_url: Optional[str] = None
    trending: bool = False
    published: bool = True
    order: int = 0

class Application(ApplicationBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)

class CategoryModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    order: int = 0

class DocumentModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    order: int = 0

class Settings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    brand_name: str = "YOGI INTERNET"
    location_text: str = "GAURIBIDANURU"
    about: str = ("YOGI INTERNET is an internet & online service centre in Gauribidanuru that helps "
                  "customers with online applications, government services, documents and other "
                  "internet-related services.")
    landline: str = ""
    whatsapp: str = ""
    gmail: str = ""
    footer_info: str = ""

class LoginInput(BaseModel):
    email: str
    password: str

# ---------------- App ----------------
app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

DEFAULT_CATEGORIES = [
    "Government Services", "Education", "Jobs", "Scholarships", "Certificates",
    "Banking", "Insurance", "Online Applications", "Other Services",
]

def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ---------------- Auth routes ----------------
@api_router.post("/auth/login")
async def login(data: LoginInput):
    email = data.email.strip().lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(str(user["_id"]), email)
    return {
        "token": token,
        "user": {"id": str(user["_id"]), "email": user["email"], "name": user.get("name", "Admin"), "role": user.get("role", "admin")},
    }

@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"id": user["_id"], "email": user["email"], "name": user.get("name", "Admin"), "role": user.get("role", "admin")}

# ---------------- Public: applications ----------------
@api_router.get("/applications")
async def list_public_applications():
    docs = await db.applications.find({"published": True}).sort("order", 1).to_list(1000)
    return [Application(**{k: v for k, v in d.items() if k != "_id"}).model_dump() for d in docs]

@api_router.get("/applications/{app_id}")
async def get_application(app_id: str):
    d = await db.applications.find_one({"id": app_id})
    if not d:
        raise HTTPException(status_code=404, detail="Application not found")
    if not d.get("published", True):
        raise HTTPException(status_code=404, detail="Application not found")
    return Application(**{k: v for k, v in d.items() if k != "_id"}).model_dump()

# ---------------- Public: categories, documents, settings ----------------
@api_router.get("/categories")
async def list_categories():
    docs = await db.categories.find().sort("order", 1).to_list(1000)
    return [CategoryModel(**{k: v for k, v in d.items() if k != "_id"}).model_dump() for d in docs]

@api_router.get("/documents")
async def list_documents():
    docs = await db.documents.find().sort("order", 1).to_list(1000)
    return [DocumentModel(**{k: v for k, v in d.items() if k != "_id"}).model_dump() for d in docs]

@api_router.get("/settings")
async def get_settings():
    d = await db.settings.find_one({"_id": "site"})
    if not d:
        return Settings().model_dump()
    return Settings(**{k: v for k, v in d.items() if k != "_id"}).model_dump()

@api_router.get("/files/{path:path}")
async def download_file(path: str):
    try:
        data, content_type = get_object(path)
        return Response(content=data, media_type=content_type)
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")

# ---------------- Admin: applications CRUD ----------------
@api_router.get("/admin/applications")
async def admin_list_applications(user: dict = Depends(require_admin)):
    docs = await db.applications.find().sort("order", 1).to_list(1000)
    return [Application(**{k: v for k, v in d.items() if k != "_id"}).model_dump() for d in docs]

@api_router.post("/admin/applications")
async def create_application(data: ApplicationBase, user: dict = Depends(require_admin)):
    count = await db.applications.count_documents({})
    payload = data.model_dump()
    payload["order"] = count
    obj = Application(**payload)
    await db.applications.insert_one(obj.model_dump())
    return obj.model_dump()

@api_router.put("/admin/applications/{app_id}")
async def update_application(app_id: str, data: ApplicationBase, user: dict = Depends(require_admin)):
    existing = await db.applications.find_one({"id": app_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Application not found")
    update = data.model_dump()
    update["updated_at"] = now_iso()
    await db.applications.update_one({"id": app_id}, {"$set": update})
    d = await db.applications.find_one({"id": app_id})
    return Application(**{k: v for k, v in d.items() if k != "_id"}).model_dump()

@api_router.patch("/admin/applications/{app_id}")
async def patch_application(app_id: str, payload: dict, user: dict = Depends(require_admin)):
    existing = await db.applications.find_one({"id": app_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Application not found")
    allowed = {"published", "trending", "order", "status"}
    update = {k: v for k, v in payload.items() if k in allowed}
    update["updated_at"] = now_iso()
    await db.applications.update_one({"id": app_id}, {"$set": update})
    d = await db.applications.find_one({"id": app_id})
    return Application(**{k: v for k, v in d.items() if k != "_id"}).model_dump()

@api_router.delete("/admin/applications/{app_id}")
async def delete_application(app_id: str, user: dict = Depends(require_admin)):
    res = await db.applications.delete_one({"id": app_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"success": True}

# ---------------- Admin: image upload ----------------
@api_router.post("/admin/upload")
async def upload_image(file: UploadFile = File(...), user: dict = Depends(require_admin)):
    ext = file.filename.split(".")[-1].lower() if "." in file.filename else "bin"
    path = f"{APP_NAME}/uploads/{uuid.uuid4()}.{ext}"
    data = await file.read()
    result = put_object(path, data, file.content_type or "application/octet-stream")
    backend_url = os.environ.get("REACT_APP_BACKEND_URL", "")
    url = f"/api/files/{result['path']}"
    return {"url": url, "path": result["path"]}

# ---------------- Admin: categories ----------------
@api_router.post("/admin/categories")
async def create_category(payload: dict, user: dict = Depends(require_admin)):
    count = await db.categories.count_documents({})
    obj = CategoryModel(name=payload["name"], order=count)
    await db.categories.insert_one(obj.model_dump())
    return obj.model_dump()

@api_router.put("/admin/categories/{cat_id}")
async def update_category(cat_id: str, payload: dict, user: dict = Depends(require_admin)):
    await db.categories.update_one({"id": cat_id}, {"$set": {"name": payload["name"]}})
    d = await db.categories.find_one({"id": cat_id})
    if not d:
        raise HTTPException(status_code=404, detail="Category not found")
    return CategoryModel(**{k: v for k, v in d.items() if k != "_id"}).model_dump()

@api_router.delete("/admin/categories/{cat_id}")
async def delete_category(cat_id: str, user: dict = Depends(require_admin)):
    await db.categories.delete_one({"id": cat_id})
    return {"success": True}

# ---------------- Admin: documents ----------------
@api_router.post("/admin/documents")
async def create_document(payload: dict, user: dict = Depends(require_admin)):
    count = await db.documents.count_documents({})
    obj = DocumentModel(name=payload["name"], order=count)
    await db.documents.insert_one(obj.model_dump())
    return obj.model_dump()

@api_router.put("/admin/documents/{doc_id}")
async def update_document(doc_id: str, payload: dict, user: dict = Depends(require_admin)):
    update = {}
    if "name" in payload:
        update["name"] = payload["name"]
    if "order" in payload:
        update["order"] = payload["order"]
    await db.documents.update_one({"id": doc_id}, {"$set": update})
    d = await db.documents.find_one({"id": doc_id})
    if not d:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentModel(**{k: v for k, v in d.items() if k != "_id"}).model_dump()

@api_router.delete("/admin/documents/{doc_id}")
async def delete_document(doc_id: str, user: dict = Depends(require_admin)):
    await db.documents.delete_one({"id": doc_id})
    return {"success": True}

# ---------------- Admin: settings ----------------
@api_router.put("/admin/settings")
async def update_settings(data: Settings, user: dict = Depends(require_admin)):
    doc = data.model_dump()
    doc["_id"] = "site"
    await db.settings.update_one({"_id": "site"}, {"$set": doc}, upsert=True)
    return data.model_dump()

# ---------------- Admin: dashboard ----------------
@api_router.get("/admin/stats")
async def admin_stats(user: dict = Depends(require_admin)):
    total = await db.applications.count_documents({})
    trending = await db.applications.count_documents({"trending": True})
    published = await db.applications.count_documents({"published": True})
    unpublished = await db.applications.count_documents({"published": False})
    # ending soon: last_date within next 7 days
    ending_soon = 0
    now = datetime.now(timezone.utc)
    soon = now + timedelta(days=7)
    docs = await db.applications.find({"last_date": {"$ne": None}}).to_list(1000)
    for d in docs:
        ld = d.get("last_date")
        if not ld:
            continue
        try:
            dt = datetime.fromisoformat(ld.replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            if now <= dt <= soon:
                ending_soon += 1
        except Exception:
            continue
    return {
        "total": total,
        "trending": trending,
        "published": published,
        "unpublished": unpublished,
        "ending_soon": ending_soon,
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    # storage
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    # indexes
    try:
        await db.users.create_index("email", unique=True)
        await db.applications.create_index("id", unique=True)
    except Exception as e:
        logger.error(f"Index creation issue: {e}")
    # seed admins
    admin_emails = [e.strip().lower() for e in os.environ.get("ADMIN_EMAILS", "").split(",") if e.strip()]
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    for email in admin_emails:
        existing = await db.users.find_one({"email": email})
        if existing is None:
            await db.users.insert_one({
                "email": email,
                "password_hash": hash_password(admin_password),
                "name": "Admin",
                "role": "admin",
                "created_at": now_iso(),
            })
            logger.info(f"Seeded admin {email}")
        elif not verify_password(admin_password, existing["password_hash"]):
            await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(admin_password)}})
    # seed categories if none
    if await db.categories.count_documents({}) == 0:
        for i, name in enumerate(DEFAULT_CATEGORIES):
            await db.categories.insert_one(CategoryModel(name=name, order=i).model_dump())
    # ensure settings exists
    if await db.settings.find_one({"_id": "site"}) is None:
        doc = Settings().model_dump()
        doc["_id"] = "site"
        await db.settings.insert_one(doc)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
