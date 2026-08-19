// ============================================
// INYECCIÓN DE CONFIGURACIÓN PARA NETLIFY
// ============================================

exports.handler = async function (event, context) {
  // Obtener variables de entorno de Netlify
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

  console.log("🔧 Inyectando configuración desde función serverless");
  console.log("📋 URL:", supabaseUrl);

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
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
