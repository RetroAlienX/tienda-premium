// ============================================
// CONFIGURACIÓN - VARIABLES DE ENTORNO
// ============================================

// Las credenciales se cargan desde variables de entorno
// En Netlify, se configuran en Site Settings → Environment Variables
// En desarrollo local, se usan valores por defecto

const CONFIG = {
  // Intenta cargar desde variables de entorno primero
  // Si no existen, usa valores por defecto (para desarrollo local)
  SUPABASE_URL:
    window.SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://xsactvcmsaxrjwyeaimf.supabase.co",
  SUPABASE_ANON_KEY:
    window.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    "TU_ANON_KEY_AQUI",
};

// Para desarrollo local, puedes sobrescribir con valores específicos
// Esto solo funciona si NO estás en Netlify
if (!window.SUPABASE_URL && !process.env.SUPABASE_URL) {
  console.warn("⚠️ Usando valores por defecto para desarrollo local");
  console.warn("⚠️ Para producción, configura variables de entorno en Netlify");
}

console.log("✅ Configuración cargada");

// Exportar configuración
window.CONFIG = CONFIG;
