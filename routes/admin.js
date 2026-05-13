const express = require('express');
const router  = express.Router();
const UsuarioController    = require('../controllers/usuarioController');
const BotUsuarioController = require('../controllers/botUsuarioController');
const { authMiddleware, autorizar } = require('../middleware/auth');

// ---- Usuários do sistema (apenas admin) ----
const usuariosRouter = express.Router();
usuariosRouter.use(authMiddleware, autorizar('admin'));

usuariosRouter.get('/',                  UsuarioController.listar);
usuariosRouter.get('/novo',              UsuarioController.exibirFormCriar);
usuariosRouter.post('/',                 UsuarioController.criar);
usuariosRouter.get('/:id/editar',        UsuarioController.exibirFormEditar);
usuariosRouter.post('/:id',              UsuarioController.atualizar);
usuariosRouter.post('/:id/senha',        UsuarioController.alterarSenha);
usuariosRouter.post('/:id/excluir',      UsuarioController.excluir);

// ---- Usuários do Bot Telegram (apenas admin) ----
const botUsuariosRouter = express.Router();
botUsuariosRouter.use(authMiddleware, autorizar('admin'));

botUsuariosRouter.get('/',               BotUsuarioController.listar);
botUsuariosRouter.get('/novo',           BotUsuarioController.exibirFormCriar);
botUsuariosRouter.post('/',              BotUsuarioController.criar);
botUsuariosRouter.get('/:id/editar',     BotUsuarioController.exibirFormEditar);
botUsuariosRouter.post('/:id',           BotUsuarioController.atualizar);
botUsuariosRouter.post('/:id/excluir',   BotUsuarioController.excluir);

module.exports = { usuariosRouter, botUsuariosRouter };
