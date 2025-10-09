const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Service role key para bypass RLS no backend
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // Chave pública para o frontend

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_ANON_KEY must be defined in .env');
  process.exit(1);
}

// Use service key if available, otherwise use anon key
const supabaseKey = supabaseServiceKey && supabaseServiceKey !== 'your_service_role_key_here'
  ? supabaseServiceKey
  : supabaseAnonKey;

// Client com service key (para backend - bypass RLS)
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Client com anon key (para operações que respeitam RLS)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});

// Test connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error && error.code !== 'PGRST116') { // PGRST116 = tabela vazia, ok
      throw error;
    }

    console.log('✅ Supabase connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to Supabase:', error.message);
    console.error('   Make sure SUPABASE_URL and SUPABASE_SERVICE_KEY are correct in .env');
    return false;
  }
};

module.exports = {
  supabase,
  supabaseAnon,
  testConnection
};
