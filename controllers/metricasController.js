const MetricasModel = require('../models/metricas');

const MetricasController = {
  async exibir(req, res) {
    try {
      const metricas = await MetricasModel.buscar();
      res.render('metricas/index', {
        metricas,
        sucesso: req.query.sucesso || null,
        erro:    req.query.erro    || null,
      });
    } catch (err) {
      console.error('Erro ao buscar métricas:', err);
      res.render('error', { titulo: 'Erro', mensagem: 'Não foi possível carregar as métricas.' });
    }
  },

  async atualizar(req, res) {
    const { max_carros_dia, max_volume_dia, vagoes_carreta, vagoes_bitrem, vagoes_truck, vagoes_outros } = req.body;

    if (!max_carros_dia || !vagoes_carreta || !vagoes_bitrem || !vagoes_truck || !vagoes_outros) {
      return res.redirect('/metricas?erro=Todos+os+campos+são+obrigatórios.');
    }

    try {
      await MetricasModel.atualizar({
        max_carros_dia:  parseInt(max_carros_dia),
        max_volume_dia:  parseInt(max_volume_dia) || 0,
        vagoes_carreta:  parseInt(vagoes_carreta),
        vagoes_bitrem:   parseInt(vagoes_bitrem),
        vagoes_truck:    parseInt(vagoes_truck),
        vagoes_outros:   parseInt(vagoes_outros),
      });
      return res.redirect('/metricas?sucesso=Métricas+atualizadas+com+sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar métricas:', err);
      return res.redirect('/metricas?erro=Erro+ao+salvar+métricas.');
    }
  },
};

module.exports = MetricasController;
