// ============================================
// CONFIGURACIÓN PARA NETLIFY
// ============================================

// ⚠️ ESTE ARCHIVO SE SUBE A GITHUB
// Las credenciales se inyectan desde Netlify en el build

(function () {
  // Leer variables desde el HTML (inyectadas por Netlify)
  const urlMeta = document.querySelector('meta[name="supabase-url"]');
  const keyMeta = document.querySelector('meta[name="supabase-key"]');

  if (urlMeta && keyMeta) {
    window.SUPABASE_URL = urlMeta.getAttribute("content");
    window.SUPABASE_ANON_KEY = keyMeta.getAttribute("content");
    console.log("✅ Configuración inyectada desde meta tags");
    return;
  }

  // Fallback: usar valores por defecto (solo para desarrollo)
  console.warn("⚠️ No se encontraron meta tags de configuración");
})();
