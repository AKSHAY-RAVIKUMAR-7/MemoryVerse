const role = sessionStorage.getItem("birthdayRole");
if (role !== "friends") {
  window.location.href = "login.html";
}

const form = document.getElementById("contribution-form");
const nameInput = document.getElementById("friend-name");
const wishInput = document.getElementById("friend-wish");
const mediaInput = document.getElementById("friend-media");
const statusText = document.getElementById("status");
const submitButton = document.getElementById("submit-button");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  statusText.textContent = "Submitting...";
  submitButton.disabled = true;

  const data = new FormData();
  data.append("name", nameInput.value.trim());
  data.append("message", wishInput.value.trim());

  const files = Array.from(mediaInput.files || []);
  files.forEach((file) => data.append("media", file));

  try {
    const response = await fetch("/api/friends/contribute", {
      method: "POST",
      body: data,
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Failed to submit");
    }

    form.reset();
    statusText.textContent = `Saved. Uploaded ${result.uploadedFiles} file(s).`;
  } catch (error) {
    statusText.textContent = error.message;
  } finally {
    submitButton.disabled = false;
  }
});
