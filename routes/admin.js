const express = require('express');
const UsuarioController    = require('../controllers/usuarioController');
const BotUsuarioController = require('../controllers/botUsuarioController');
const MetricasController   = require('../controllers/metricasController');
const BotRotaController    = require('../controllers/botRotaController');
const { authMiddleware, autorizar } = require('../middleware/auth');

// ---- Usuários do sistema ----
// Listar/criar/excluir: admin. Editar/senha: qualquer autenticado (controller valida ownership)
const usuariosRouter = express.Router();
usuariosRouter.use(authMiddleware);
usuariosRouter.get('/',              autorizar('admin'), UsuarioController.listar);
usuariosRouter.get('/novo',          autorizar('admin'), UsuarioController.exibirFormCriar);
usuariosRouter.post('/',             autorizar('admin'), UsuarioController.criar);
usuariosRouter.get('/:id/editar',    UsuarioController.exibirFormEditar);
usuariosRouter.post('/:id',          UsuarioController.atualizar);
usuariosRouter.post('/:id/senha',    UsuarioController.alterarSenha);
usuariosRouter.post('/:id/excluir',  autorizar('admin'), UsuarioController.excluir);

// ---- Usuários do Bot ----
const botUsuariosRouter = express.Router();
botUsuariosRouter.use(authMiddleware, autorizar('admin'));
botUsuariosRouter.get('/',               BotUsuarioController.listar);
botUsuariosRouter.get('/novo',           BotUsuarioController.exibirFormCriar);
botUsuariosRouter.post('/',              BotUsuarioController.criar);
botUsuariosRouter.get('/:id/editar',     BotUsuarioController.exibirFormEditar);
botUsuariosRouter.post('/:id',           BotUsuarioController.atualizar);
botUsuariosRouter.post('/:id/excluir',   BotUsuarioController.excluir);

// ---- Métricas de capacidade ----
const metricasRouter = express.Router();
metricasRouter.use(authMiddleware, autorizar('admin'));
metricasRouter.get('/',    MetricasController.exibir);
metricasRouter.post('/',   MetricasController.atualizar);

// ---- Rotas do Bot ----
const botRotasRouter = express.Router();
botRotasRouter.use(authMiddleware, autorizar('admin'));
botRotasRouter.get('/',               BotRotaController.listar);
botRotasRouter.get('/novo',           BotRotaController.exibirFormCriar);
botRotasRouter.post('/',              BotRotaController.criar);
botRotasRouter.get('/:id/editar',     BotRotaController.exibirFormEditar);
botRotasRouter.post('/:id',           BotRotaController.atualizar);
botRotasRouter.post('/:id/excluir',   BotRotaController.excluir);

module.exports = { usuariosRouter, botUsuariosRouter, metricasRouter, botRotasRouter };
