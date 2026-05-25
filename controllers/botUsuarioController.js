const BotUsuarioModel = require('../models/botUsuario');
const BotRotaModel    = require('../models/botRota');

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
    BotRotaModel.listar(true).then(rotas => {
      res.render('bot-usuarios/form', { botUsuario: null, erro: null, rotas });
    });
  },

  async criar(req, res) {
    const { telegram_id, username, nome } = req.body;
    // permissoes pode vir como string (1 item) ou array
    let permissoes = req.body.permissoes || [];
    if (!Array.isArray(permissoes)) permissoes = [permissoes];
    permissoes = permissoes.map(Number).filter(Boolean);

    if (!telegram_id || !nome) {
      const rotas = await BotRotaModel.listar(true);
      return res.render('bot-usuarios/form', { botUsuario: { ...req.body, permissoes }, erro: 'ID do Telegram e nome são obrigatórios.', rotas });
    }

    if (isNaN(telegram_id)) {
      const rotas = await BotRotaModel.listar(true);
      return res.render('bot-usuarios/form', { botUsuario: { ...req.body, permissoes }, erro: 'ID do Telegram deve ser numérico.', rotas });
    }

    try {
      const existente = await BotUsuarioModel.buscarPorTelegramId(telegram_id);
      if (existente) {
        const rotas = await BotRotaModel.listar(true);
        return res.render('bot-usuarios/form', { botUsuario: { ...req.body, permissoes }, erro: 'Telegram ID já cadastrado.', rotas });
      }
      await BotUsuarioModel.criar({ telegram_id, username, nome, permissoes });
      return res.redirect('/bot-usuarios?sucesso=Usuário+do+bot+criado+com+sucesso!');
    } catch (err) {
      console.error('Erro ao criar usuário do bot:', err);
      const rotas = await BotRotaModel.listar(true);
      return res.render('bot-usuarios/form', { botUsuario: { ...req.body, permissoes }, erro: 'Erro ao salvar usuário.', rotas });
    }
  },

  async exibirFormEditar(req, res) {
    try {
      const botUsuario = await BotUsuarioModel.buscarPorId(req.params.id);
      if (!botUsuario) return res.redirect('/bot-usuarios?erro=Usuário+não+encontrado.');
      const rotas = await BotRotaModel.listar(true);
      res.render('bot-usuarios/form', { botUsuario, erro: null, rotas });
    } catch (err) {
      res.redirect('/bot-usuarios?erro=Erro+ao+carregar+usuário.');
    }
  },

  async atualizar(req, res) {
    const { username, nome, ativo } = req.body;
    const { id } = req.params;
    // permissoes pode vir como string (1 item) ou array
    let permissoes = req.body.permissoes || [];
    if (!Array.isArray(permissoes)) permissoes = [permissoes];
    permissoes = permissoes.map(Number).filter(Boolean);

    if (!nome) {
      const botUsuario = await BotUsuarioModel.buscarPorId(id);
      const rotas = await BotRotaModel.listar(true);
      return res.render('bot-usuarios/form', {
        botUsuario: { ...botUsuario, ...req.body, permissoes },
        erro: 'Nome é obrigatório.',
        rotas,
      });
    }

    try {
      await BotUsuarioModel.atualizar(id, { username, nome, ativo: ativo === '1' ? 1 : 0, permissoes });
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
