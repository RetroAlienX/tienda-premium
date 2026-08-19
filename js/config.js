// ============================================
// CONFIGURACIÓN - SIN HARDCODE
// ============================================

(function () {
  console.log("🔧 Iniciando configuración...");

  // 1. NETLIFY: Variables inyectadas
  if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
    const url = window.SUPABASE_URL;
    const key = window.SUPABASE_ANON_KEY;

    if (url && key && url !== "TU_PROYECTO" && key !== "TU_ANON_KEY") {
      window.CONFIG = { SUPABASE_URL: url, SUPABASE_ANON_KEY: key };
      console.log("✅ Configuración desde Netlify");
      console.log("📋 URL:", url.substring(0, 30) + "...");
      return;
    }
  }

  // 2. LOCAL: Desde window.CONFIG (config.local.js)
  if (
    window.CONFIG &&
    window.CONFIG.SUPABASE_URL &&
    window.CONFIG.SUPABASE_ANON_KEY
  ) {
    console.log("✅ Configuración desde window.CONFIG (local)");
    return;
  }

  // 3. INTENTAR CARGAR config.local.js DINÁMICAMENTE
  try {
    const script = document.createElement("script");
    script.src = "js/config.local.js";
    script.onload = function () {
      console.log("✅ config.local.js cargado");
      if (window.CONFIG?.SUPABASE_URL) {
        console.log("✅ Configuración cargada");
      }
    };
    script.onerror = function () {
      console.log("ℹ️ config.local.js no encontrado");
    };
    document.head.appendChild(script);
  } catch (e) {
    console.log("ℹ️ No se pudo cargar config.local.js");
  }

  if (!window.CONFIG?.SUPABASE_URL) {
    console.warn("⚠️ Esperando configuración...");
  }
})();
