const BotRotaModel = require('../models/botRota');

const BotRotaController = {
  async listar(req, res) {
    try {
      const rotas = await BotRotaModel.listar();
      res.render('bot-rotas/index', {
        rotas,
        sucesso: req.query.sucesso || null,
        erro:    req.query.erro    || null,
      });
    } catch (err) {
      console.error('Erro ao listar rotas:', err);
      res.render('error', { titulo: 'Erro', mensagem: 'Não foi possível listar as rotas do bot.' });
    }
  },

  exibirFormCriar(req, res) {
    res.render('bot-rotas/form', { rota: null, erro: null });
  },

  async criar(req, res) {
    const { titulo, descricao, ordem, ativo } = req.body;
    if (!titulo) return res.render('bot-rotas/form', { rota: req.body, erro: 'Título é obrigatório.' });
    try {
      await BotRotaModel.criar({ titulo, descricao, ordem: parseInt(ordem) || 0, ativo: ativo === '1' ? 1 : 0 });
      return res.redirect('/bot-rotas?sucesso=Rota+criada+com+sucesso!');
    } catch (err) {
      return res.render('bot-rotas/form', { rota: req.body, erro: 'Erro ao salvar rota.' });
    }
  },

  async exibirFormEditar(req, res) {
    try {
      const rota = await BotRotaModel.buscarPorId(req.params.id);
      if (!rota) return res.redirect('/bot-rotas?erro=Rota+não+encontrada.');
      res.render('bot-rotas/form', { rota, erro: null });
    } catch (err) {
      res.redirect('/bot-rotas?erro=Erro+ao+carregar+rota.');
    }
  },

  async atualizar(req, res) {
    const { titulo, descricao, ordem, ativo } = req.body;
    if (!titulo) {
      const rota = await BotRotaModel.buscarPorId(req.params.id);
      return res.render('bot-rotas/form', { rota: { ...rota, ...req.body }, erro: 'Título é obrigatório.' });
    }
    try {
      await BotRotaModel.atualizar(req.params.id, {
        titulo, descricao, ordem: parseInt(ordem) || 0, ativo: ativo === '1' ? 1 : 0,
      });
      return res.redirect('/bot-rotas?sucesso=Rota+atualizada+com+sucesso!');
    } catch (err) {
      return res.redirect('/bot-rotas?erro=Erro+ao+atualizar+rota.');
    }
  },

  async excluir(req, res) {
    try {
      await BotRotaModel.excluir(req.params.id);
      return res.redirect('/bot-rotas?sucesso=Rota+excluída+com+sucesso!');
    } catch (err) {
      return res.redirect('/bot-rotas?erro=Erro+ao+excluir+rota.');
    }
  },
};

module.exports = BotRotaController;
