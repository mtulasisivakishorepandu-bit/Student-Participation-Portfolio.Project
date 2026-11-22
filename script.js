const STORAGE_KEY = "studentPortfolioAdvanced_v2";

let records = [];
let currentImageData = "";
let profileName = "Student";

const $ = id => document.getElementById(id);

const icons = {
  Academic: "📖",
  Technical: "💻",
  Sports: "🏆",
  Cultural: "🎭",
  Volunteer: "🤝",
  Leadership: "🌟",
  Other: "📌"
};

try {
  records = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
} catch (error) {
  records = [];
}

if (!Array.isArray(records)) records = [];

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    render();
  } catch (error) {
    showToast("Storage full. Try removing large images or exporting a backup.");
  }
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function dateFmt(value) {
  if (!value) return "Date not set";
  return new Date(value + "T00:00:00").toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function badge(status) {
  return `<span class="badge ${esc(status)}">${esc(status)}</span>`;
}

function toast(message) {
  showToast(message);
}

function showToast(message) {
  const toastElement = $("toast");
  toastElement.textContent = message;
  toastElement.classList.add("show");
  setTimeout(() => toastElement.classList.remove("show"), 2600);
}

function card(record) {
  return `
    <article class="activity-card">
      <div class="card-image">
        ${record.image
          ? `<img src="${record.image}" alt="${esc(record.name)}" onclick="openImage('${record.id}')">`
          : `<div class="placeholder">${icons[record.category] || "📌"}</div>`}
        ${badge(record.status)}
      </div>
      <div class="card-content">
        <h4>${esc(record.name)}</h4>
        <div class="card-meta">
          ${dateFmt(record.date)}${record.organizer ? " · " + esc(record.organizer) : ""}
        </div>
        <p>${esc(record.description || "No description added yet.")}</p>
        <div class="card-bottom">
          <span class="category">${icons[record.category] || "📌"} ${esc(record.category)}</span>
          <div class="card-actions">
            <button class="small-btn" title="Edit" onclick="editRecord('${record.id}')">✎</button>
            <button class="small-btn delete" title="Delete" onclick="deleteRecord('${record.id}')">⌫</button>
          </div>
        </div>
      </div>
    </article>`;
}

function recentItem(record) {
  return `
    <div class="recent-item">
      ${record.image
        ? `<img class="recent-thumb" src="${record.image}" alt="">`
        : `<div class="recent-thumb placeholder">${icons[record.category] || "📌"}</div>`}
      <div class="recent-item-info">
        <strong>${esc(record.name)}</strong>
        <small>${esc(record.category)} · ${dateFmt(record.date)}</small>
      </div>
      ${badge(record.status)}
    </div>`;
}

function render() {
  const completed = records.filter(record => record.status === "Completed").length;
  const ongoing = records.filter(record => record.status === "Ongoing").length;
  const planned = records.filter(record => record.status === "Planned").length;
  const categories = [...new Set(records.map(record => record.category))];

  $("totalStat").textContent = records.length;
  $("completedStat").textContent = completed;
  $("ongoingStat").textContent = ongoing;
  $("categoryStat").textContent = categories.length;

  const recent = [...records]
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 5);

  $("recentList").innerHTML = recent.map(recentItem).join("");
  $("recentEmpty").style.display = recent.length ? "none" : "block";

  $("progressSnapshot").innerHTML = records.length
    ? ["Completed", "Ongoing", "Planned"].map(status => {
        const count = records.filter(record => record.status === status).length;
        const percent = count / records.length * 100;
        return `
          <div class="progress-row">
            <div class="progress-label">
              <span>${badge(status)}</span>
              <strong>${count} · ${Math.round(percent)}%</strong>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width:${percent}%"></div>
            </div>
          </div>`;
      }).join("")
    : `<p class="hint">Add activities to see your progress.</p>`;

  const search = $("searchInput").value.toLowerCase();
  const category = $("categoryFilter").value;
  const status = $("statusFilter").value;
  const sort = $("sortFilter").value;

  const filtered = records.filter(record =>
    (`${record.name} ${record.organizer || ""} ${record.description || ""}`
      .toLowerCase().includes(search)) &&
    (!category || record.category === category) &&
    (!status || record.status === status)
  );

  if (sort === "newest") filtered.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  if (sort === "oldest") filtered.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
  if (sort === "az") filtered.sort((a, b) => a.name.localeCompare(b.name));

  $("portfolioGrid").innerHTML = filtered.map(card).join("");
  $("portfolioEmpty").style.display = filtered.length ? "none" : "block";
  $("recordCount").textContent = `${filtered.length} of ${records.length} activities`;

  const images = records.filter(record => record.image);
  $("galleryGrid").innerHTML = images.map(record => `
    <div class="gallery-tile" onclick="openImage('${record.id}')">
      <img src="${record.image}" alt="${esc(record.name)}">
      <div class="tile-caption">${esc(record.name)}</div>
    </div>`).join("");
  $("galleryEmpty").style.display = images.length ? "none" : "block";

  renderAnalytics(categories, completed, ongoing, planned);
}

function renderAnalytics(categories, completed, ongoing, planned) {
  const palette = ["#6657e8", "#1aa879", "#e7a53c", "#e56a9b", "#5aa3db", "#9a78df", "#718096"];

  $("categoryBars").innerHTML = categories.length
    ? categories.map((category, index) => {
        const count = records.filter(record => record.category === category).length;
        return `
          <div class="progress-row">
            <div class="progress-label">
              <span>${icons[category] || "📌"} ${esc(category)}</span>
              <strong>${count}</strong>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width:${count / records.length * 100}%;background:${palette[index % palette.length]}"></div>
            </div>
          </div>`;
      }).join("")
    : `<p class="hint">No activity records yet.</p>`;

  $("statusOverview").innerHTML = `
    <div class="status-box">${badge("Completed")}<strong>${completed}</strong></div>
    <div class="status-box">${badge("Ongoing")}<strong>${ongoing}</strong></div>
    <div class="status-box">${badge("Planned")}<strong>${planned}</strong></div>`;

  $("summaryText").innerHTML = records.length
    ? `<p style="line-height:1.8;font-size:13px;color:#697287">
        You have <strong>${records.length}</strong> recorded activities across
        <strong>${categories.length}</strong> categories.
        <strong>${completed}</strong> completed, <strong>${ongoing}</strong> ongoing and
        <strong>${planned}</strong> planned. ${records.filter(record => record.image).length}
        records include images. Keep adding meaningful experiences to your journey.
       </p>`
    : `<p class="hint">Your portfolio summary will appear here when you add activities.</p>`;
}

function openModal(record = null) {
  $("activityForm").reset();
  currentImageData = record?.image || "";
  $("imagePreview").src = currentImageData;
  $("imagePreview").classList.toggle("show", !!currentImageData);
  $("editId").value = record?.id || "";
  $("modalTitle").textContent = record ? "Edit activity" : "Add experience";

  if (record) {
    $("activityName").value = record.name;
    $("category").value = record.category;
    $("activityDate").value = record.date;
    $("organizer").value = record.organizer || "";
    $("status").value = record.status;
    $("description").value = record.description || "";
  } else {
    $("activityDate").value = new Date().toISOString().slice(0, 10);
    $("status").value = "Completed";
  }

  $("modalOverlay").classList.add("show");
  $("activityName").focus();
}

function closeModal() {
  $("modalOverlay").classList.remove("show");
}

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      const maxSize = 1200;
      const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
      const width = Math.round(image.width * scale);
      const height = Math.round(image.height * scale);
      const canvas = document.createElement("canvas");

      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.78));
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Image load failed"));
    };

    image.src = objectUrl;
  });
}

$("activityForm").addEventListener("submit", event => {
  event.preventDefault();

  const id = $("editId").value;
  const record = {
    id: id || crypto.randomUUID(),
    name: $("activityName").value.trim(),
    category: $("category").value,
    date: $("activityDate").value,
    organizer: $("organizer").value.trim(),
    status: $("status").value,
    description: $("description").value.trim(),
    image: currentImageData
  };

  if (!record.name || !record.category || !record.date) {
    showToast("Please complete required fields.");
    return;
  }

  if (id) {
    records = records.map(item => item.id === id ? record : item);
  } else {
    records.push(record);
  }

  closeModal();
  save();
  showToast(id ? "Activity updated" : "Activity saved");
});

function editRecord(id) {
  const record = records.find(item => item.id === id);
  if (record) openModal(record);
}

function deleteRecord(id) {
  const record = records.find(item => item.id === id);

  if (record && confirm(`Delete “${record.name}” from your portfolio?`)) {
    records = records.filter(item => item.id !== id);
    save();
    showToast("Record deleted");
  }
}

function openImage(id) {
  const record = records.find(item => item.id === id);
  if (record?.image) {
    $("lightboxImage").src = record.image;
    $("lightbox").classList.add("show");
  }
}

function switchPage(page) {
  const target = document.getElementById(page);
  if (!target || !target.classList.contains("pages")) return;

  document.querySelectorAll(".pages").forEach(item => item.classList.remove("active"));
  target.classList.add("active");
  document.querySelectorAll(".nav [data-page]").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const names = {
    dashboard: ["Your journey, in one place.", "Capture experiences. Celebrate progress. Build your future."],
    portfolio: ["Your portfolio", "All activities, achievements and experiences."],
    gallery: ["Photo gallery", "Memories and certificates from your journey."],
    analytics: ["Insights & analytics", "Explore your participation and progress."]
  };

  if (names[page]) {
    $("pageTitle").textContent = names[page][0];
    $("pageSubtitle").textContent = names[page][1];
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

window.switchPage = switchPage;
window.editRecord = editRecord;
window.deleteRecord = deleteRecord;
window.openImage = openImage;

document.querySelector(".sidebar").addEventListener("click", event => {
  const button = event.target.closest("button[data-page]");
  if (button) {
    event.preventDefault();
    switchPage(button.dataset.page);
  }
});

$("addBtn").addEventListener("click", () => openModal());
$("closeModal").addEventListener("click", closeModal);
$("cancelBtn").addEventListener("click", closeModal);

$("modalOverlay").addEventListener("click", event => {
  if (event.target === $("modalOverlay")) closeModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    closeModal();
    $("lightbox").classList.remove("show");
  }
});

$("searchInput").addEventListener("input", render);
$("categoryFilter").addEventListener("change", render);
$("statusFilter").addEventListener("change", render);
$("sortFilter").addEventListener("change", render);

$("activityImage").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    showToast("Please select an image.");
    return;
  }

  if (file.size > 12 * 1024 * 1024) {
    showToast("Choose an image smaller than 12 MB.");
    event.target.value = "";
    return;
  }

  try {
    currentImageData = await resizeImage(file);
    $("imagePreview").src = currentImageData;
    $("imagePreview").classList.add("show");
  } catch (error) {
    showToast("Could not load that image");
  }
});

$("exportBtn").addEventListener("click", () => {
  const backup = {
    schema: 2,
    exportedAt: new Date().toISOString(),
    records
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json"
  });
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = "student-portfolio-backup.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  showToast("Backup exported");
});

$("importBtn").addEventListener("click", () => $("importFile").click());

$("importFile").addEventListener("change", event => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      const list = Array.isArray(imported) ? imported : imported.records;

      if (!Array.isArray(list)) throw new Error("Invalid backup");

      if (confirm(`Import ${list.length} records? This will replace your current portfolio.`)) {
        records = list;
        save();
        showToast("Backup imported");
      }
    } catch (error) {
      showToast("Invalid backup file");
    }

    event.target.value = "";
  };

  reader.readAsText(file);
});

$("lightboxClose").addEventListener("click", () => $("lightbox").classList.remove("show"));
$("lightbox").addEventListener("click", event => {
  if (event.target === $("lightbox")) $("lightbox").classList.remove("show");
});

render();
