// ============================================
// CONFIGURACIÓN PARA NETLIFY - MÉTODO DIRECTO
// ============================================

(function () {
  console.log("🔧 Iniciando config.netlify.js...");

  // Leer variables del HTML (inyectadas por Netlify)
  const urlMeta = document.querySelector('meta[name="supabase-url"]');
  const keyMeta = document.querySelector('meta[name="supabase-key"]');

  // Si las meta tags existen, usarlas
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

  // Si no hay meta tags, intentar con variables de entorno (Netlify)
  // En Netlify, las variables de entorno se inyectan en el build
  // y pueden ser leídas desde el frontend mediante este método

  // Crear un script para cargar la configuración desde la función serverless
  console.log("🔄 Intentando cargar configuración desde función serverless...");

  // Hacer una petición a la función serverless para obtener la configuración
  fetch("/api/config")
    .then((response) => response.text())
    .then((data) => {
      // Ejecutar el script que devuelve la función
      eval(data);
      console.log("✅ Configuración cargada desde función serverless");
    })
    .catch((error) => {
      console.warn(
        "⚠️ No se pudo cargar configuración desde función serverless"
      );
      console.warn(
        "⚠️ Usando valores de respaldo (solo para desarrollo local)"
      );
    });
})();
