// ============================================
// CONFIGURACIÓN PARA NETLIFY - MÉTODO DIRECTO
// ============================================

(function () {
  console.log("🔧 Iniciando config.netlify.js...");

  // En Netlify, las variables de entorno se inyectan en el BUILD
  // No están disponibles directamente en el frontend.
  // Pero podemos usar un enfoque diferente:
  // 1. Leer desde meta tags (inyectadas manualmente)
  // 2. O usar un archivo de configuración generado en el build

  // MÉTODO: Leer desde el HTML (meta tags)
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
      console.log("✅ Configuración inyectada desde meta tags");
      console.log("📋 URL:", url.substring(0, 30) + "...");
      return;
    }
  }

  // Si no hay meta tags, intentar con el archivo de configuración generado
  // Este script se ejecutará en Netlify si existe
  try {
    // Intentar cargar el archivo de configuración generado por Netlify
    const script = document.createElement("script");
    script.src = "/js/config.netlify.generated.js";
    script.onload = function () {
      console.log("✅ Configuración cargada desde archivo generado");
    };
    script.onerror = function () {
      console.warn("⚠️ No se encontró archivo de configuración generado");
      console.warn(
        "⚠️ Asegúrate de configurar las variables de entorno en Netlify"
      );
    };
    document.head.appendChild(script);
  } catch (e) {
    console.warn("⚠️ Error al cargar configuración generada");
  }

  console.log("ℹ️ Esperando configuración...");
})();
