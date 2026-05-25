require('dotenv').config();

const express        = require('express');
const path           = require('path');
const cookieParser   = require('cookie-parser');
const methodOverride = require('method-override');

const { testConnection } = require('./config/database');
const authRoutes         = require('./routes/auth');
const agendamentoRoutes  = require('./routes/agendamentos');
const { usuariosRouter, botUsuariosRouter, metricasRouter, botRotasRouter } = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(methodOverride('_method'));

app.use('/',             authRoutes);
app.use('/agendamentos', agendamentoRoutes);
app.use('/usuarios',     usuariosRouter);
app.use('/bot-usuarios', botUsuariosRouter);
app.use('/metricas',     metricasRouter);
app.use('/bot-rotas',    botRotasRouter);

app.get('/', (req, res) => res.redirect('/agendamentos'));

app.use((req, res) => {
  res.status(404).render('error', { titulo: 'Página não encontrada', mensagem: 'A página que você procura não existe.', usuario: null });
});

app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).render('error', { titulo: 'Erro interno', mensagem: 'Ocorreu um erro inesperado.', usuario: res.locals.usuario || null });
});

(async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
    console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);
  });
})();

module.exports = app;
