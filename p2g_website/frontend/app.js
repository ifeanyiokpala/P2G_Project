const API_BASE = "http://127.0.0.1:8000";

let heroImages = [];
let heroIndex = 0;

let productsData = [];
let productIndex = 0;

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

function setImage(id, path, fallbackDisplay = "none") {
  const el = document.getElementById(id);
  if (!el) return;

  if (path) {
    el.src = `${API_BASE}${path}`;
    el.style.display = "";
  } else {
    el.src = "";
    el.style.display = fallbackDisplay;
  }
}

function updateHeroImage() {
  const img = document.getElementById("heroImage");
  if (!img) return;

  if (!heroImages.length) {
    img.src = "";
    return;
  }

  img.src = `${API_BASE}${heroImages[heroIndex]}`;
}

function nextHero() {
  if (!heroImages.length) return;
  heroIndex = (heroIndex + 1) % heroImages.length;
  updateHeroImage();
}

function prevHero() {
  if (!heroImages.length) return;
  heroIndex = (heroIndex - 1 + heroImages.length) % heroImages.length;
  updateHeroImage();
}

function productCard(p) {
  const imageHtml = p.image_path
    ? `<div class="product-image"><img src="${API_BASE}${p.image_path}" alt="${p.name}" class="clickable-image" /></div>`
    : `<div class="product-image"><span>Image coming soon</span></div>`;

  return `
    <div class="product-card">
      ${imageHtml}
      <div class="product-body">
        <h3>${p.name}</h3>
        <p>${p.description}</p>
      </div>
    </div>
  `;
}

function getVisibleCount() {
  if (window.innerWidth <= 640) return 1;
  if (window.innerWidth <= 980) return 2;
  return 3;
}

function renderProductTrack() {
  const track = document.getElementById("productTrack");
  if (!track) return;
  track.innerHTML = productsData.map(productCard).join("");
  updateProductSlider();
  enableImagePreview();
}

function updateProductSlider() {
  const track = document.getElementById("productTrack");
  if (!track) return;

  const visible = getVisibleCount();
  const card = track.querySelector(".product-card");
  if (!card) return;

  const gap = 16;
  const move = card.offsetWidth + gap;
  const maxIndex = Math.max(0, productsData.length - visible);

  if (productIndex > maxIndex) {
    productIndex = maxIndex;
  }

  track.style.transform = `translateX(-${productIndex * move}px)`;
}

function nextProducts() {
  const visible = getVisibleCount();
  const maxIndex = Math.max(0, productsData.length - visible);
  if (productIndex < maxIndex) {
    productIndex += 1;
    updateProductSlider();
  }
}

function prevProducts() {
  if (productIndex > 0) {
    productIndex -= 1;
    updateProductSlider();
  }
}

async function renderSite() {
  const site = await getJSON("/site");

  setText("brandName", site.brand_name);
  setText("brandName2", site.brand_name);
  setText("brandNameHero", site.brand_name);
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

  // Header logo
  setImage("siteLogo", site.logo_path || "", "none");

  // Transparent hero overlay logo
  setImage("heroOverlayLogo", site.hero_logo_path || "", "none");

  heroImages = site.hero_images || [];
  heroIndex = 0;
  updateHeroImage();

  setText("year", String(new Date().getFullYear()));
}

async function renderProducts() {
  productsData = await getJSON("/products");
  productIndex = 0;
  renderProductTrack();
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

function enableImagePreview() {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("imageModalImg");
  const closeBtn = document.getElementById("imageModalClose");

  document.querySelectorAll(".clickable-image").forEach(img => {
    img.addEventListener("click", () => {
      modal.style.display = "flex";
      modalImg.src = img.src;
    });
  });

  closeBtn.onclick = () => {
    modal.style.display = "none";
  };

  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.style.display = "none";
    }
  };
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

    document.getElementById("heroNextBtn").addEventListener("click", nextHero);
    document.getElementById("heroPrevBtn").addEventListener("click", prevHero);
    document.getElementById("prodNextBtn").addEventListener("click", nextProducts);
    document.getElementById("prodPrevBtn").addEventListener("click", prevProducts);

    window.addEventListener("resize", updateProductSlider);

    setInterval(nextHero, 5000);
  } catch (e) {
    console.error(e);
  }
});