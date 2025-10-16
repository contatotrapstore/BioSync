const bcrypt = require('bcrypt');

async function testLogin() {
  const password = 'Teste123';
  const hashFromDB = '$2b$10$uNNw8Q5iZtcaT2yMnrKU.O8593ynLkWxDj10kXdskSe454PYnCWfq';

  console.log('Testing login with:');
  console.log('Password:', password);
  console.log('Hash from DB:', hashFromDB);
  console.log('');

  const isMatch = await bcrypt.compare(password, hashFromDB);
  console.log('Result:', isMatch ? '✅ MATCH' : '❌ NO MATCH');

  // Test other variations
  console.log('\n--- Testing variations ---');

  const variations = [
    'Teste123',
    'teste123',
    'TESTE123',
    ' Teste123',
    'Teste123 '
  ];

  for (const variant of variations) {
    const match = await bcrypt.compare(variant, hashFromDB);
    console.log(`"${variant}": ${match ? '✅' : '❌'}`);
  }
}

testLogin().catch(console.error);
