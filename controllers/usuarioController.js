const UsuarioModel = require('../models/usuario');

const UsuarioController = {
  async listar(req, res) {
    try {
      const usuarios = await UsuarioModel.listar();
      res.render('usuarios/index', {
        usuarios,
        sucesso: req.query.sucesso || null,
        erro:    req.query.erro    || null,
      });
    } catch (err) {
      console.error('Erro ao listar usuários:', err);
      res.render('error', { titulo: 'Erro', mensagem: 'Não foi possível listar usuários.' });
    }
  },

  exibirFormCriar(req, res) {
    res.render('usuarios/form', { usuario: null, erro: null });
  },

  async criar(req, res) {
    const { nome, email, senha, confirmaSenha, perfil } = req.body;

    if (!nome || !email || !senha || !confirmaSenha || !perfil) {
      return res.render('usuarios/form', { usuario: req.body, erro: 'Todos os campos são obrigatórios.' });
    }

    if (senha !== confirmaSenha) {
      return res.render('usuarios/form', { usuario: req.body, erro: 'As senhas não conferem.' });
    }

    if (senha.length < 8) {
      return res.render('usuarios/form', { usuario: req.body, erro: 'A senha deve ter no mínimo 8 caracteres.' });
    }

    try {
      const existente = await UsuarioModel.buscarPorEmail(email.trim().toLowerCase());
      if (existente) {
        return res.render('usuarios/form', { usuario: req.body, erro: 'E-mail já cadastrado.' });
      }

      await UsuarioModel.criar({ nome, email: email.trim().toLowerCase(), senha, perfil });
      return res.redirect('/usuarios?sucesso=Usuário+criado+com+sucesso!');
    } catch (err) {
      console.error('Erro ao criar usuário:', err);
      return res.render('usuarios/form', { usuario: req.body, erro: 'Erro interno ao salvar usuário.' });
    }
  },

  async exibirFormEditar(req, res) {
    try {
      const usuario = await UsuarioModel.buscarPorId(req.params.id);
      if (!usuario) return res.redirect('/usuarios?erro=Usuário+não+encontrado.');
      res.render('usuarios/form', { usuario, erro: null });
    } catch (err) {
      console.error('Erro ao buscar usuário:', err);
      res.redirect('/usuarios?erro=Erro+ao+carregar+usuário.');
    }
  },

  async atualizar(req, res) {
    const { nome, email, perfil, ativo } = req.body;
    const { id } = req.params;

    if (!nome || !email || !perfil) {
      const usuario = await UsuarioModel.buscarPorId(id);
      return res.render('usuarios/form', {
        usuario: { ...usuario, ...req.body },
        erro: 'Preencha todos os campos obrigatórios.',
      });
    }

    try {
      await UsuarioModel.atualizar(id, {
        nome,
        email: email.trim().toLowerCase(),
        perfil,
        ativo: ativo === '1' ? 1 : 0,
      });
      return res.redirect('/usuarios?sucesso=Usuário+atualizado+com+sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err);
      return res.redirect('/usuarios?erro=Erro+ao+atualizar+usuário.');
    }
  },

  async alterarSenha(req, res) {
    const { novaSenha, confirmaSenha } = req.body;
    const { id } = req.params;

    if (!novaSenha || novaSenha !== confirmaSenha) {
      return res.redirect(`/usuarios/${id}/editar?erro=Senhas+não+conferem.`);
    }

    if (novaSenha.length < 8) {
      return res.redirect(`/usuarios/${id}/editar?erro=Senha+deve+ter+no+mínimo+8+caracteres.`);
    }

    try {
      await UsuarioModel.alterarSenha(id, novaSenha);
      return res.redirect('/usuarios?sucesso=Senha+alterada+com+sucesso!');
    } catch (err) {
      console.error('Erro ao alterar senha:', err);
      return res.redirect('/usuarios?erro=Erro+ao+alterar+senha.');
    }
  },

  async excluir(req, res) {
    const { id } = req.params;

    // Impede exclusão do próprio usuário logado
    if (parseInt(id) === req.usuario.id) {
      return res.redirect('/usuarios?erro=Você+não+pode+excluir+seu+próprio+usuário.');
    }

    try {
      await UsuarioModel.excluir(id);
      return res.redirect('/usuarios?sucesso=Usuário+excluído+com+sucesso!');
    } catch (err) {
      console.error('Erro ao excluir usuário:', err);
      return res.redirect('/usuarios?erro=Erro+ao+excluir+usuário.');
    }
  },
};

module.exports = UsuarioController;
