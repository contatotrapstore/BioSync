const bcrypt = require('bcrypt');

async function test() {
  // Generate new hash
  const newHash = await bcrypt.hash('Teste123', 10);
  console.log('New hash:', newHash);

  // Test it
  const isMatch = await bcrypt.compare('Teste123', newHash);
  console.log('Match test:', isMatch);

  // Print for SQL
  console.log('\nSQL UPDATE:');
  console.log(`UPDATE users SET password = '${newHash}' WHERE email != 'psitalessales@gmail.com';`);
}

test();
