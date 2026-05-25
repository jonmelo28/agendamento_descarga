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
    res.render('usuarios/form', { usuario: null, erro: null, modoProprioUsuario: false });
  },

  async criar(req, res) {
    const { nome, email, senha, confirmaSenha, perfil } = req.body;
    if (!nome || !email || !senha || !confirmaSenha || !perfil) {
      return res.render('usuarios/form', { usuario: req.body, erro: 'Todos os campos são obrigatórios.', modoProprioUsuario: false });
    }
    if (senha !== confirmaSenha) {
      return res.render('usuarios/form', { usuario: req.body, erro: 'As senhas não conferem.', modoProprioUsuario: false });
    }
    if (senha.length < 8) {
      return res.render('usuarios/form', { usuario: req.body, erro: 'A senha deve ter no mínimo 8 caracteres.', modoProprioUsuario: false });
    }
    try {
      const existente = await UsuarioModel.buscarPorEmail(email.trim().toLowerCase());
      if (existente) {
        return res.render('usuarios/form', { usuario: req.body, erro: 'E-mail já cadastrado.', modoProprioUsuario: false });
      }
      await UsuarioModel.criar({ nome, email: email.trim().toLowerCase(), senha, perfil });
      return res.redirect('/usuarios?sucesso=Usuário+criado+com+sucesso!');
    } catch (err) {
      console.error('Erro ao criar usuário:', err);
      return res.render('usuarios/form', { usuario: req.body, erro: 'Erro interno ao salvar usuário.', modoProprioUsuario: false });
    }
  },

  async exibirFormEditar(req, res) {
    try {
      const usuario = await UsuarioModel.buscarPorId(req.params.id);
      if (!usuario) return res.redirect('/agendamentos?erro=Usuário+não+encontrado.');

      // Operador só pode editar a si mesmo
      if (req.usuario.perfil !== 'admin' && parseInt(req.params.id) !== req.usuario.id) {
        return res.status(403).render('error', {
          titulo: 'Acesso negado',
          mensagem: 'Você só pode editar o seu próprio perfil.',
        });
      }
      const modoProprioUsuario = parseInt(req.params.id) === req.usuario.id;
      res.render('usuarios/form', { usuario, erro: null, modoProprioUsuario });
    } catch (err) {
      res.redirect('/agendamentos?erro=Erro+ao+carregar+perfil.');
    }
  },

  async atualizar(req, res) {
    const { nome, email, perfil, ativo } = req.body;
    const { id } = req.params;

    // Operador só pode editar a si mesmo
    if (req.usuario.perfil !== 'admin' && parseInt(id) !== req.usuario.id) {
      return res.status(403).render('error', { titulo: 'Acesso negado', mensagem: 'Permissão negada.' });
    }

    if (!nome || !email) {
      const usuario = await UsuarioModel.buscarPorId(id);
      const modoProprioUsuario = parseInt(id) === req.usuario.id;
      return res.render('usuarios/form', {
        usuario: { ...usuario, ...req.body },
        erro: 'Nome e e-mail são obrigatórios.',
        modoProprioUsuario,
      });
    }

    try {
      // Operador não pode alterar o próprio perfil nem status
      const perfilFinal = req.usuario.perfil === 'admin' ? perfil : undefined;
      const ativoFinal  = req.usuario.perfil === 'admin' ? (ativo === '1' ? 1 : 0) : undefined;

      await UsuarioModel.atualizar(id, {
        nome,
        email:  email.trim().toLowerCase(),
        perfil: perfilFinal ?? req.usuario.perfil,
        ativo:  ativoFinal  ?? 1,
      });

      const redirecionamento = req.usuario.perfil === 'admin' ? '/usuarios' : '/agendamentos';
      return res.redirect(`${redirecionamento}?sucesso=Perfil+atualizado+com+sucesso!`);
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err);
      return res.redirect('/agendamentos?erro=Erro+ao+atualizar+perfil.');
    }
  },

  async alterarSenha(req, res) {
    const { novaSenha, confirmaSenha } = req.body;
    const { id } = req.params;

    // Operador só pode alterar a própria senha
    if (req.usuario.perfil !== 'admin' && parseInt(id) !== req.usuario.id) {
      return res.status(403).render('error', { titulo: 'Acesso negado', mensagem: 'Permissão negada.' });
    }

    if (!novaSenha || novaSenha !== confirmaSenha) {
      return res.redirect(`/usuarios/${id}/editar?erro=Senhas+não+conferem.`);
    }
    if (novaSenha.length < 8) {
      return res.redirect(`/usuarios/${id}/editar?erro=Senha+deve+ter+no+mínimo+8+caracteres.`);
    }
    try {
      await UsuarioModel.alterarSenha(id, novaSenha);
      return res.redirect('/agendamentos?sucesso=Senha+alterada+com+sucesso!');
    } catch (err) {
      return res.redirect('/agendamentos?erro=Erro+ao+alterar+senha.');
    }
  },

  async excluir(req, res) {
    const { id } = req.params;
    if (parseInt(id) === req.usuario.id) {
      return res.redirect('/usuarios?erro=Você+não+pode+excluir+seu+próprio+usuário.');
    }
    try {
      await UsuarioModel.excluir(id);
      return res.redirect('/usuarios?sucesso=Usuário+excluído+com+sucesso!');
    } catch (err) {
      return res.redirect('/usuarios?erro=Erro+ao+excluir+usuário.');
    }
  },
};

module.exports = UsuarioController;
