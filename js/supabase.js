// ============================================
// SUPABASE - CON DISPARO DE EVENTO
// ============================================

function iniciarSupabase() {
  console.log("🔧 Iniciando Supabase...");

  const config = window.CONFIG || {};
  const SUPABASE_URL = config.SUPABASE_URL || null;
  const SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY || null;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn("⚠️ Credenciales no disponibles, reintentando...");
    setTimeout(iniciarSupabase, 500);
    return;
  }

  if (
    SUPABASE_URL === "https://tu-proyecto.supabase.co" ||
    SUPABASE_ANON_KEY === "tu-anon-key"
  ) {
    console.error("❌ Credenciales con valores por defecto");
    window.supabase = null;
    return;
  }

  try {
    // Crear el cliente de Supabase
    const supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
    window.supabase = supabaseClient;

    console.log("✅ Supabase configurado");
    console.log("📋 URL:", SUPABASE_URL);

    // Disparar evento para que otros scripts sepan que Supabase está listo
    document.dispatchEvent(new Event("supabaseReady"));
    console.log("📢 Evento supabaseReady disparado");
  } catch (error) {
    console.error("❌ Error al crear cliente Supabase:", error);
    window.supabase = null;
  }
}

// Esperar a que el DOM esté listo
document.addEventListener("DOMContentLoaded", function () {
  console.log("📄 DOM cargado, iniciando Supabase...");
  setTimeout(iniciarSupabase, 100);
});

// Si el DOM ya está cargado, iniciar inmediatamente
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  console.log("📄 DOM ya cargado, iniciando Supabase...");
  setTimeout(iniciarSupabase, 100);
}
