const { pool } = require('../config/database');

const AgendamentoModel = {
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
    sql += ' ORDER BY a.data_agendamento ASC, a.id ASC';
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async buscarPorId(id) {
    const [rows] = await pool.query('SELECT * FROM agendamentos WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async criar({ nome_fornecedor, numeros_notas, data_agendamento, canal, volume, contato, tipo_veiculo, origem, usuario_id }) {
    const [result] = await pool.query(
      `INSERT INTO agendamentos
        (nome_fornecedor, numeros_notas, data_agendamento, volume, contato, tipo_veiculo, origem, usuario_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [nome_fornecedor, numeros_notas, data_agendamento,
       volume || null, contato || null,
       tipo_veiculo || 'carreta', origem || 'portal', usuario_id]
    );
    return result.insertId;
  },

  async atualizar(id, { nome_fornecedor, numeros_notas, data_agendamento, volume, contato, tipo_veiculo }) {
    const [result] = await pool.query(
      `UPDATE agendamentos
       SET nome_fornecedor=?, numeros_notas=?, data_agendamento=?,
           volume=?, contato=?, tipo_veiculo=?
       WHERE id = ?`,
      [nome_fornecedor, numeros_notas, data_agendamento,
       volume || null, contato || null, tipo_veiculo || 'carreta', id]
    );
    return result.affectedRows;
  },

  async marcarRecebido(id, data_recebimento) {
    const [result] = await pool.query(
      'UPDATE agendamentos SET recebido=1, data_recebimento=? WHERE id=?',
      [data_recebimento, id]
    );
    return result.affectedRows;
  },

  async excluir(id) {
    const [result] = await pool.query('DELETE FROM agendamentos WHERE id=?', [id]);
    return result.affectedRows;
  },

  /** Vagões e volume já consumidos em um dia específico */
  async capacidadeUsadaNoDia(data, excluirId = null) {
    let sql = `
      SELECT a.tipo_veiculo, a.volume,
             m.vagoes_carreta, m.vagoes_bitrem, m.vagoes_truck, m.vagoes_outros
      FROM agendamentos a
      CROSS JOIN metricas_dia m
      WHERE m.ativo=1 AND a.data_agendamento=?
    `;
    const params = [data];
    if (excluirId) { sql += ' AND a.id != ?'; params.push(excluirId); }
    const [rows] = await pool.query(sql, params);
    let vagoes = 0, volumeTotal = 0;
    for (const r of rows) {
      const mapa = { carreta: r.vagoes_carreta, bitrem: r.vagoes_bitrem, truck: r.vagoes_truck, outros: r.vagoes_outros };
      vagoes += mapa[r.tipo_veiculo] ?? 1;
      volumeTotal += r.volume || 0;
    }
    return { vagoes, volumeTotal };
  },

  async listarParaRelatorio(filtros = {}) {
    return this.listar(filtros);
  },
};

module.exports = AgendamentoModel;
