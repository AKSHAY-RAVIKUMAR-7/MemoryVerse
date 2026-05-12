const greeting = document.getElementById("hema-greeting");
const memoriesPanel = document.getElementById("memories-panel");
const momentsPanel = document.getElementById("moments-panel");
const wishesPanel = document.getElementById("wishes-panel");
const finalVideoPanel = document.getElementById("final-video-panel");

const memoriesList = document.getElementById("memories-list");
const momentsList = document.getElementById("moments-list");
const wishesList = document.getElementById("wishes-list");
const finalVideoPlayer = document.getElementById("final-video-player");

const role = sessionStorage.getItem("birthdayRole");
if (role !== "hema") {
  window.location.href = "login.html";
}

async function loadWishes() {
  const response = await fetch("/api/wishes");
  if (!response.ok) {
    throw new Error("Failed to load wishes");
  }

  const wishes = await response.json();
  wishesList.innerHTML = "";

  if (!wishes.length) {
    wishesList.innerHTML = '<p class="empty">No wishes yet.</p>';
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

    card.append(name, message);
    wishesList.appendChild(card);
  });
}

function renderPhotos(photoItems) {
  memoriesList.innerHTML = "";

  if (!photoItems.length) {
    memoriesList.innerHTML = '<p class="empty">No memories uploaded yet.</p>';
    return;
  }

  photoItems.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "memory-item";
    card.style.setProperty("--delay", `${index * 0.12}s`);

    const clip = document.createElement("span");
    clip.className = "photo-clip";

    const image = document.createElement("img");
    image.src = item.filePath;
    image.alt = item.originalName || "Memory photo";

    card.append(clip, image);
    memoriesList.appendChild(card);
  });
}

function renderMoments(videoItems) {
  momentsList.innerHTML = "";

  if (!videoItems.length) {
    momentsList.innerHTML = '<p class="empty">No moments uploaded yet.</p>';
    return;
  }

  videoItems.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "moment-item";
    card.style.setProperty("--delay", `${index * 0.15}s`);

    const video = document.createElement("video");
    video.src = item.filePath;
    video.controls = true;
    video.setAttribute("playsinline", "");

    card.appendChild(video);
    momentsList.appendChild(card);
  });
}

async function loadMemoriesAndMoments() {
  const response = await fetch("/api/memories");
  if (!response.ok) {
    throw new Error("Failed to load memories");
  }

  const allItems = await response.json();
  const photos = allItems.filter((item) => item.mediaType === "photo");
  const videos = allItems.filter((item) => item.mediaType === "video");

  renderPhotos(photos);
  renderMoments(videos);
}

async function loadFinalVideo() {
  const response = await fetch("/api/final-video");
  if (!response.ok) {
    throw new Error("Failed to load final video");
  }

  const finalVideo = await response.json();

  if (!finalVideo || !finalVideo.filePath) {
    finalVideoPanel.hidden = true;
    return;
  }

  finalVideoPlayer.src = finalVideo.filePath;
  finalVideoPanel.hidden = false;
}

function revealContent() {
  greeting.hidden = true;
  memoriesPanel.hidden = false;
  momentsPanel.hidden = false;
  wishesPanel.hidden = false;
}

async function initPage() {
  greeting.hidden = false;
  memoriesPanel.hidden = true;
  momentsPanel.hidden = true;
  wishesPanel.hidden = true;
  finalVideoPanel.hidden = true;

  greeting.addEventListener("click", revealContent);
  setTimeout(revealContent, 3200);

  try {
    await Promise.all([loadWishes(), loadMemoriesAndMoments(), loadFinalVideo()]);
  } catch (error) {
    console.error(error);
    memoriesList.innerHTML = '<p class="empty">Unable to load memories right now.</p>';
    momentsList.innerHTML = '<p class="empty">Unable to load moments right now.</p>';
    wishesList.innerHTML = '<p class="empty">Unable to load wishes right now.</p>';
    memoriesPanel.hidden = false;
    momentsPanel.hidden = false;
    wishesPanel.hidden = false;
  }
}

initPage();
