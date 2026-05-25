/**
 * scripts/seed.js
 * Cria o usuário administrador padrão no banco.
 * Execute UMA vez após rodar o migration.sql:
 *
 *   node scripts/seed.js
 *
 * Você pode passar email e senha por argumento:
 *   node scripts/seed.js admin@empresa.com MinhaSenh@123
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const bcrypt       = require('bcryptjs');
const { pool, testConnection } = require('../config/database');

const email = process.argv[2] || 'admin@sistema.com';
const senha = process.argv[3] || 'Admin@123';

(async () => {
  await testConnection();

  try {
    // Verifica se já existe
    const [rows] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);

    if (rows.length > 0) {
      console.log(`ℹ️  Usuário "${email}" já existe. Atualizando a senha...`);
      const hash = await bcrypt.hash(senha, 12);
      await pool.query('UPDATE usuarios SET senha = ? WHERE email = ?', [hash, email]);
      console.log(`✅ Senha atualizada com sucesso!`);
    } else {
      const hash = await bcrypt.hash(senha, 12);
      await pool.query(
        'INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?, ?, ?, ?)',
        ['Administrador', email, hash, 'admin']
      );
      console.log(`✅ Usuário admin criado com sucesso!`);
    }

    console.log(`\n📋 Credenciais de acesso:`);
    console.log(`   E-mail : ${email}`);
    console.log(`   Senha  : ${senha}`);
    console.log(`\n⚠️  Troque a senha após o primeiro login!\n`);
  } catch (err) {
    console.error('❌ Erro ao criar usuário:', err.message);
  } finally {
    await pool.end();
  }
})();
