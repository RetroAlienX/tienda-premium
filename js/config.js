// ============================================
// CONFIGURACIÓN - ROUTE66 MARKET
// ============================================

(function () {
  // 1. Intentar desde window (inyectado por Netlify)
  if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
    const url = window.SUPABASE_URL;
    const key = window.SUPABASE_ANON_KEY;

    if (url && key && url !== "" && key !== "") {
      window.CONFIG = {
        SUPABASE_URL: url,
        SUPABASE_ANON_KEY: key,
      };
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
    return;
  }

  console.warn("⚠️ No se encontró configuración, esperando...");
})();

// ============================================
// CONFIGURACIÓN DE LA TIENDA
// ============================================

window.TIENDA_CONFIG = {
  WHATSAPP: "528126878080",
  NOMBRE: "The Route66 Market",
  TAGLINE: "Premium USA Imports",
  DESCRIPCION:
    "Directo de Estados Unidos a Monterrey. Exclusividad sin fronteras.",
  EMAIL: "theroute66jvmarket@outlook.com",
  HORARIO: "Lunes a Viernes: 9:00 AM - 8:00 PM | Sábado: 10:00 AM - 6:00 PM",
};
