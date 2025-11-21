/**
 * Script para verificar o estado atual do banco
 */

import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

async function checkStatus() {
  console.log('🔍 Verificando estado do banco...\n');

  try {
    // 1. Listar usuários
    console.log('1️⃣  Usuários:');
    const usersResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,name,email,user_role`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });
    const users = await usersResponse.json();
    users.forEach(u => {
      console.log(`   - ${u.name} (${u.email}) - ${u.user_role} - ID: ${u.id}`);
    });

    // 2. Listar turmas
    console.log('\n2️⃣  Turmas:');
    const classesResponse = await fetch(`${SUPABASE_URL}/rest/v1/classes?select=id,name,school_year,teacher_id`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });
    const classes = await classesResponse.json();
    classes.forEach(c => {
      const teacher = users.find(u => u.id === c.teacher_id);
      console.log(`   - ${c.name} (${c.school_year}) - Professor: ${teacher?.name || 'N/A'} - ID: ${c.id}`);
    });

    // 3. Listar alunos em turmas
    console.log('\n3️⃣  Alunos em Turmas:');
    const classStudentsResponse = await fetch(`${SUPABASE_URL}/rest/v1/class_students?select=student_id,class_id`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });
    const classStudents = await classStudentsResponse.json();

    if (classStudents.length === 0) {
      console.log('   ⚠️  NENHUM ALUNO VINCULADO A TURMAS!');
    } else {
      classStudents.forEach(cs => {
        const student = users.find(u => u.id === cs.student_id);
        const classInfo = classes.find(c => c.id === cs.class_id);
        console.log(`   - Aluno: ${student?.name || cs.student_id} → Turma: ${classInfo?.name || cs.class_id}`);
      });
    }

    // 4. Listar sessões
    console.log('\n4️⃣  Sessões:');
    const sessionsResponse = await fetch(`${SUPABASE_URL}/rest/v1/sessions?select=id,title,status,class_id,teacher_id,start_time`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });
    const sessions = await sessionsResponse.json();

    if (sessions.length === 0) {
      console.log('   ⚠️  NENHUMA SESSÃO CRIADA!');
    } else {
      sessions.forEach(s => {
        const classInfo = classes.find(c => c.id === s.class_id);
        const teacher = users.find(u => u.id === s.teacher_id);
        console.log(`   - ${s.title} | Status: ${s.status} | Turma: ${classInfo?.name || 'N/A'} | Professor: ${teacher?.name || 'N/A'}`);
      });
    }

    console.log('\n✅ Verificação concluída!\n');

    // Diagnóstico
    console.log('📋 DIAGNÓSTICO:');
    const studentsInClasses = classStudents.length > 0;
    const activeSessions = sessions.filter(s => s.status === 'active').length;

    if (!studentsInClasses) {
      console.log('   ❌ Problema: Nenhum aluno vinculado a turmas');
      console.log('   💡 Solução: Vá em Direção → Turmas → Editar turma → Adicionar alunos');
    }

    if (sessions.length === 0) {
      console.log('   ❌ Problema: Nenhuma sessão criada');
      console.log('   💡 Solução: Como professor, crie uma nova sessão');
    } else if (activeSessions === 0) {
      console.log('   ❌ Problema: Nenhuma sessão está ATIVA (status="active")');
      console.log('   💡 Solução: Como professor, inicie uma sessão existente');
    } else {
      console.log(`   ✅ Tudo OK! ${activeSessions} sessão(ões) ativa(s) encontrada(s)`);
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

checkStatus();
