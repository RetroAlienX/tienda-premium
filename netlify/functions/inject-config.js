// ============================================
// INYECCIÓN DE CONFIGURACIÓN PARA NETLIFY
// ============================================

exports.handler = async function (event, context) {
  // Obtener variables de entorno de Netlify
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

  console.log("🔧 Inyectando configuración desde función serverless");
  console.log("📋 URL:", supabaseUrl);
  console.log(
    "🔑 KEY:",
    supabaseKey ? supabaseKey.substring(0, 15) + "..." : "No disponible"
  );

  // Si no hay credenciales, devolver error
  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Faltan variables de entorno en Netlify");
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Faltan variables de entorno" }),
    };
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-cache",
    },
    body: `
            // Configuración inyectada desde Netlify (función serverless)
            window.SUPABASE_URL = '${supabaseUrl}';
            window.SUPABASE_ANON_KEY = '${supabaseKey}';
            window.CONFIG = {
                SUPABASE_URL: '${supabaseUrl}',
                SUPABASE_ANON_KEY: '${supabaseKey}'
            };
            console.log('✅ Configuración inyectada desde función serverless');
            console.log('📋 URL:', '${supabaseUrl}'.substring(0, 30) + '...');
        `,
  };
};
