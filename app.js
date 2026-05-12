const photoUpload = document.getElementById("photo-upload");
const hangingRow = document.getElementById("hanging-row");
const photoEmptyState = document.getElementById("photo-empty-state");
const clearPhotosButton = document.getElementById("clear-photos");
const photoActions = document.getElementById("photo-actions");
const photoUploadLabel = document.getElementById("photo-upload-label");
const videoUpload = document.getElementById("video-upload");
const videoPreview = document.getElementById("video-preview");
const videoPlaceholder = document.getElementById("video-placeholder");
const clearVideoButton = document.getElementById("clear-video");
const videoActions = document.getElementById("video-actions");
const loginPanel = document.getElementById("login-panel");
const loginForm = document.getElementById("login-form");
const accountRole = document.getElementById("account-role");
const accountPassword = document.getElementById("account-password");
const loginError = document.getElementById("login-error");
const accessBanner = document.getElementById("access-banner");
const accessTitle = document.getElementById("access-title");
const logoutButton = document.getElementById("logout-button");
const contributorPanel = document.getElementById("contributor-panel");
const wishesPanel = document.getElementById("wishes-panel");
const wishForm = document.getElementById("wish-form");
const wishMessage = document.getElementById("wish-message");
const wishesList = document.getElementById("wishes-list");

const photoLibrary = [];
const wishLibrary = [];
let videoObjectUrl = "";
let currentRole = "";

const credentials = {
  admin: "hema@701",
  friends: "frnd@123",
  hema: "hema@naayi",
};

const roleLabels = {
  admin: "Admin",
  friends: "Friends",
  hema: "HEMA",
};

const renderWishes = () => {
  wishesList.innerHTML = "";

  if (!wishLibrary.length) {
    const empty = document.createElement("p");
    empty.className = "wish-empty";
    empty.textContent = "Wishes from friends will appear here.";
    wishesList.appendChild(empty);
    return;
  }

  wishLibrary.forEach((entry, index) => {
    const item = document.createElement("article");
    item.className = "wish-card";

    const title = document.createElement("div");
    title.className = "wish-card-title";
    title.textContent = entry.author;

    const message = document.createElement("p");
    message.textContent = entry.message;

    item.append(title, message);

    if (currentRole === "admin") {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "wish-delete";
      remove.textContent = "Delete wish";
      remove.addEventListener("click", () => {
        wishLibrary.splice(index, 1);
        renderWishes();
      });
      item.appendChild(remove);
    }

    wishesList.appendChild(item);
  });
};

const setRoleAccess = (role) => {
  currentRole = role;
  document.body.dataset.role = role;
  loginPanel.hidden = true;
  accessBanner.hidden = false;
  accessTitle.textContent = roleLabels[role];

  const isAdmin = role === "admin";
  const isFriends = role === "friends";
  const isHema = role === "hema";

  contributorPanel.hidden = !isFriends;
  document.querySelector(".hero")?.toggleAttribute("hidden", isFriends);
  document.querySelector(".moments-panel")?.toggleAttribute("hidden", isFriends);
  wishesPanel.hidden = isFriends;
  document.querySelector(".video-panel")?.toggleAttribute("hidden", isFriends);

  photoActions.hidden = isFriends || isHema;
  photoUpload.disabled = isHema;
  clearPhotosButton.hidden = !isAdmin;
  videoActions.hidden = isFriends || isHema || !isAdmin;
  videoUpload.disabled = isHema;
  clearVideoButton.hidden = !isAdmin;
  wishForm.hidden = true;
  wishMessage.disabled = true;
  photoUploadLabel.textContent = isHema ? "View only" : "Add photos";

  document.querySelectorAll(".photo-delete").forEach((button) => {
    button.hidden = !isAdmin;
  });

  document.querySelectorAll(".wish-delete").forEach((button) => {
    button.hidden = !isAdmin;
  });

  renderPhotos();
  renderWishes();
};

const renderPhotos = () => {
  hangingRow.querySelectorAll(".photo-card").forEach((card) => card.remove());

  photoLibrary.forEach((entry, index) => {
    const card = document.createElement("article");
    card.className = "photo-card";
    card.style.setProperty("--tilt", `${index % 2 === 0 ? -3 : 3}deg`);

    const image = document.createElement("img");
    image.src = entry.url;
    image.alt = entry.name || `Moments photo ${index + 1}`;

    const label = document.createElement("div");
    label.className = "photo-label";
    label.textContent = entry.name || `Moment ${index + 1}`;

    if (currentRole === "admin") {
      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "photo-delete";
      removeButton.textContent = "Delete photo";
      removeButton.addEventListener("click", () => {
        const [removed] = photoLibrary.splice(index, 1);
        if (removed) {
          URL.revokeObjectURL(removed.url);
        }
        renderPhotos();
      });
      card.append(image, label, removeButton);
    } else {
      card.append(image, label);
    }

    hangingRow.appendChild(card);
  });

  document.body.classList.toggle("has-photo", photoLibrary.length > 0);
  photoEmptyState.hidden = photoLibrary.length > 0;
};

photoUpload.addEventListener("change", () => {
  if (currentRole === "hema") {
    return;
  }

  const files = Array.from(photoUpload.files || []).filter((file) => file.type.startsWith("image/"));
  if (!files.length) {
    photoUpload.value = "";
    return;
  }

  files.forEach((file) => {
    const url = URL.createObjectURL(file);
    photoLibrary.push({
      name: file.name.replace(/\.[^.]+$/, ""),
      url,
    });
  });

  renderPhotos();
  photoUpload.value = "";
});

clearPhotosButton.addEventListener("click", () => {
  if (currentRole !== "admin") {
    return;
  }

  photoLibrary.splice(0, photoLibrary.length).forEach((entry) => URL.revokeObjectURL(entry.url));
  document.querySelectorAll(".photo-card img").forEach((img) => {
    if (img.src.startsWith("blob:")) {
      URL.revokeObjectURL(img.src);
    }
  });
  renderPhotos();
});

videoUpload.addEventListener("change", () => {
  if (currentRole !== "admin") {
    return;
  }

  const file = (videoUpload.files || [])[0];
  if (!file || !file.type.startsWith("video/")) {
    return;
  }

  if (videoObjectUrl) {
    URL.revokeObjectURL(videoObjectUrl);
  }

  videoObjectUrl = URL.createObjectURL(file);
  videoPreview.src = videoObjectUrl;
  videoPreview.load();
  document.body.classList.add("has-video");
});

clearVideoButton.addEventListener("click", () => {
  if (videoObjectUrl) {
    URL.revokeObjectURL(videoObjectUrl);
    videoObjectUrl = "";
  }

  videoPreview.removeAttribute("src");
  videoPreview.load();
  videoUpload.value = "";
  document.body.classList.remove("has-video");
});

wishForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (currentRole !== "friends") {
    return;
  }

  const message = wishMessage.value.trim();
  if (!message) {
    return;
  }

  wishLibrary.unshift({
    author: "Friend",
    message,
  });

  wishMessage.value = "";
  renderWishes();
});

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const selectedRole = accountRole.value;
  const password = accountPassword.value.trim();

  if (credentials[selectedRole] !== password) {
    loginError.hidden = false;
    return;
  }

  loginError.hidden = true;
  setRoleAccess(selectedRole);
});

logoutButton.addEventListener("click", () => {
  currentRole = "";
  document.body.removeAttribute("data-role");
  loginPanel.hidden = false;
  accessBanner.hidden = true;
  contributorPanel.hidden = true;
  document.querySelector(".hero")?.setAttribute("hidden", "");
  document.querySelector(".moments-panel")?.setAttribute("hidden", "");
  wishesPanel.hidden = true;
  document.querySelector(".video-panel")?.setAttribute("hidden", "");
  accountPassword.value = "";
  loginError.hidden = true;
  loginPanel.scrollIntoView({ behavior: "smooth", block: "start" });
});

renderPhotos();
renderWishes();
