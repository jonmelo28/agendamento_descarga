const mysql2 = require('mysql2/promise');

const pool = mysql2.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '3306'),
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'agendamento_descarga',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '-03:00',
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Banco de dados conectado com sucesso.');
    conn.release();
  } catch (err) {
    console.error('❌ Erro ao conectar no banco de dados:', err.message);
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
