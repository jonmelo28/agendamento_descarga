require('dotenv').config();

const express        = require('express');
const path           = require('path');
const cookieParser   = require('cookie-parser');
const methodOverride = require('method-override');

const { testConnection } = require('./config/database');
const authRoutes         = require('./routes/auth');
const agendamentoRoutes  = require('./routes/agendamentos');
const { usuariosRouter, botUsuariosRouter } = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 3000;

// ---- View Engine ----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ---- Middlewares globais ----
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));

// ---- Rotas ----
app.use('/',             authRoutes);
app.use('/agendamentos', agendamentoRoutes);
app.use('/usuarios',     usuariosRouter);
app.use('/bot-usuarios', botUsuariosRouter);

// Redirecionar raiz para /agendamentos
app.get('/', (req, res) => res.redirect('/agendamentos'));

// ---- 404 ----
app.use((req, res) => {
  res.status(404).render('error', {
    titulo:   'Página não encontrada',
    mensagem: 'A página que você procura não existe.',
    usuario:  null,
  });
});

// ---- Error handler global ----
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).render('error', {
    titulo:   'Erro interno',
    mensagem: 'Ocorreu um erro inesperado. Tente novamente.',
    usuario:  res.locals.usuario || null,
  });
});

// ---- Inicialização ----
(async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
    console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);
  });
})();

module.exports = app;
