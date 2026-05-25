const { pool } = require('../config/database');

const BotUsuarioModel = {
  async listar() {
    const [rows] = await pool.query(
      'SELECT * FROM bot_usuarios ORDER BY nome ASC'
    );
    return rows.map(r => ({
      ...r,
      permissoes: r.permissoes ? JSON.parse(r.permissoes) : [],
    }));
  },

  async buscarPorId(id) {
    const [rows] = await pool.query(
      'SELECT * FROM bot_usuarios WHERE id = ?',
      [id]
    );
    if (!rows[0]) return null;
    return { ...rows[0], permissoes: rows[0].permissoes ? JSON.parse(rows[0].permissoes) : [] };
  },

  async buscarPorTelegramId(telegram_id) {
    const [rows] = await pool.query(
      'SELECT * FROM bot_usuarios WHERE telegram_id = ?',
      [telegram_id]
    );
    if (!rows[0]) return null;
    return { ...rows[0], permissoes: rows[0].permissoes ? JSON.parse(rows[0].permissoes) : [] };
  },

  async criar({ telegram_id, username, nome, permissoes }) {
    const permJson = permissoes && permissoes.length > 0 ? JSON.stringify(permissoes) : null;
    const [result] = await pool.query(
      'INSERT INTO bot_usuarios (telegram_id, username, nome, permissoes) VALUES (?, ?, ?, ?)',
      [telegram_id, username || null, nome, permJson]
    );
    return result.insertId;
  },

  async atualizar(id, { username, nome, ativo, permissoes }) {
    const permJson = permissoes && permissoes.length > 0 ? JSON.stringify(permissoes) : null;
    const [result] = await pool.query(
      'UPDATE bot_usuarios SET username = ?, nome = ?, ativo = ?, permissoes = ? WHERE id = ?',
      [username || null, nome, ativo, permJson, id]
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
