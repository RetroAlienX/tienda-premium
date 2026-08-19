// ============================================
// CONFIGURACIÓN - LEE DE MÚLTIPLES FUENTES
// ============================================

(function () {
  // 1. Intentar desde window (inyectado por Netlify o config.local.js)
  if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
    const url = window.SUPABASE_URL;
    const key = window.SUPABASE_ANON_KEY;

    // Verificar que no sean los valores por defecto de Netlify
    if (url && key && url !== "TU_PROYECTO" && key !== "TU_ANON_KEY") {
      window.CONFIG = {
        SUPABASE_URL: url,
        SUPABASE_ANON_KEY: key,
      };
      console.log("✅ Configuración cargada desde window");
      console.log("📋 URL:", url.substring(0, 30) + "...");
      return;
    }
  }

  // 2. Intentar desde variables de entorno (solo backend)
  if (typeof process !== "undefined" && process.env) {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      window.CONFIG = {
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
      };
      console.log("✅ Configuración cargada desde process.env");
      return;
    }
  }

  // 3. Si nada funciona
  console.error("❌ No se encontró configuración");
  console.error("❌ En Netlify: configura variables de entorno");
  console.error("❌ En local: crea js/config.local.js");

  window.CONFIG = {
    SUPABASE_URL: null,
    SUPABASE_ANON_KEY: null,
  };
})();
