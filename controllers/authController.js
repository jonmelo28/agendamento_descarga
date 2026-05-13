const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/usuario');

const AuthController = {
  exibirLogin(req, res) {
    if (req.cookies?.token) {
      try {
        jwt.verify(req.cookies.token, process.env.JWT_SECRET);
        return res.redirect('/agendamentos');
      } catch (_) {
        res.clearCookie('token');
      }
    }
    res.render('login', { erro: null });
  },

  async login(req, res) {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.render('login', { erro: 'Preencha todos os campos.' });
    }

    try {
      const usuario = await UsuarioModel.buscarPorEmail(email.trim().toLowerCase());

      if (!usuario || !usuario.ativo) {
        return res.render('login', { erro: 'Credenciais inválidas.' });
      }

      const senhaValida = await UsuarioModel.verificarSenha(senha, usuario.senha);
      if (!senhaValida) {
        return res.render('login', { erro: 'Credenciais inválidas.' });
      }

      const payload = {
        id:     usuario.id,
        nome:   usuario.nome,
        email:  usuario.email,
        perfil: usuario.perfil,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      });

      res.cookie('token', token, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge:   8 * 60 * 60 * 1000, // 8 horas
      });

      return res.redirect('/agendamentos');
    } catch (err) {
      console.error('Erro no login:', err);
      return res.render('login', { erro: 'Erro interno. Tente novamente.' });
    }
  },

  logout(req, res) {
    res.clearCookie('token');
    return res.redirect('/login');
  },
};

module.exports = AuthController;
