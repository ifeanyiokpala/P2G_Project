from fastapi import FastAPI, HTTPException, Depends, Header, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import List, Optional
import json
import os
import uuid
import jwt
import time
import shutil

DATA_PATH = os.path.join(os.path.dirname(__file__), "data.json")
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")

os.makedirs(UPLOAD_DIR, exist_ok=True)

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "ChangeMeNow123!")
JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret")
JWT_ALG = "HS256"
TOKEN_TTL_SECONDS = 60 * 60 * 8

app = FastAPI(title="Cosmetics Site API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


class ProductIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=500)


class Product(ProductIn):
    id: str
    image_path: Optional[str] = ""


class ContactMessageIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=200)
    message_type: str = Field(default="where_to_buy")
    message: str = Field(min_length=5, max_length=2000)


class ContactMessage(ContactMessageIn):
    id: str


class LoginIn(BaseModel):
    username: str
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"


class SiteContent(BaseModel):
    brand_name: str
    tagline: str
    hero_note: str
    about_title: str
    about_body: str
    contact_title: str
    contact_note: str
    socials: dict
    hero_images: Optional[List[str]] = []


def default_data():
    return {
        "site": {
            "brand_name": "",
            "tagline": "",
            "hero_note": "",
            "about_title": "",
            "about_body": "",
            "contact_title": "",
            "contact_note": "",
            "socials": {},
            "hero_images": []
        },
        "products": [],
        "messages": []
    }


def read_data():
    if not os.path.exists(DATA_PATH):
        return default_data()

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    merged = default_data()
    merged.update(data)
    if "site" in data:
        merged["site"].update(data["site"])
    return merged


def write_data(data):
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def create_token(username: str):
    now = int(time.time())
    payload = {"sub": username, "iat": now, "exp": now + TOKEN_TTL_SECONDS}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


def verify_token(auth_header: Optional[str]):
    if not auth_header or not auth_header.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing token")

    token = auth_header.split(" ", 1)[1].strip()

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        return payload.get("sub", "")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def admin_required(authorization: Optional[str] = Header(default=None)):
    sub = verify_token(authorization)
    if sub != ADMIN_USERNAME:
        raise HTTPException(status_code=403, detail="Forbidden")
    return True


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/site", response_model=SiteContent)
def get_site():
    data = read_data()
    return data["site"]


@app.put("/site", response_model=SiteContent, dependencies=[Depends(admin_required)])
def update_site(content: SiteContent):
    data = read_data()

    existing_site = data.get("site", {})
    incoming = content.model_dump(exclude_unset=True)

    if "hero_images" not in incoming or incoming["hero_images"] is None:
        incoming["hero_images"] = existing_site.get("hero_images", [])

    data["site"] = {**existing_site, **incoming}
    write_data(data)
    return data["site"]


@app.post("/site/hero-images", dependencies=[Depends(admin_required)])
def upload_hero_image(
    filename: str = Form(...),
    image: Optional[UploadFile] = File(default=None)
):
    if not image or not image.filename:
        raise HTTPException(status_code=400, detail="Image file is required")

    data = read_data()

    safe_name = filename.strip().replace(" ", "_")
    if not safe_name:
        raise HTTPException(status_code=400, detail="File name is required")

    ext = os.path.splitext(image.filename)[1].lower()
    final_filename = f"{safe_name}{ext}"
    full_path = os.path.join(UPLOAD_DIR, final_filename)

    if os.path.exists(full_path):
        raise HTTPException(status_code=400, detail="File name already exists")

    with open(full_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    image_path = f"/uploads/{final_filename}"

    hero_images = data["site"].get("hero_images", [])
    if image_path not in hero_images:
        hero_images.append(image_path)
        data["site"]["hero_images"] = hero_images
        write_data(data)

    return {"image_path": image_path, "hero_images": hero_images}


@app.delete("/site/hero-images", dependencies=[Depends(admin_required)])
def delete_hero_image(image_path: str):
    data = read_data()
    hero_images = data["site"].get("hero_images", [])

    if image_path not in hero_images:
        raise HTTPException(status_code=404, detail="Hero image not found")

    data["site"]["hero_images"] = [img for img in hero_images if img != image_path]

    try:
        os.remove(os.path.join(UPLOAD_DIR, os.path.basename(image_path)))
    except FileNotFoundError:
        pass

    write_data(data)
    return {"deleted": image_path, "hero_images": data["site"]["hero_images"]}


@app.get("/products", response_model=List[Product])
def list_products():
    data = read_data()
    return data["products"]


@app.post("/products", response_model=Product, dependencies=[Depends(admin_required)])
def add_product(
    name: str = Form(...),
    description: str = Form(...),
    filename: str = Form(...),   # NEW
    image: Optional[UploadFile] = File(default=None)
):
    data = read_data()

    # clean filename
    safe_name = filename.strip().replace(" ", "_")

    ext = os.path.splitext(image.filename)[1].lower() if image else ".png"
    final_filename = f"{safe_name}{ext}"

    full_path = os.path.join(UPLOAD_DIR, final_filename)

    # prevent overwrite
    if os.path.exists(full_path):
        raise HTTPException(status_code=400, detail="File name already exists")

    if image:
        with open(full_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)

    product = {
        "id": safe_name,
        "name": name,
        "description": description,
        "image_path": f"/uploads/{final_filename}"
    }

    data["products"].append(product)
    write_data(data)
    return product


@app.put("/products/{product_id}", response_model=Product, dependencies=[Depends(admin_required)])
def update_product(
    product_id: str,
    name: str = Form(...),
    description: str = Form(...),
    filename: str = Form(...),  # NEW
    image: Optional[UploadFile] = File(default=None)
):
    data = read_data()

    for p in data["products"]:
        if p["id"] == product_id:

            safe_name = filename.strip().replace(" ", "_")
            ext = os.path.splitext(image.filename)[1].lower() if image else ".png"
            final_filename = f"{safe_name}{ext}"

            full_path = os.path.join(UPLOAD_DIR, final_filename)

            if image:
                with open(full_path, "wb") as buffer:
                    shutil.copyfileobj(image.file, buffer)

                p["image_path"] = f"/uploads/{final_filename}"

            p["id"] = safe_name
            p["name"] = name
            p["description"] = description

            write_data(data)
            return p

    raise HTTPException(status_code=404, detail="Product not found")


@app.delete("/products/{product_id}", dependencies=[Depends(admin_required)])
def delete_product(product_id: str):
    data = read_data()

    for p in data["products"]:
        if p["id"] == product_id:
            if p.get("image_path"):
                try:
                    os.remove(os.path.join(UPLOAD_DIR, os.path.basename(p["image_path"])))
                except FileNotFoundError:
                    pass

            data["products"].remove(p)
            write_data(data)
            return {"deleted": product_id}

    raise HTTPException(status_code=404, detail="Product not found")


@app.post("/contact", response_model=ContactMessage)
def submit_message(msg: ContactMessageIn):
    data = read_data()
    new_msg = msg.model_dump()
    new_msg["id"] = str(uuid.uuid4())
    data["messages"].append(new_msg)
    write_data(data)
    return new_msg


@app.get("/admin/messages", response_model=List[ContactMessage], dependencies=[Depends(admin_required)])
def admin_list_messages():
    data = read_data()
    return data["messages"]


@app.post("/auth/login", response_model=TokenOut)
def login(payload: LoginIn):
    if payload.username != ADMIN_USERNAME or payload.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"access_token": create_token(payload.username)}