const { pool } = require('../config/database');

const BotUsuarioModel = {
  async listar() {
    const [rows] = await pool.query(
      'SELECT * FROM bot_usuarios ORDER BY nome ASC'
    );
    return rows;
  },

  async buscarPorId(id) {
    const [rows] = await pool.query(
      'SELECT * FROM bot_usuarios WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async buscarPorTelegramId(telegram_id) {
    const [rows] = await pool.query(
      'SELECT * FROM bot_usuarios WHERE telegram_id = ?',
      [telegram_id]
    );
    return rows[0] || null;
  },

  async criar({ telegram_id, username, nome }) {
    const [result] = await pool.query(
      'INSERT INTO bot_usuarios (telegram_id, username, nome) VALUES (?, ?, ?)',
      [telegram_id, username || null, nome]
    );
    return result.insertId;
  },

  async atualizar(id, { username, nome, ativo }) {
    const [result] = await pool.query(
      'UPDATE bot_usuarios SET username = ?, nome = ?, ativo = ? WHERE id = ?',
      [username || null, nome, ativo, id]
    );
    return result.affectedRows;
  },

  async excluir(id) {
    const [result] = await pool.query(
      'DELETE FROM bot_usuarios WHERE id = ?',
      [id]
    );
    return result.affectedRows;
  },

  async estaAutorizado(telegram_id) {
    const usuario = await this.buscarPorTelegramId(telegram_id);
    return usuario && usuario.ativo === 1;
  },
};

module.exports = BotUsuarioModel;
