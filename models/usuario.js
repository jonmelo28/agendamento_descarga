const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;

const UsuarioModel = {
  async listar() {
    const [rows] = await pool.query(
      'SELECT id, nome, email, perfil, ativo, criado_em FROM usuarios ORDER BY nome ASC'
    );
    return rows;
  },

  async buscarPorId(id) {
    const [rows] = await pool.query(
      'SELECT id, nome, email, perfil, ativo, criado_em FROM usuarios WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async buscarPorEmail(email) {
    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  },

  async criar({ nome, email, senha, perfil = 'operador' }) {
    const hash = await bcrypt.hash(senha, SALT_ROUNDS);
    const [result] = await pool.query(
      'INSERT INTO usuarios (nome, email, senha, perfil) VALUES (?, ?, ?, ?)',
      [nome, email, hash, perfil]
    );
    return result.insertId;
  },

  async atualizar(id, { nome, email, perfil, ativo }) {
    const [result] = await pool.query(
      'UPDATE usuarios SET nome = ?, email = ?, perfil = ?, ativo = ? WHERE id = ?',
      [nome, email, perfil, ativo, id]
    );
    return result.affectedRows;
  },

  async alterarSenha(id, novaSenha) {
    const hash = await bcrypt.hash(novaSenha, SALT_ROUNDS);
    const [result] = await pool.query(
      'UPDATE usuarios SET senha = ? WHERE id = ?',
      [hash, id]
    );
    return result.affectedRows;
  },

  async excluir(id) {
    const [result] = await pool.query(
      'DELETE FROM usuarios WHERE id = ?',
      [id]
    );
    return result.affectedRows;
  },

  async verificarSenha(senha, hash) {
    return bcrypt.compare(senha, hash);
  },
};

module.exports = UsuarioModel;
