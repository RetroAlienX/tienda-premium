// ============================================
// AUTENTICACIÓN
// ============================================

function esperarSupabase(callback) {
  if (window.supabase && typeof window.supabase.auth !== "undefined") {
    callback();
    return;
  }

  document.addEventListener("supabaseReady", function handler() {
    document.removeEventListener("supabaseReady", handler);
    callback();
  });

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
          window.location.href = "login.html";
          resolve(null);
          return;
        }
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
    window.location.href = "index.html";
  } catch (error) {
    console.error("❌ Error:", error);
    alert("Error al cerrar sesión");
  }
}

async function iniciarSesion(email, password) {
  return new Promise((resolve) => {
    esperarSupabase(async function () {
      try {
        const { data, error } = await window.supabase.auth.signInWithPassword({
          email: email,
          password: password,
        });
        if (error) {
          resolve({ success: false, error: error.message });
          return;
        }
        localStorage.setItem("adminEmail", email);
        resolve({ success: true });
      } catch (error) {
        resolve({ success: false, error: error.message });
      }
    });
  });
}

// ============================================
// MOSTRAR CORREO DEL ADMIN (SIN ESTRELLA)
// ============================================

function mostrarAdminEmail() {
  const email = localStorage.getItem("adminEmail");
  if (email) {
    const el = document.getElementById("adminEmail");
    // Eliminado el símbolo "✦ " que causaba la estrella
    if (el) el.textContent = email;
  }
}

// ============================================
// EASTER EGG - ACCESO ADMIN OCULTO (5 CLICS)
// ============================================

let clickCount = 0;
let clickTimer = null;

function initEasterEgg() {
  const header = document.querySelector(
    ".logo-area, #secretLogo, #adminAccess, .logo",
  );
  if (!header) {
    // Es normal no encontrarlo en páginas sin logo (ej. admin.html);
    // no es un error, así que no se muestra advertencia en consola.
    return;
  }

  header.style.cursor = "pointer";

  header.addEventListener("click", function (e) {
    clickCount++;

    if (clickTimer) clearTimeout(clickTimer);

    clickTimer = setTimeout(() => {
      clickCount = 0;
    }, 2000);

    if (clickCount >= 5) {
      clickCount = 0;
      if (localStorage.getItem("adminEmail")) {
        window.location.href = "admin.html";
      } else {
        window.location.href = "login.html";
      }
    }
  });

}

document.addEventListener("DOMContentLoaded", function () {
  initEasterEgg();

  if (window.location.pathname.includes("admin.html")) {
    verificarSesion().then((user) => {
      if (user) mostrarAdminEmail();
    });
  }

  const btnLogout = document.getElementById("btnLogout");
  if (btnLogout) {
    btnLogout.addEventListener("click", cerrarSesion);
  }

  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();
      const mensaje = document.getElementById("mensajeLogin");

      if (!email || !password) {
        mensaje.textContent = "❌ Completa todos los campos";
        mensaje.style.color = "#ff3333";
        return;
      }

      mensaje.textContent = "⏳ Iniciando sesión...";
      mensaje.style.color = "#777777";

      const result = await iniciarSesion(email, password);

      if (result.success) {
        mensaje.textContent = "✅ Redirigiendo...";
        mensaje.style.color = "#00ff88";
        window.location.href = "admin.html";
      } else {
        mensaje.textContent = "❌ " + result.error;
        mensaje.style.color = "#ff3333";
      }
    });
  }
});
