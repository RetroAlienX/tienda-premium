// ============================================
// CONFIGURACIÓN DE SUPABASE
// ============================================

(function () {
  // Obtener credenciales desde window.CONFIG
  const config = window.CONFIG || {};
  const SUPABASE_URL = config.SUPABASE_URL || window.SUPABASE_URL || null;
  const SUPABASE_ANON_KEY =
    config.SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY || null;

  // Verificar credenciales
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("❌ No se encontraron credenciales de Supabase");
    console.error("❌ En Netlify: configura variables de entorno");
    console.error("❌ En local: crea js/config.local.js");
    window.supabase = null;
    return;
  }

  // Verificar que no sean valores por defecto
  if (
    SUPABASE_URL === "https://tu-proyecto.supabase.co" ||
    SUPABASE_ANON_KEY === "tu-anon-key"
  ) {
    console.error("❌ Credenciales con valores por defecto");
    console.error("❌ Configura las variables de entorno correctamente");
    window.supabase = null;
    return;
  }

  // Crear cliente
  try {
    const supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_ANON_KEY
    );
    window.supabase = supabaseClient;
    console.log("✅ Supabase configurado correctamente");
    console.log("📋 URL:", SUPABASE_URL);
    console.log("🔑 KEY:", SUPABASE_ANON_KEY.substring(0, 15) + "...");
  } catch (error) {
    console.error("❌ Error al crear cliente Supabase:", error);
    window.supabase = null;
  }
})();
