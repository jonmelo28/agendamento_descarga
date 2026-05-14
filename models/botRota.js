const { pool } = require('../config/database');

const BotRotaModel = {
  async listar(apenasAtivos = false) {
    const where = apenasAtivos ? 'WHERE ativo=1' : '';
    const [rows] = await pool.query(
      `SELECT * FROM bot_rotas ${where} ORDER BY ordem ASC, id ASC`
    );
    return rows;
  },

  async buscarPorId(id) {
    const [rows] = await pool.query('SELECT * FROM bot_rotas WHERE id=?', [id]);
    return rows[0] || null;
  },

  async criar({ titulo, descricao, ordem, ativo }) {
    const [result] = await pool.query(
      'INSERT INTO bot_rotas (titulo, descricao, ordem, ativo) VALUES (?, ?, ?, ?)',
      [titulo, descricao || null, ordem || 0, ativo ?? 1]
    );
    return result.insertId;
  },

  async atualizar(id, { titulo, descricao, ordem, ativo }) {
    const [result] = await pool.query(
      'UPDATE bot_rotas SET titulo=?, descricao=?, ordem=?, ativo=? WHERE id=?',
      [titulo, descricao || null, ordem || 0, ativo ?? 1, id]
    );
    return result.affectedRows;
  },

  async excluir(id) {
    const [result] = await pool.query('DELETE FROM bot_rotas WHERE id=?', [id]);
    return result.affectedRows;
  },
};

module.exports = BotRotaModel;
