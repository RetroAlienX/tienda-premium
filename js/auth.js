// ============================================
// AUTENTICACIÓN
// ============================================

async function iniciarSesion(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) throw error;
    localStorage.setItem("adminEmail", email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function cerrarSesion() {
  try {
    await supabase.auth.signOut();
    localStorage.removeItem("adminEmail");
    window.location.href = "login.html";
  } catch (error) {
    console.error("Error:", error);
    alert("Error al cerrar sesión");
  }
}

async function verificarSesion() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error || !session) {
      window.location.href = "login.html";
      return null;
    }
    return session.user;
  } catch (error) {
    console.error("Error:", error);
    window.location.href = "login.html";
    return null;
  }
}

function mostrarAdminEmail() {
  const email = localStorage.getItem("adminEmail");
  if (email) {
    const elemento = document.getElementById("adminEmail");
    if (elemento) elemento.textContent = "👤 " + email;
  }
}

// ============================================
// EVENTOS
// ============================================

document.addEventListener("DOMContentLoaded", function () {
  console.log("🔐 auth.js cargado");
  console.log("📦 supabase disponible:", typeof supabase !== "undefined");

  // Verificar sesión en admin.html
  if (window.location.pathname.includes("admin.html")) {
    verificarSesion().then((user) => {
      if (user) mostrarAdminEmail();
    });
  }

  // Botón de logout
  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", cerrarSesion);
  }

  // Formulario de login
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const mensaje = document.getElementById("mensajeLogin");

      console.log("🔐 Intentando login con:", email);

      mensaje.textContent = "Iniciando sesión...";
      mensaje.style.color = "#a0a0a0";

      const result = await iniciarSesion(email, password);
      if (result.success) {
        console.log("✅ Login exitoso");
        window.location.href = "admin.html";
      } else {
        console.log("❌ Login fallido:", result.error);
        mensaje.textContent = "❌ " + result.error;
        mensaje.style.color = "#dc3545";
      }
    });
  }
});
