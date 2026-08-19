// ============================================
// CONFIGURACIÓN - VERSIÓN SIMPLIFICADA
// ============================================

(function () {
  console.log("🔧 Iniciando configuración...");

  // 1. Intentar desde window (inyectado por Netlify)
  if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
    const url = window.SUPABASE_URL;
    const key = window.SUPABASE_ANON_KEY;

    if (url && key && url !== "" && key !== "") {
      window.CONFIG = {
        SUPABASE_URL: url,
        SUPABASE_ANON_KEY: key,
      };
      console.log("✅ Configuración cargada desde window");
      console.log("📋 URL:", url.substring(0, 30) + "...");
      return;
    }
  }

  // 2. Intentar desde window.CONFIG
  if (
    window.CONFIG &&
    window.CONFIG.SUPABASE_URL &&
    window.CONFIG.SUPABASE_ANON_KEY
  ) {
    console.log("✅ Configuración cargada desde window.CONFIG");
    console.log("📋 URL:", window.CONFIG.SUPABASE_URL.substring(0, 30) + "...");
    return;
  }

  // 3. Si nada funciona, esperar a que se cargue
  console.warn("⚠️ No se encontró configuración, esperando...");
})();
