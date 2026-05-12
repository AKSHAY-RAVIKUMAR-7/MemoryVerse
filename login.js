const form = document.getElementById("login-form");
const roleInput = document.getElementById("role");
const passwordInput = document.getElementById("password");
const error = document.getElementById("error");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  error.hidden = true;

  const role = roleInput.value;
  const password = passwordInput.value;

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, password }),
    });

    if (!response.ok) {
      throw new Error("Invalid credentials");
    }

    const result = await response.json();
    sessionStorage.setItem("birthdayRole", result.role);

    if (result.role === "admin") {
      window.location.href = "admin.html";
      return;
    }

    if (result.role === "friends") {
      window.location.href = "friends.html";
      return;
    }

    window.location.href = "index.html";
  } catch (_err) {
    error.hidden = false;
  }
});
