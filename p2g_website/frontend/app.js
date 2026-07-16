const API_BASE = "http://127.0.0.1:8000";

let heroImages = [];
let heroIndex = 0;

let productsData = [];
let productIndex = 0;
let siteData = null;
let currentLanguage = "en";

const translations = {
  en: {
    navHome: "Home", navAbout: "About", navContact: "Contact",
    viewProducts: "View Products", contactUs: "Contact Us", collectionTitle: "Our Collection",
    yourName: "Your name", email: "Email", messageType: "Message type",
    generalEnquiry: "General enquiry", whereToBuy: "Where to buy",
    distributorEnquiry: "I want to be a distributor", yourMessage: "Your message",
    sendMessage: "Send message", stayConnected: "Stay Connected",
    socialIntro: "Follow Polish 2 Glow for product news and skincare inspiration.",
    findStockist: "Find a Stockist",
    stockistHelp: "Tell us your location and we’ll help you find your nearest authorised stockist."
  },
  fr: {
    navHome: "Accueil", navAbout: "À propos", navContact: "Contact",
    viewProducts: "Voir les produits", contactUs: "Nous contacter", collectionTitle: "Notre collection",
    yourName: "Votre nom", email: "E-mail", messageType: "Type de demande",
    generalEnquiry: "Demande générale", whereToBuy: "Où acheter",
    distributorEnquiry: "Devenir distributeur", yourMessage: "Votre message",
    sendMessage: "Envoyer le message", stayConnected: "Restez informé",
    socialIntro: "Suivez Polish 2 Glow pour découvrir nos produits et nos conseils beauté.",
    findStockist: "Trouver un revendeur",
    stockistHelp: "Indiquez-nous votre ville et nous vous aiderons à trouver le revendeur agréé le plus proche."
  }
};

const frenchSiteCopy = {
  tagline: "Pour l’éclat de jeunesse que vous désirez",
  hero_note: "Sublimez votre rituel de soin du corps avec Polish 2 Glow. Notre collection d’inspiration parisienne réunit des lotions nourrissantes, des laits corporels, des savons nettoyants et des gommages douche exfoliants pour une peau douce, fraîche et visiblement éclatante. Découvrez nos formules Carotte, Vitamine C et Gold pour compléter votre routine quotidienne.",
  about_title: "L’histoire de Polish 2 Glow",
  about_body: "Polish 2 Glow est une marque de soins du corps d’inspiration parisienne qui vous aide à révéler une peau douce et visiblement éclatante. Notre collection associe lotions corporelles, laits nourrissants, savons nettoyants et gommages douche exfoliants dans un rituel quotidien raffiné.\n\nDe notre lotion Carotte et notre gommage à l’huile de carotte et à la vitamine C à notre collection Gold emblématique, chaque produit complète une routine régulière et laisse la peau propre, lisse et soignée. Choisissez les soins adaptés à vos envies et révélez l’éclat de jeunesse que vous désirez.",
  contact_title: "Contactez-nous",
  contact_note: "Vous avez une question, recherchez un revendeur ou souhaitez devenir distributeur ? Contactez-nous dès aujourd’hui, notre équipe se fera un plaisir de vous aider."
};

const frenchProducts = {
  p1: { name: "Lotion éclaircissante et polissante à la carotte", description: "Une lotion corporelle à la carotte de 500 ml conçue pour compléter votre routine quotidienne et laisser la peau douce, lisse et soignée." },
  p2: { name: "Lait éclaircissant et polissant Gold", description: "Un lait corporel luxueux de 500 ml à la texture soyeuse, conçu pour hydrater et favoriser un fini lisse et visiblement éclatant." },
  p3: { name: "Savon polisseur éclaircissant à la carotte", description: "Un savon nettoyant enrichi en huile de carotte qui rafraîchit la peau et la laisse propre, douce et lisse." },
  p4: { name: "Savon Gold blanchissant et exfoliant", description: "Un savon exfoliant Gold formulé avec de l’alpha-arbutine pour éliminer les cellules ternes en surface et affiner le grain de peau." },
  p5: { name: "Gommage douche éclaircissant Gold", description: "Un généreux gommage douche exfoliant de 1000 ml qui nettoie et polit la peau tout en la laissant douce, hydratée et fraîche." },
  p6: { name: "Gommage douche éclaircissant à l’huile de carotte et à la vitamine C", description: "Un gommage douche exfoliant de 1000 ml à l’huile de carotte et à la vitamine C, conçu pour nettoyer, lisser et hydrater la peau." }
};

async function getJSON(path) {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
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

  img.src = `${API_BASE}${heroImages[heroIndex]}?v=7`;
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
  const localized = currentLanguage === "fr" ? frenchProducts[p.id] : null;
  const name = localized?.name || p.name;
  const description = localized?.description || p.description;
  const productScaleClass = ["p5", "p6"].includes(p.id)
    ? ` product-image-${p.id}`
    : "";
  const imageClass = `clickable-image${productScaleClass}`;
  const imageHtml = p.image_path
    ? `<div class="product-image"><div class="product-image-viewport"><img src="${API_BASE}${p.image_path}?v=5" alt="${name}" class="${imageClass}" /></div></div>`
    : `<div class="product-image"><span>Image coming soon</span></div>`;

  return `
    <div class="product-card">
      ${imageHtml}
      <div class="product-body">
        <h3>${name}</h3>
        <p>${description}</p>
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
  siteData = site;

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

function applyLanguage(language) {
  currentLanguage = language;
  document.documentElement.lang = language;

  document.querySelectorAll("[data-i18n]").forEach(element => {
    const key = element.dataset.i18n;
    if (translations[language][key]) element.textContent = translations[language][key];
  });

  if (siteData) {
    const copy = language === "fr" ? frenchSiteCopy : siteData;
    setText("tagline", copy.tagline);
    setText("heroNote", copy.hero_note);
    setText("aboutTitle", copy.about_title);
    setText("aboutBody", copy.about_body);
    setText("contactTitle", copy.contact_title);
    setText("contactNote", copy.contact_note);
  }

  if (productsData.length) renderProductTrack();
}

async function renderProducts() {
  productsData = await getJSON("/products");
  productsData.sort((a, b) => {
    if (a.id === "p1") return -1;
    if (b.id === "p1") return 1;
    return 0;
  });
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
      status.textContent = "Thank you. Your message has been sent and we’ll be in touch soon.";
    } catch {
      status.textContent = "We couldn’t send your message. Please try again.";
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await renderSite();
    await renderProducts();
    wireContactForm();

    const languageSelect = document.getElementById("languageSelect");
    languageSelect.addEventListener("change", event => applyLanguage(event.target.value));
    applyLanguage(languageSelect.value);

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
