// ============================================
// NETLIFY - INYECCIÓN DE VARIABLES
// ============================================

(function () {
  console.log("🔧 Iniciando config.netlify.js...");

  const urlMeta = document.querySelector('meta[name="supabase-url"]');
  const keyMeta = document.querySelector('meta[name="supabase-key"]');

  if (urlMeta && keyMeta) {
    const url = urlMeta.getAttribute("content");
    const key = keyMeta.getAttribute("content");

    if (url && key) {
      window.SUPABASE_URL = url;
      window.SUPABASE_ANON_KEY = key;
      window.CONFIG = { SUPABASE_URL: url, SUPABASE_ANON_KEY: key };
      console.log("✅ Configuración inyectada");
      console.log("📋 URL:", url.substring(0, 30) + "...");
      return;
    }
  }

  console.warn("⚠️ No se encontraron meta tags");
})();
