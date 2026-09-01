// ============================================
// SUPABASE - INICIALIZACIÓN
// ============================================

function iniciarSupabase() {
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
    const supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
    window.supabase = supabaseClient;
    document.dispatchEvent(new Event("supabaseReady"));
  } catch (error) {
    console.error("❌ Error al crear cliente Supabase:", error);
    window.supabase = null;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  setTimeout(iniciarSupabase, 100);
});

if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  setTimeout(iniciarSupabase, 100);
}
