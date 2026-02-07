const API_BASE = "http://127.0.0.1:8000";

async function getJSON(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`Request failed: ${path}`);
  return await res.json();
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "";
}

function setHref(id, value) {
  const el = document.getElementById(id);
  if (el) el.href = value || "#";
}

function productCard(p) {
  const img = p.image_url
    ? `<div class="p-img"><img src="${p.image_url}" alt="${p.name}"></div>`
    : `<div class="p-img"><span class="badge">Image coming soon</span></div>`;

  return `
    <div class="card">
      ${img}
      <div class="p-name">${p.name}</div>
      <p class="p-desc">${p.description}</p>

      <div class="p-actions">
        <a class="p-link" href="#contact">Where to buy</a>
        <a class="p-link" href="#contact">Distributor</a>
      </div>
    </div>
  `;
}

async function renderSite() {
  const site = await getJSON("/site");

  setText("brandName", site.brand_name);
  setText("brandName2", site.brand_name);
  setText("tagline", site.tagline);
  setText("heroNote", site.hero_note);

  setText("aboutTitle", site.about_title);
  const aboutBody = document.getElementById("aboutBody");
  if (aboutBody) aboutBody.textContent = site.about_body || "";

  setText("contactTitle", site.contact_title);
  setText("contactNote", site.contact_note);

  const ig = site?.socials?.instagram || "#";
  const fb = site?.socials?.facebook || "#";
  setHref("igLink", ig);
  setHref("igLink2", ig);
  setHref("fbLink", fb);
  setHref("fbLink2", fb);

  setText("year", String(new Date().getFullYear()));
}

async function renderProducts() {
  const products = await getJSON("/products");
  const grid = document.getElementById("productGrid");
  if (!grid) return;
  grid.innerHTML = products.map(productCard).join("");
}

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
      status.textContent = "Sent. We’ll get back to you soon.";
    } catch {
      status.textContent = "Could not send — please try again.";
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await renderSite();
    await renderProducts();
    wireContactForm();
  } catch (e) {
    console.error(e);
  }
});
