const role = sessionStorage.getItem("birthdayRole");
if (role !== "admin") {
  window.location.href = "login.html";
}

const memoriesList = document.getElementById("memories-list");
const wishesList = document.getElementById("wishes-list");
const logoutButton = document.getElementById("logout-button");
const finalVideoInput = document.getElementById("final-video-input");
const uploadFinalVideoButton = document.getElementById("upload-final-video");
const finalVideoStatus = document.getElementById("final-video-status");

logoutButton.addEventListener("click", () => {
  sessionStorage.removeItem("birthdayRole");
  window.location.href = "login.html";
});

function adminFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      "x-role": "admin",
    },
  });
}

async function uploadFinalVideo(file) {
  const formData = new FormData();
  formData.append("video", file);

  const response = await adminFetch("/api/admin/final-video", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(result.error || "Upload failed");
  }
}

async function deleteMemory(id) {
  const response = await adminFetch(`/api/admin/memories/${id}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error("Failed to delete memory");
  }
}

async function deleteWish(id) {
  const response = await adminFetch(`/api/admin/wishes/${id}`, { method: "DELETE" });
  if (!response.ok) {
    throw new Error("Failed to delete wish");
  }
}

async function loadMemories() {
  const response = await fetch("/api/memories");
  if (!response.ok) {
    throw new Error("Unable to load memories");
  }

  const memories = await response.json();
  memoriesList.innerHTML = "";

  if (!memories.length) {
    memoriesList.innerHTML = '<p class="empty">No memories available.</p>';
    return;
  }

  memories.forEach((item) => {
    const card = document.createElement("article");
    card.className = "memory-card";

    const mediaWrap = document.createElement("div");
    mediaWrap.className = "media-wrap";

    if (item.mediaType === "video") {
      const video = document.createElement("video");
      video.src = item.filePath;
      video.controls = true;
      video.setAttribute("playsinline", "");
      mediaWrap.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.src = item.filePath;
      img.alt = item.originalName || "Memory";
      mediaWrap.appendChild(img);
    }

    const meta = document.createElement("p");
    meta.className = "meta";
    meta.textContent = `${item.mediaType.toUpperCase()} by ${item.uploadedBy}`;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "delete-button";
    removeButton.textContent = "Delete";
    removeButton.addEventListener("click", async () => {
      removeButton.disabled = true;
      try {
        await deleteMemory(item.id);
        await loadMemories();
      } catch (_error) {
        removeButton.disabled = false;
      }
    });

    card.append(mediaWrap, meta, removeButton);
    memoriesList.appendChild(card);
  });
}

async function loadWishes() {
  const response = await fetch("/api/wishes");
  if (!response.ok) {
    throw new Error("Unable to load wishes");
  }

  const wishes = await response.json();
  wishesList.innerHTML = "";

  if (!wishes.length) {
    wishesList.innerHTML = '<p class="empty">No wishes available.</p>';
    return;
  }

  wishes.forEach((item) => {
    const card = document.createElement("article");
    card.className = "wish-card";

    const name = document.createElement("p");
    name.className = "wish-name";
    name.textContent = item.friendName;

    const message = document.createElement("p");
    message.className = "wish-message";
    message.textContent = item.message;

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "delete-button";
    removeButton.textContent = "Delete";
    removeButton.addEventListener("click", async () => {
      removeButton.disabled = true;
      try {
        await deleteWish(item.id);
        await loadWishes();
      } catch (_error) {
        removeButton.disabled = false;
      }
    });

    card.append(name, message, removeButton);
    wishesList.appendChild(card);
  });
}

async function initAdminPage() {
  try {
    await Promise.all([loadMemories(), loadWishes()]);
  } catch (error) {
    console.error(error);
    memoriesList.innerHTML = '<p class="empty">Unable to load memories.</p>';
    wishesList.innerHTML = '<p class="empty">Unable to load wishes.</p>';
  }
}

if (uploadFinalVideoButton) {
  uploadFinalVideoButton.addEventListener("click", async () => {
    const file = (finalVideoInput.files || [])[0];
    if (!file) {
      finalVideoStatus.textContent = "Choose a video file first.";
      return;
    }

    uploadFinalVideoButton.disabled = true;
    finalVideoStatus.textContent = "Uploading final video...";

    try {
      await uploadFinalVideo(file);
      finalVideoInput.value = "";
      finalVideoStatus.textContent = "Final video uploaded successfully.";
    } catch (error) {
      finalVideoStatus.textContent = error.message;
    } finally {
      uploadFinalVideoButton.disabled = false;
    }
  });
}

initAdminPage();
