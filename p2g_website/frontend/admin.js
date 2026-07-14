const API_BASE = "http://127.0.0.1:8000";
const tokenKey = "p2g_admin_token";

function getToken() {
  return localStorage.getItem(tokenKey);
}

function setToken(t) {
  localStorage.setItem(tokenKey, t);
}

function clearToken() {
  localStorage.removeItem(tokenKey);
}

async function api(path, opts = {}) {
  const headers = opts.headers || {};
  const token = getToken();

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (
    opts.body &&
    !(opts.body instanceof FormData) &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${path}`);
  }

  return await res.json();
}

function show(id, on) {
  const el = document.getElementById(id);
  if (el) el.style.display = on ? "" : "none";
}

async function login() {
  const u = document.getElementById("u").value.trim();
  const p = document.getElementById("p").value;
  const status = document.getElementById("loginStatus");

  status.textContent = "Logging in...";

  try {
    const out = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: u, password: p })
    });

    setToken(out.access_token);
    status.textContent = "Logged in.";
    await boot();
  } catch {
    status.textContent = "Invalid credentials.";
  }
}

function mapSiteToForm(site) {
  document.getElementById("brand_name").value = site.brand_name || "";
  document.getElementById("tagline").value = site.tagline || "";
  document.getElementById("hero_note").value = site.hero_note || "";
  document.getElementById("about_title").value = site.about_title || "";
  document.getElementById("about_body").value = site.about_body || "";
  document.getElementById("contact_title").value = site.contact_title || "";
  document.getElementById("contact_note").value = site.contact_note || "";
  document.getElementById("ig").value = site?.socials?.instagram || "";
  document.getElementById("fb").value = site?.socials?.facebook || "";

  renderHeroImageList(site.hero_images || []);
}

function formToSite() {
  return {
    brand_name: document.getElementById("brand_name").value.trim(),
    tagline: document.getElementById("tagline").value.trim(),
    hero_note: document.getElementById("hero_note").value.trim(),
    about_title: document.getElementById("about_title").value.trim(),
    about_body: document.getElementById("about_body").value.trim(),
    contact_title: document.getElementById("contact_title").value.trim(),
    contact_note: document.getElementById("contact_note").value.trim(),
    socials: {
      instagram: document.getElementById("ig").value.trim(),
      facebook: document.getElementById("fb").value.trim()
    }
  };
}

async function saveSite() {
  const status = document.getElementById("siteStatus");
  status.textContent = "Saving...";

  try {
    await api("/site", {
      method: "PUT",
      body: JSON.stringify(formToSite())
    });
    status.textContent = "Saved.";
  } catch (err) {
    status.textContent = err.message || "Failed to save.";
  }
}

function renderHeroImageList(images) {
  const list = document.getElementById("heroImageList");
  if (!list) return;

  if (!images.length) {
    list.innerHTML = `<div class="small">No hero images yet.</div>`;
    return;
  }

  list.innerHTML = images.map(img => `
    <div class="item" data-hero-path="${img}">
      <div class="item-top">
        <div>
          <div style="font-weight:900;">${img}</div>
        </div>
        <span class="pill">Hero</span>
      </div>

      <div class="admin-actions">
        <button class="danger heroDeleteBtn">Delete</button>
        <span class="small heroStatus"></span>
      </div>
    </div>
  `).join("");

  list.querySelectorAll(".item").forEach(item => {
    const imagePath = item.getAttribute("data-hero-path");
    const btn = item.querySelector(".heroDeleteBtn");
    const status = item.querySelector(".heroStatus");

    btn.addEventListener("click", async () => {
      const confirmDelete = confirm(
        "This will permanently delete the hero slideshow image.\n\nThis action cannot be undone.\n\nDo you want to continue?"
      );

      if (!confirmDelete) return;

      status.textContent = "Deleting...";
      try {
        await api(`/site/hero-images?image_path=${encodeURIComponent(imagePath)}`, {
          method: "DELETE"
        });
        status.textContent = "Deleted.";
        await reloadSiteForm();
      } catch (err) {
        status.textContent = err.message || "Delete failed.";
      }
    });
  });
}

async function uploadHeaderLogo() {
  const status = document.getElementById("logoUploadStatus");
  status.textContent = "Uploading...";

  const filename = document.getElementById("logo_upload_filename").value.trim();
  const file = document.getElementById("logo_upload_file").files[0];

  if (!filename) {
    status.textContent = "Enter a file name.";
    return;
  }

  if (!file) {
    status.textContent = "Choose an image.";
    return;
  }

  const fd = new FormData();
  fd.append("filename", filename);
  fd.append("image", file);

  try {
    await api("/site/logo", { method: "POST", body: fd });

    document.getElementById("logo_upload_filename").value = "";
    document.getElementById("logo_upload_file").value = "";

    status.textContent = "Uploaded.";
    await reloadSiteForm();
  } catch (err) {
    status.textContent = err.message || "Upload failed.";
  }
}

async function uploadHeroLogo() {
  const status = document.getElementById("heroLogoUploadStatus");
  status.textContent = "Uploading...";

  const filename = document.getElementById("hero_logo_upload_filename").value.trim();
  const file = document.getElementById("hero_logo_upload_file").files[0];

  if (!filename) {
    status.textContent = "Enter a file name.";
    return;
  }

  if (!file) {
    status.textContent = "Choose an image.";
    return;
  }

  const fd = new FormData();
  fd.append("filename", filename);
  fd.append("image", file);

  try {
    await api("/site/hero-logo", { method: "POST", body: fd });

    document.getElementById("hero_logo_upload_filename").value = "";
    document.getElementById("hero_logo_upload_file").value = "";

    status.textContent = "Uploaded.";
    await reloadSiteForm();
  } catch (err) {
    status.textContent = err.message || "Upload failed.";
  }
}

async function uploadHeroImage() {
  const status = document.getElementById("heroUploadStatus");
  status.textContent = "Uploading...";

  const filename = document.getElementById("hero_upload_filename").value.trim();
  const file = document.getElementById("hero_upload_file").files[0];

  if (!filename) {
    status.textContent = "Enter a file name.";
    return;
  }

  if (!file) {
    status.textContent = "Choose an image.";
    return;
  }

  const fd = new FormData();
  fd.append("filename", filename);
  fd.append("image", file);

  try {
    await api("/site/hero-images", { method: "POST", body: fd });

    document.getElementById("hero_upload_filename").value = "";
    document.getElementById("hero_upload_file").value = "";

    status.textContent = "Uploaded.";
    await reloadSiteForm();
  } catch (err) {
    status.textContent = err.message || "Upload failed.";
  }
}

async function reloadSiteForm() {
  const site = await api("/site");
  mapSiteToForm(site);
}

function renderProductItem(p) {
  const imgNote = p.image_path
    ? `<div class="muted" style="margin-top:6px;font-size:12px;">Image uploaded</div>`
    : `<div class="muted" style="margin-top:6px;font-size:12px;">No image</div>`;

  return `
    <div class="item" data-id="${p.id}">
      <div class="item-top">
        <div>
          <div style="font-weight:900;">${p.name}</div>
          <div class="muted" style="margin-top:6px;font-size:13px;line-height:1.5;">
            ${p.description}
          </div>
          ${imgNote}
        </div>
        <span class="pill">${p.id}</span>
      </div>

      <div class="admin-actions">
        <button class="editBtn">Edit</button>
        <button class="danger delBtn">Delete</button>
        <span class="small status"></span>
      </div>

      <div class="editArea" style="display:none; margin-top:10px;">
        <label>Name</label>
        <input class="e_name" value="${p.name}" />

        <label>File name</label>
        <input class="e_filename" value="${p.id}" />

        <label>Description</label>
        <textarea class="e_desc" rows="3">${p.description}</textarea>

        <label>Replace image</label>
        <input type="file" class="e_img" accept="image/*" />

        <div class="admin-actions">
          <button class="saveBtn">Save</button>
          <button class="danger cancelBtn">Cancel</button>
        </div>
      </div>
    </div>
  `;
}

async function loadProducts() {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) {
    throw new Error("Failed to load products");
  }
  const products = await res.json();
  products.sort((a, b) => {
    if (a.id === "p1") return -1;
    if (b.id === "p1") return 1;
    return 0;
  });
  return products;
}

async function addProduct() {
  const status = document.getElementById("prodStatus");
  status.textContent = "Uploading...";

  const name = document.getElementById("new_name").value.trim();
  const description = document.getElementById("new_desc").value.trim();
  const filename = document.getElementById("new_filename").value.trim();
  const file = document.getElementById("new_img").files[0];

  if (!name) {
    status.textContent = "Enter a product name.";
    return;
  }

  if (!description) {
    status.textContent = "Enter a description.";
    return;
  }

  if (!filename) {
    status.textContent = "Enter a file name.";
    return;
  }

  if (!file) {
    status.textContent = "Choose an image.";
    return;
  }

  const fd = new FormData();
  fd.append("name", name);
  fd.append("description", description);
  fd.append("filename", filename);
  fd.append("image", file);

  try {
    await api("/products", { method: "POST", body: fd });

    document.getElementById("new_name").value = "";
    document.getElementById("new_desc").value = "";
    document.getElementById("new_filename").value = "";
    document.getElementById("new_img").value = "";

    status.textContent = "Added.";
    await refreshProducts();
  } catch (err) {
    status.textContent = err.message || "Upload failed.";
  }
}

async function refreshProducts() {
  const list = document.getElementById("productList");
  const products = await loadProducts();
  list.innerHTML = products.map(renderProductItem).join("");

  list.querySelectorAll(".item").forEach(item => {
    const id = item.getAttribute("data-id");
    const editBtn = item.querySelector(".editBtn");
    const delBtn = item.querySelector(".delBtn");
    const saveBtn = item.querySelector(".saveBtn");
    const cancelBtn = item.querySelector(".cancelBtn");
    const editArea = item.querySelector(".editArea");
    const status = item.querySelector(".status");

    editBtn.addEventListener("click", () => {
      editArea.style.display = "";
    });

    cancelBtn.addEventListener("click", () => {
      editArea.style.display = "none";
    });

    delBtn.addEventListener("click", async () => {
      const confirmDelete = confirm(
        "This will permanently delete the product and its image.\n\nThis action cannot be undone.\n\nDo you want to continue?"
      );

      if (!confirmDelete) return;

      status.textContent = "Deleting...";
      try {
        await api(`/products/${id}`, { method: "DELETE" });
        status.textContent = "Deleted.";
        await refreshProducts();
      } catch (err) {
        status.textContent = err.message || "Delete failed.";
      }
    });

    saveBtn.addEventListener("click", async () => {
      status.textContent = "Saving...";

      const name = item.querySelector(".e_name").value.trim();
      const description = item.querySelector(".e_desc").value.trim();
      const filename = item.querySelector(".e_filename").value.trim();
      const file = item.querySelector(".e_img").files[0];

      if (!name) {
        status.textContent = "Enter a product name.";
        return;
      }

      if (!description) {
        status.textContent = "Enter a description.";
        return;
      }

      if (!filename) {
        status.textContent = "Enter a file name.";
        return;
      }

      const fd = new FormData();
      fd.append("name", name);
      fd.append("description", description);
      fd.append("filename", filename);

      if (file) {
        fd.append("image", file);
      }

      try {
        await api(`/products/${id}`, { method: "PUT", body: fd });
        status.textContent = "Saved.";
        await refreshProducts();
      } catch (err) {
        status.textContent = err.message || "Save failed.";
      }
    });
  });
}

async function refreshMessages() {
  const list = document.getElementById("msgList");
  list.innerHTML = `<div class="muted">Loading...</div>`;

  try {
    const msgs = await api("/admin/messages");

    if (!msgs.length) {
      list.innerHTML = `<div class="muted">No messages yet.</div>`;
      return;
    }

    list.innerHTML = msgs.slice().reverse().map(m => `
      <div class="item">
        <div class="item-top">
          <div style="font-weight:900;">
            ${m.name}
            <span class="muted" style="font-weight:500;">(${m.email})</span>
          </div>
          <span class="pill">${m.message_type}</span>
        </div>
        <div class="muted" style="margin-top:8px;white-space:pre-wrap;line-height:1.5;">
          ${m.message}
        </div>
      </div>
    `).join("");
  } catch {
    list.innerHTML = `<div class="muted">Login required to view messages.</div>`;
  }
}

async function boot() {
  const token = getToken();

  if (!token) {
    show("loginCard", true);
    show("adminPanel", false);
    return;
  }

  try {
    await reloadSiteForm();

    show("loginCard", false);
    show("adminPanel", true);

    await refreshProducts();
    await refreshMessages();
  } catch {
    clearToken();
    show("loginCard", true);
    show("adminPanel", false);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("loginBtn").addEventListener("click", login);
  document.getElementById("saveSiteBtn").addEventListener("click", saveSite);
  document.getElementById("uploadLogoBtn").addEventListener("click", uploadHeaderLogo);
  document.getElementById("uploadHeroLogoBtn").addEventListener("click", uploadHeroLogo);
  document.getElementById("uploadHeroBtn").addEventListener("click", uploadHeroImage);
  document.getElementById("addProductBtn").addEventListener("click", addProduct);
  document.getElementById("logoutBtn").addEventListener("click", (e) => {
    e.preventDefault();
    clearToken();
    location.reload();
  });

  await boot();
});
