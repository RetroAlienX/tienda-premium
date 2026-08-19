// ============================================
// CONFIGURACIÓN DE SUPABASE
// ============================================

// Cargar configuración desde variables de entorno
// Las credenciales se inyectan desde Netlify o desde config.js
const SUPABASE_URL =
  window.CONFIG?.SUPABASE_URL ||
  window.SUPABASE_URL ||
  "https://tu-proyecto.supabase.co";
const SUPABASE_ANON_KEY =
  window.CONFIG?.SUPABASE_ANON_KEY || window.SUPABASE_ANON_KEY || "tu-anon-key";

// Verificar que las credenciales existen
if (!SUPABASE_URL || SUPABASE_URL === "https://tu-proyecto.supabase.co") {
  console.warn("⚠️ SUPABASE_URL no configurada. Usando valor por defecto.");
}

if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === "tu-anon-key") {
  console.warn(
    "⚠️ SUPABASE_ANON_KEY no configurada. Usando valor por defecto."
  );
}

// Crear el cliente de Supabase
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// Hacerlo global
window.supabase = supabaseClient;

console.log("✅ Supabase configurado con variables de entorno");
console.log("📋 URL:", SUPABASE_URL.substring(0, 20) + "...");
