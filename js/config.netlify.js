// ============================================
// CONFIGURACIÓN PARA NETLIFY
// ============================================

(function () {
  const urlMeta = document.querySelector('meta[name="supabase-url"]');
  const keyMeta = document.querySelector('meta[name="supabase-key"]');

  if (urlMeta && keyMeta) {
    const url = urlMeta.getAttribute("content");
    const key = keyMeta.getAttribute("content");

    if (url && key && url !== "" && key !== "") {
      window.SUPABASE_URL = url;
      window.SUPABASE_ANON_KEY = key;
      window.CONFIG = {
        SUPABASE_URL: url,
        SUPABASE_ANON_KEY: key,
      };
      return;
    }
  }

  try {
    const script = document.createElement("script");
    script.src = "/js/config.netlify.generated.js";
    script.onload = function () {
      console.log("✅ Configuración desde archivo generado");
    };
    script.onerror = function () {
      console.warn("⚠️ Archivo generado no encontrado");
    };
    document.head.appendChild(script);
  } catch (e) {
    console.warn("⚠️ Error cargando configuración");
  }
})();
