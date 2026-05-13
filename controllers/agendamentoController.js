const AgendamentoModel = require('../models/agendamento');
const moment = require('moment');

const AgendamentoController = {
  async listar(req, res) {
    try {
      const { dataInicio, dataFim, recebido, fornecedor } = req.query;
      const agendamentos = await AgendamentoModel.listar({ dataInicio, dataFim, recebido, fornecedor });

      res.render('agendamentos/index', {
        agendamentos,
        filtros: { dataInicio, dataFim, recebido, fornecedor },
        moment,
        sucesso: req.query.sucesso || null,
        erro: req.query.erro || null,
      });
    } catch (err) {
      console.error('Erro ao listar agendamentos:', err);
      res.render('error', { titulo: 'Erro', mensagem: 'Não foi possível carregar os agendamentos.' });
    }
  },

  exibirFormCriar(req, res) {
    res.render('agendamentos/form', {
      agendamento: null,
      erro: null,
    });
  },

  async criar(req, res) {
    const { nome_fornecedor, numeros_notas, data_agendamento, canal, volume, contato } = req.body;

    if (!nome_fornecedor || !numeros_notas || !data_agendamento || !canal) {
      return res.render('agendamentos/form', {
        agendamento: req.body,
        erro: 'Todos os campos são obrigatórios.',
      });
    }

    try {
      await AgendamentoModel.criar({
        nome_fornecedor: nome_fornecedor.trim(),
        numeros_notas:   numeros_notas.trim(),
        data_agendamento,
        canal:           canal.trim(),
        volume:          volume.trim(),
        contato:         contato.trim(),
        usuario_id:      req.usuario.id,
      });
      return res.redirect('/agendamentos?sucesso=Agendamento+criado+com+sucesso!');
    } catch (err) {
      console.error('Erro ao criar agendamento:', err);
      return res.render('agendamentos/form', {
        agendamento: req.body,
        erro: 'Erro ao salvar agendamento.',
      });
    }
  },

  async exibirFormEditar(req, res) {
    try {
      const agendamento = await AgendamentoModel.buscarPorId(req.params.id);
      if (!agendamento) return res.redirect('/agendamentos?erro=Agendamento+não+encontrado.');
      res.render('agendamentos/form', { agendamento, erro: null });
    } catch (err) {
      console.error('Erro ao buscar agendamento:', err);
      res.redirect('/agendamentos?erro=Erro+ao+carregar+agendamento.');
    }
  },

  async atualizar(req, res) {
    const { nome_fornecedor, numeros_notas, data_agendamento, canal, volume, contato } = req.body;
    const { id } = req.params;

    if (!nome_fornecedor || !numeros_notas || !data_agendamento || !canal) {
      const agendamento = await AgendamentoModel.buscarPorId(id);
      return res.render('agendamentos/form', {
        agendamento: { ...agendamento, ...req.body },
        erro: 'Todos os campos são obrigatórios.',
      });
    }

    try {
      await AgendamentoModel.atualizar(id, { nome_fornecedor, numeros_notas, data_agendamento, canal, volume, contato });
      return res.redirect('/agendamentos?sucesso=Agendamento+atualizado+com+sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar agendamento:', err);
      return res.redirect(`/agendamentos?erro=Erro+ao+atualizar+agendamento.`);
    }
  },

  async marcarRecebido(req, res) {
    const { id } = req.params;
    const { data_recebimento } = req.body;

    if (!data_recebimento) {
      return res.redirect('/agendamentos?erro=Data+de+recebimento+é+obrigatória.');
    }

    try {
      await AgendamentoModel.marcarRecebido(id, data_recebimento);
      return res.redirect('/agendamentos?sucesso=Agendamento+marcado+como+recebido!');
    } catch (err) {
      console.error('Erro ao marcar recebido:', err);
      return res.redirect('/agendamentos?erro=Erro+ao+atualizar+status.');
    }
  },

  async excluir(req, res) {
    try {
      await AgendamentoModel.excluir(req.params.id);
      return res.redirect('/agendamentos?sucesso=Agendamento+excluído+com+sucesso!');
    } catch (err) {
      console.error('Erro ao excluir agendamento:', err);
      return res.redirect('/agendamentos?erro=Erro+ao+excluir+agendamento.');
    }
  },
};

module.exports = AgendamentoController;
