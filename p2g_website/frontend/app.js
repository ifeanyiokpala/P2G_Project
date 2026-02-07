const API_BASE = "http://127.0.0.1:8000";

async function fetchProducts() {
  const res = await fetch(`${API_BASE}/products`);
  return await res.json();
}

function productCard(p, { showDelete = false } = {}) {
  const img = p.image_url ? `<img src="${p.image_url}" alt="${p.name}" style="width:100%;border-radius:14px;max-height:160px;object-fit:cover;border:1px solid rgba(255,255,255,0.08);" />`
                          : `<div class="badge">Photo coming soon</div>`;

  const delBtn = showDelete
    ? `<button class="secondary" data-del="${p.id}" style="margin-top:10px;">Remove</button>`
    : "";

  return `
    <div class="card">
      ${img}
      <h3>${p.name}</h3>
      <p>${p.description}</p>
      <div class="price">£${Number(p.price_gbp).toFixed(2)}</div>
      ${delBtn}
    </div>
  `;
}

async function renderProducts() {
  const el = document.getElementById("productGrid");
  if (!el) return;

  const products = await fetchProducts();
  el.innerHTML = products.map(p => productCard(p)).join("");
}

// --- Admin add/remove (simple demo; Batch 2: add real auth) ---
async function addProduct(payload) {
  const res = await fetch(`${API_BASE}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to add product");
  return await res.json();
}

async function deleteProduct(id) {
  const res = await fetch(`${API_BASE}/products/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete product");
  return await res.json();
}

async function renderAdminProducts() {
  const el = document.getElementById("adminGrid");
  if (!el) return;

  const products = await fetchProducts();
  el.innerHTML = products.map(p => productCard(p, { showDelete: true })).join("");

  el.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-del");
      await deleteProduct(id);
      await renderAdminProducts();
      await renderProducts();
    });
  });
}

function wireAdminForm() {
  const form = document.getElementById("adminForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name.value.trim(),
      price_gbp: Number(form.price_gbp.value),
      description: form.description.value.trim(),
      image_url: form.image_url.value.trim()
    };
    await addProduct(payload);
    form.reset();
    await renderAdminProducts();
    await renderProducts();
  });
}

// --- Contact form ---
async function sendContact(payload) {
  const res = await fetch(`${API_BASE}/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to send message");
  return await res.json();
}

function wireContactForm() {
  const form = document.getElementById("contactForm");
  const status = document.getElementById("contactStatus");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "Sending...";
    try {
      const payload = {
        name: form.name.value.trim(),
        email: form.email.value.trim(),
        message_type: form.message_type.value,
        message: form.message.value.trim()
      };
      await sendContact(payload);
      form.reset();
      status.textContent = "Sent! We’ll get back to you soon.";
    } catch (err) {
      status.textContent = "Something went wrong. Try again.";
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await renderProducts();
  await renderAdminProducts();
  wireAdminForm();
  wireContactForm();
});
