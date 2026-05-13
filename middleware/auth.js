const jwt = require('jsonwebtoken');

/**
 * Middleware de autenticação via JWT armazenado em cookie.
 * Redireciona para /login se o token estiver ausente ou inválido.
 */
function authMiddleware(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    res.locals.usuario = decoded; // disponível nas views EJS
    next();
  } catch (err) {
    res.clearCookie('token');
    return res.redirect('/login');
  }
}

/**
 * Middleware de autorização por perfil.
 * @param {...string} perfis - Perfis permitidos ('admin', 'operador')
 */
function autorizar(...perfis) {
  return (req, res, next) => {
    if (!req.usuario || !perfis.includes(req.usuario.perfil)) {
      return res.status(403).render('error', {
        titulo: 'Acesso negado',
        mensagem: 'Você não tem permissão para acessar esta página.',
        usuario: req.usuario || null,
      });
    }
    next();
  };
}

module.exports = { authMiddleware, autorizar };
