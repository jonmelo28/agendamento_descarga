const BotUsuarioModel = require('../models/botUsuario');

const BotUsuarioController = {
  async listar(req, res) {
    try {
      const botUsuarios = await BotUsuarioModel.listar();
      res.render('bot-usuarios/index', {
        botUsuarios,
        sucesso: req.query.sucesso || null,
        erro:    req.query.erro    || null,
      });
    } catch (err) {
      console.error('Erro ao listar usuários do bot:', err);
      res.render('error', { titulo: 'Erro', mensagem: 'Não foi possível listar usuários do bot.' });
    }
  },

  exibirFormCriar(req, res) {
    res.render('bot-usuarios/form', { botUsuario: null, erro: null });
  },

  async criar(req, res) {
    const { telegram_id, username, nome } = req.body;

    if (!telegram_id || !nome) {
      return res.render('bot-usuarios/form', { botUsuario: req.body, erro: 'ID do Telegram e nome são obrigatórios.' });
    }

    if (isNaN(telegram_id)) {
      return res.render('bot-usuarios/form', { botUsuario: req.body, erro: 'ID do Telegram deve ser numérico.' });
    }

    try {
      const existente = await BotUsuarioModel.buscarPorTelegramId(telegram_id);
      if (existente) {
        return res.render('bot-usuarios/form', { botUsuario: req.body, erro: 'Telegram ID já cadastrado.' });
      }
      await BotUsuarioModel.criar({ telegram_id, username, nome });
      return res.redirect('/bot-usuarios?sucesso=Usuário+do+bot+criado+com+sucesso!');
    } catch (err) {
      console.error('Erro ao criar usuário do bot:', err);
      return res.render('bot-usuarios/form', { botUsuario: req.body, erro: 'Erro ao salvar usuário.' });
    }
  },

  async exibirFormEditar(req, res) {
    try {
      const botUsuario = await BotUsuarioModel.buscarPorId(req.params.id);
      if (!botUsuario) return res.redirect('/bot-usuarios?erro=Usuário+não+encontrado.');
      res.render('bot-usuarios/form', { botUsuario, erro: null });
    } catch (err) {
      res.redirect('/bot-usuarios?erro=Erro+ao+carregar+usuário.');
    }
  },

  async atualizar(req, res) {
    const { username, nome, ativo } = req.body;
    const { id } = req.params;

    if (!nome) {
      const botUsuario = await BotUsuarioModel.buscarPorId(id);
      return res.render('bot-usuarios/form', {
        botUsuario: { ...botUsuario, ...req.body },
        erro: 'Nome é obrigatório.',
      });
    }

    try {
      await BotUsuarioModel.atualizar(id, { username, nome, ativo: ativo === '1' ? 1 : 0 });
      return res.redirect('/bot-usuarios?sucesso=Usuário+atualizado+com+sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar usuário do bot:', err);
      return res.redirect('/bot-usuarios?erro=Erro+ao+atualizar.');
    }
  },

  async excluir(req, res) {
    try {
      await BotUsuarioModel.excluir(req.params.id);
      return res.redirect('/bot-usuarios?sucesso=Usuário+excluído+com+sucesso!');
    } catch (err) {
      console.error('Erro ao excluir usuário do bot:', err);
      return res.redirect('/bot-usuarios?erro=Erro+ao+excluir.');
    }
  },
};

module.exports = BotUsuarioController;
