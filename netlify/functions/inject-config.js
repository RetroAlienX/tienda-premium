// ============================================
// INYECCIÓN DE CONFIGURACIÓN PARA NETLIFY
// ============================================

exports.handler = async function (event, context) {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "no-cache",
    },
    body: `
            // Configuración inyectada desde Netlify
            window.SUPABASE_URL = '${supabaseUrl}';
            window.SUPABASE_ANON_KEY = '${supabaseKey}';
            window.CONFIG = {
                SUPABASE_URL: '${supabaseUrl}',
                SUPABASE_ANON_KEY: '${supabaseKey}'
            };
            console.log('✅ Configuración inyectada desde Netlify');
            console.log('📋 URL:', '${supabaseUrl}'.substring(0, 30) + '...');
        `,
  };
};
