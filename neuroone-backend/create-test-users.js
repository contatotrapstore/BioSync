import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = 'https://fsszpnbuabhhvrdmrtct.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzc3pwbmJ1YWJoaHZyZG1ydGN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM3MTY0NCwiZXhwIjoyMDc4OTQ3NjQ0fQ.PnXCdY0tV3kKLOB3mghRM5QMoIpGZEOj2u7vJhPuqUw';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const testUsers = [
  {
    email: 'admin@neuroone.com',
    password: 'Admin123',
    name: 'Administrador NeuroOne',
    user_role: 'direcao'
  },
  {
    email: 'professor@neuroone.com',
    password: 'Prof123',
    name: 'Professor Teste',
    user_role: 'professor'
  },
  {
    email: 'aluno@neuroone.com',
    password: 'Aluno123',
    name: 'Aluno Teste',
    user_role: 'aluno'
  }
];

async function createUsers() {
  console.log('🚀 Criando usuários de teste...\n');

  for (const userData of testUsers) {
    try {
      // 1. Create auth user
      console.log(`📝 Criando ${userData.email}...`);
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          name: userData.name,
          role: userData.user_role
        }
      });

      if (authError) {
        console.error(`❌ Erro ao criar auth user ${userData.email}:`, authError);
        continue;
      }

      console.log(`✅ Auth user criado: ${authData.user.id}`);

      // 2. Insert into public.users
      const { error: dbError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userData.email,
          name: userData.name,
          user_role: userData.user_role,
          active: true
        });

      if (dbError) {
        console.error(`❌ Erro ao inserir em public.users ${userData.email}:`, dbError);
      } else {
        console.log(`✅ Usuário ${userData.email} criado com sucesso!\n`);
      }

    } catch (error) {
      console.error(`❌ Erro inesperado ao criar ${userData.email}:`, error);
    }
  }

  console.log('✨ Processo concluído!\n');
  console.log('📋 Credenciais de teste:');
  console.log('   Admin:     admin@neuroone.com / Admin123');
  console.log('   Professor: professor@neuroone.com / Prof123');
  console.log('   Aluno:     aluno@neuroone.com / Aluno123');
}

createUsers();
