from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
import json
import os
import uuid

DATA_PATH = os.path.join(os.path.dirname(__file__), "data.json")

app = FastAPI(title="Cosmetics Site API")

# Allow frontend to call backend locally
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Models ----------
class ProductIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    price_gbp: float = Field(gt=0)
    description: str = Field(min_length=1, max_length=500)
    image_url: Optional[str] = ""

class Product(ProductIn):
    id: str

class ContactMessageIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=200)
    message_type: str = Field(default="where_to_buy")  # "where_to_buy" or "distributor"
    message: str = Field(min_length=5, max_length=2000)

class ContactMessage(ContactMessageIn):
    id: str


# ---------- Helpers ----------
def read_data() -> dict:
    if not os.path.exists(DATA_PATH):
        return {"products": [], "messages": []}
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def write_data(data: dict) -> None:
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


class SiteContent(BaseModel):
    brand_name: str
    tagline: str
    hero_note: str
    about_title: str
    about_body: str
    contact_title: str
    contact_note: str
    socials: dict

@app.get("/site", response_model=SiteContent)
def get_site():
    data = read_data()
    return data.get("site", {})

@app.put("/site", response_model=SiteContent)
def update_site(content: SiteContent):
    # Batch 2B: protect with admin auth
    data = read_data()
    data["site"] = content.model_dump()
    write_data(data)
    return data["site"]


# ---------- Routes ----------
@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/products", response_model=List[Product])
def list_products():
    data = read_data()
    return data["products"]

@app.post("/products", response_model=Product)
def add_product(product: ProductIn):
    data = read_data()
    new_item = product.model_dump()
    new_item["id"] = str(uuid.uuid4())
    data["products"].append(new_item)
    write_data(data)
    return new_item

@app.delete("/products/{product_id}")
def delete_product(product_id: str):
    data = read_data()
    before = len(data["products"])
    data["products"] = [p for p in data["products"] if p["id"] != product_id]
    after = len(data["products"])
    if before == after:
        raise HTTPException(status_code=404, detail="Product not found")
    write_data(data)
    return {"deleted": product_id}

@app.post("/contact", response_model=ContactMessage)
def submit_message(msg: ContactMessageIn):
    data = read_data()
    new_msg = msg.model_dump()
    new_msg["id"] = str(uuid.uuid4())
    data["messages"].append(new_msg)
    write_data(data)
    return new_msg

@app.get("/admin/messages", response_model=List[ContactMessage])
def admin_list_messages():
    # Batch 2: protect this with login/auth
    data = read_data()
    return data["messages"]
