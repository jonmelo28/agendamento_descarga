const { pool } = require('../config/database');

const MetricasModel = {
  /** Busca a configuração ativa (sempre id=1) */
  async buscar() {
    const [rows] = await pool.query(
      'SELECT * FROM metricas_dia WHERE ativo=1 ORDER BY id LIMIT 1'
    );
    return rows[0] || null;
  },

  async atualizar({ max_carros_dia, max_volume_dia, vagoes_carreta, vagoes_bitrem, vagoes_truck, vagoes_outros }) {
    // Upsert no registro id=1
    const [result] = await pool.query(
      `INSERT INTO metricas_dia (id, max_carros_dia, max_volume_dia, vagoes_carreta, vagoes_bitrem, vagoes_truck, vagoes_outros)
       VALUES (1, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         max_carros_dia=VALUES(max_carros_dia),
         max_volume_dia=VALUES(max_volume_dia),
         vagoes_carreta=VALUES(vagoes_carreta),
         vagoes_bitrem=VALUES(vagoes_bitrem),
         vagoes_truck=VALUES(vagoes_truck),
         vagoes_outros=VALUES(vagoes_outros)`,
      [max_carros_dia, max_volume_dia || 0, vagoes_carreta, vagoes_bitrem, vagoes_truck, vagoes_outros]
    );
    return result.affectedRows;
  },

  /**
   * Verifica se uma data tem capacidade disponível para o tipo de veículo.
   * Retorna { disponivel: bool, motivo: string|null }
   */
  async verificarDisponibilidade(data, tipo_veiculo, volume = 0, excluirId = null) {
    const metricas = await this.buscar();
    if (!metricas) return { disponivel: true, motivo: null };

    const AgendamentoModel = require('./agendamento');
    const { vagoes: vagoesUsados, volumeTotal: volUsado } = await AgendamentoModel.capacidadeUsadaNoDia(data, excluirId);

    const mapaVagoes = {
      carreta: metricas.vagoes_carreta,
      bitrem:  metricas.vagoes_bitrem,
      truck:   metricas.vagoes_truck,
      outros:  metricas.vagoes_outros,
    };
    const vagoesNovos = mapaVagoes[tipo_veiculo] ?? 1;

    if (vagoesUsados + vagoesNovos > metricas.max_carros_dia) {
      return {
        disponivel: false,
        motivo: `Capacidade de veículos esgotada para ${data}. Máximo: ${metricas.max_carros_dia} vagões/dia. Já utilizados: ${vagoesUsados}.`,
      };
    }

    if (metricas.max_volume_dia > 0 && (volUsado + (volume || 0)) > metricas.max_volume_dia) {
      return {
        disponivel: false,
        motivo: `Volume máximo do dia atingido (${metricas.max_volume_dia}). Já agendado: ${volUsado}.`,
      };
    }

    return { disponivel: true, motivo: null };
  },
};

module.exports = MetricasModel;
