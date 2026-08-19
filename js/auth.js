// ============================================
// AUTENTICACIÓN
// ============================================

function esperarSupabase(callback) {
  // Si supabase ya está listo, ejecutar inmediatamente
  if (window.supabase && typeof window.supabase.auth !== "undefined") {
    callback();
    return;
  }

  // Escuchar evento personalizado
  document.addEventListener("supabaseReady", function handler() {
    document.removeEventListener("supabaseReady", handler);
    callback();
  });

  // También verificar cada 200ms
  const intervalo = setInterval(function () {
    if (window.supabase && typeof window.supabase.auth !== "undefined") {
      clearInterval(intervalo);
      callback();
    }
  }, 200);
}

async function verificarSesion() {
  return new Promise((resolve) => {
    esperarSupabase(async function () {
      try {
        const {
          data: { session },
          error,
        } = await window.supabase.auth.getSession();
        if (error || !session) {
          console.log("🔐 No hay sesión activa");
          window.location.href = "login.html";
          resolve(null);
          return;
        }
        console.log("🔐 Sesión activa:", session.user.email);
        resolve(session.user);
      } catch (error) {
        console.error("❌ Error verificando sesión:", error);
        window.location.href = "login.html";
        resolve(null);
      }
    });
  });
}

async function cerrarSesion() {
  try {
    await window.supabase.auth.signOut();
    localStorage.removeItem("adminEmail");
    window.location.href = "login.html";
  } catch (error) {
    console.error("❌ Error:", error);
    alert("Error al cerrar sesión");
  }
}

async function iniciarSesion(email, password) {
  return new Promise((resolve) => {
    console.log("🔐 Esperando Supabase para login...");
    esperarSupabase(async function () {
      try {
        console.log("🔐 Intentando login con:", email);
        const { data, error } = await window.supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
        if (error) {
          console.log("❌ Error login:", error.message);
          resolve({ success: false, error: error.message });
          return;
        }
        console.log("✅ Login exitoso:", data.user.email);
        localStorage.setItem("adminEmail", email);
        resolve({ success: true });
      } catch (error) {
        console.error("❌ Error inesperado:", error);
        resolve({ success: false, error: error.message });
      }
    });
  });
}

function mostrarAdminEmail() {
  const email = localStorage.getItem("adminEmail");
  if (email) {
    const elemento = document.getElementById("adminEmail");
    if (elemento) elemento.textContent = "👤 " + email;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  console.log("🔐 auth.js cargado");

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

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();
      const mensaje = document.getElementById("mensajeLogin");

      if (!email || !password) {
        mensaje.textContent = "❌ Completa todos los campos";
        mensaje.style.color = "#dc3545";
        return;
      }

      mensaje.textContent = "⏳ Iniciando sesión...";
      mensaje.style.color = "#a0a0a0";

      const result = await iniciarSesion(email, password);

      if (result.success) {
        mensaje.textContent = "✅ Redirigiendo...";
        mensaje.style.color = "#28a745";
        window.location.href = "admin.html";
      } else {
        mensaje.textContent = "❌ " + result.error;
        mensaje.style.color = "#dc3545";
      }
    });
  }
});
