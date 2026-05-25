const AgendamentoModel = require('../models/agendamento');
const MetricasModel = require('../models/metricas');
const moment = require('moment');
moment.locale('pt-br');

const AgendamentoController = {
  async listar(req, res) {
    try {
      const { dataInicio, dataFim, recebido, fornecedor } = req.query;
      const agendamentos = await AgendamentoModel.listar({ dataInicio, dataFim, recebido, fornecedor });

      // Mapeia datas únicas para gerar classes de cor alternada
      const datasUnicas = [];
      agendamentos.forEach(ag => {
        const raw = ag.data_agendamento;
        let d;
        if (raw instanceof Date) {
          const ano = raw.getUTCFullYear();
          const mes = String(raw.getUTCMonth() + 1).padStart(2, '0');
          const dia = String(raw.getUTCDate()).padStart(2, '0');
          d = `${ano}-${mes}-${dia}`;
        } else {
          d = String(raw).substring(0, 10);
        }
        if (!datasUnicas.includes(d)) datasUnicas.push(d);
      });
      const corPorData = {};
      datasUnicas.forEach((d, i) => { corPorData[d] = i % 2 === 0 ? 'linha-azul' : 'linha-verde'; });

      res.render('agendamentos/index', {
        agendamentos, corPorData, filtros: { dataInicio, dataFim, recebido, fornecedor },
        moment, sucesso: req.query.sucesso || null, erro: req.query.erro || null,
      });
    } catch (err) {
      console.error('Erro ao listar agendamentos:', err);
      res.render('error', { titulo: 'Erro', mensagem: 'Não foi possível carregar os agendamentos.' });
    }
  },

  exibirFormCriar(req, res) {
    res.render('agendamentos/form', { agendamento: null, erro: null });
  },

  async criar(req, res) {
    const { nome_fornecedor, numeros_notas, data_agendamento, volume, contato, tipo_veiculo } = req.body;

    if (!nome_fornecedor || !data_agendamento) {
      return res.render('agendamentos/form', { agendamento: req.body, erro: 'Campos obrigatórios não preenchidos.' });
    }

    // Verificar capacidade
    const { disponivel, motivo } = await MetricasModel.verificarDisponibilidade(
      data_agendamento, tipo_veiculo || 'carreta', parseInt(volume) || 0
    );
    if (!disponivel) {
      return res.render('agendamentos/form', { agendamento: req.body, erro: motivo });
    }

    try {
      await AgendamentoModel.criar({
        nome_fornecedor: nome_fornecedor.trim(),
        numeros_notas: numeros_notas ? numeros_notas.trim() : null,
        data_agendamento,
        volume: parseInt(volume) || null,
        contato: contato ? contato.trim() : null,
        tipo_veiculo: tipo_veiculo || 'carreta',
        origem: 'portal',
        usuario_id: req.usuario.id,
      });
      return res.redirect('/agendamentos?sucesso=Agendamento+criado+com+sucesso!');
    } catch (err) {
      console.error('Erro ao criar agendamento:', err);
      return res.render('agendamentos/form', { agendamento: req.body, erro: 'Erro ao salvar agendamento.' });
    }
  },

  async exibirFormEditar(req, res) {
    try {
      const agendamento = await AgendamentoModel.buscarPorId(req.params.id);
      if (!agendamento) return res.redirect('/agendamentos?erro=Agendamento+não+encontrado.');
      res.render('agendamentos/form', { agendamento, erro: null });
    } catch (err) {
      res.redirect('/agendamentos?erro=Erro+ao+carregar+agendamento.');
    }
  },

  async atualizar(req, res) {
    const { nome_fornecedor, numeros_notas, data_agendamento, volume, contato, tipo_veiculo } = req.body;
    const { id } = req.params;

    if (!nome_fornecedor || !data_agendamento) {
      const agendamento = await AgendamentoModel.buscarPorId(id);
      return res.render('agendamentos/form', {
        agendamento: { ...agendamento, ...req.body }, erro: 'Campos obrigatórios não preenchidos.',
      });
    }

    // Verificar capacidade (excluindo o próprio registro)
    const { disponivel, motivo } = await MetricasModel.verificarDisponibilidade(
      data_agendamento, tipo_veiculo || 'carreta', parseInt(volume) || 0, id
    );
    if (!disponivel) {
      const agendamento = await AgendamentoModel.buscarPorId(id);
      return res.render('agendamentos/form', { agendamento: { ...agendamento, ...req.body }, erro: motivo });
    }

    try {
      await AgendamentoModel.atualizar(id, {
        nome_fornecedor, numeros_notas, data_agendamento,
        volume: parseInt(volume) || null,
        contato: contato ? contato.trim() : null,
        tipo_veiculo: tipo_veiculo || 'carreta',
      });
      return res.redirect('/agendamentos?sucesso=Agendamento+atualizado+com+sucesso!');
    } catch (err) {
      return res.redirect('/agendamentos?erro=Erro+ao+atualizar+agendamento.');
    }
  },

  async marcarRecebido(req, res) {
    const { data_recebimento } = req.body;
    if (!data_recebimento) return res.redirect('/agendamentos?erro=Data+de+recebimento+é+obrigatória.');
    try {
      await AgendamentoModel.marcarRecebido(req.params.id, data_recebimento);
      return res.redirect('/agendamentos?sucesso=Agendamento+marcado+como+recebido!');
    } catch (err) {
      return res.redirect('/agendamentos?erro=Erro+ao+atualizar+status.');
    }
  },

  async excluir(req, res) {
    try {
      await AgendamentoModel.excluir(req.params.id);
      return res.redirect('/agendamentos?sucesso=Agendamento+excluído+com+sucesso!');
    } catch (err) {
      return res.redirect('/agendamentos?erro=Erro+ao+excluir+agendamento.');
    }
  },
};

module.exports = AgendamentoController;
