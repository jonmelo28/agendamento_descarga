const { pool } = require('../config/database');

const AgendamentoModel = {
  /**
   * Lista todos os agendamentos com nome do usuário criador.
   */
  async listar({ dataInicio, dataFim, recebido, fornecedor } = {}) {
    let sql = `
      SELECT a.*, u.nome AS criado_por
      FROM agendamentos a
      INNER JOIN usuarios u ON u.id = a.usuario_id
      WHERE 1=1
    `;
    const params = [];

    if (dataInicio) { sql += ' AND a.data_agendamento >= ?'; params.push(dataInicio); }
    if (dataFim)    { sql += ' AND a.data_agendamento <= ?'; params.push(dataFim); }
    if (recebido !== undefined && recebido !== '') {
      sql += ' AND a.recebido = ?'; params.push(recebido);
    }
    if (fornecedor) { sql += ' AND a.nome_fornecedor LIKE ?'; params.push(`%${fornecedor}%`); }

    sql += ' ORDER BY a.data_agendamento ASC, a.criado_em DESC';

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async buscarPorId(id) {
    const [rows] = await pool.query(
      'SELECT * FROM agendamentos WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async criar({ nome_fornecedor, numeros_notas, data_agendamento, canal, volume, contato, usuario_id }) {
    const [result] = await pool.query(
      `INSERT INTO agendamentos
        (nome_fornecedor, numeros_notas, data_agendamento, canal, volume, contato, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nome_fornecedor, numeros_notas, data_agendamento, canal, volume, contato, usuario_id]
    );
    return result.insertId;
  },

  async atualizar(id, { nome_fornecedor, numeros_notas, data_agendamento, canal, volume, contato }) {
    const [result] = await pool.query(
      `UPDATE agendamentos
       SET nome_fornecedor = ?, numeros_notas = ?, data_agendamento = ?, canal = ?, volume = ?, contato = ?
       WHERE id = ?`,
      [nome_fornecedor, numeros_notas, data_agendamento, canal, volume, contato, id]
    );
    return result.affectedRows;
  },

  async marcarRecebido(id, data_recebimento) {
    const [result] = await pool.query(
      `UPDATE agendamentos
       SET recebido = 1, data_recebimento = ?
       WHERE id = ?`,
      [data_recebimento, id]
    );
    return result.affectedRows;
  },

  async excluir(id) {
    const [result] = await pool.query(
      'DELETE FROM agendamentos WHERE id = ?',
      [id]
    );
    return result.affectedRows;
  },

  /** Resumo para relatório PDF */
  async listarParaRelatorio(filtros = {}) {
    return this.listar(filtros);
  },
};

module.exports = AgendamentoModel;
