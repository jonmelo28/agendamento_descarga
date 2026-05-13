# 📦 Sistema de Agendamento de Descarga

Sistema web completo para gerenciamento de agendamentos de descarga com painel administrativo, autenticação JWT e bot do Telegram.

---

## 🏗️ Tecnologias

| Camada       | Tecnologia                        |
|--------------|-----------------------------------|
| Backend      | Node.js + Express                 |
| Banco dados  | MySQL (via mysql2)                |
| Frontend     | EJS (templates) + CSS customizado |
| Autenticação | JWT em cookie HttpOnly            |
| PDF          | PDFKit                            |
| Bot          | node-telegram-bot-api             |

---

## 🚀 Instalação

### 1. Clone e instale as dependências

```bash
cd agendamento-descarga
npm install
```

### 2. Configure o ambiente

```bash
cp .env.example .env
# Edite o .env com suas credenciais
```

Variáveis obrigatórias no `.env`:
```
DB_HOST=localhost
DB_USER=seu_usuario_mysql
DB_PASSWORD=sua_senha_mysql
DB_NAME=agendamento_descarga
JWT_SECRET=uma_string_secreta_longa_e_aleatoria
SESSION_SECRET=outra_string_secreta
TELEGRAM_BOT_TOKEN=token_do_seu_bot
```

### 3. Crie o banco de dados

```bash
mysql -u root -p < config/migration.sql
```

### 4. Inicie o sistema

```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start
```

Acesse: **http://localhost:3000**

---

## 🔐 Credenciais padrão

| Campo | Valor           |
|-------|-----------------|
| Email | admin@sistema.com |
| Senha | Admin@123       |

> ⚠️ **TROQUE A SENHA IMEDIATAMENTE após o primeiro login!**

---

## 🤖 Bot do Telegram

### Configurar o bot

1. Crie um bot via [@BotFather](https://t.me/BotFather) no Telegram
2. Copie o token gerado para o `.env` (`TELEGRAM_BOT_TOKEN`)
3. No painel admin, vá em **Bot Telegram** e cadastre os Telegram IDs autorizados
4. Inicie o bot:

```bash
npm run bot
```

### Comandos disponíveis no bot

| Comando           | Descrição                              |
|-------------------|----------------------------------------|
| `/start`          | Boas-vindas e lista de comandos        |
| `/agendamentos`   | Lista todos os agendamentos            |
| `/pendentes`      | Lista apenas os pendentes              |
| `/hoje`           | Agendamentos do dia atual              |
| `/pdf`            | Gera PDF com todos os agendamentos     |
| `/pdf_pendentes`  | Gera PDF apenas dos pendentes          |
| `/id`             | Mostra seu Telegram ID                 |
| `/ajuda`          | Lista de comandos                      |

Para obter o Telegram ID de um usuário: peça que envie `/id` para o bot ou use [@userinfobot](https://t.me/userinfobot).

---

## 📂 Estrutura do projeto

```
agendamento-descarga/
├── app.js                    # Entrada principal
├── .env.example              # Modelo de variáveis de ambiente
├── config/
│   ├── database.js           # Pool de conexão MySQL
│   ├── migration.sql         # Script de criação do banco
│   └── pdfGenerator.js       # Gerador de PDF (PDFKit)
├── controllers/
│   ├── authController.js
│   ├── agendamentoController.js
│   ├── usuarioController.js
│   └── botUsuarioController.js
├── middleware/
│   └── auth.js               # JWT + autorização por perfil
├── models/
│   ├── agendamento.js
│   ├── usuario.js
│   └── botUsuario.js
├── routes/
│   ├── auth.js
│   ├── agendamentos.js
│   └── admin.js
├── views/
│   ├── login.ejs
│   ├── error.ejs
│   ├── partials/
│   │   ├── header.ejs
│   │   └── footer.ejs
│   ├── agendamentos/
│   │   ├── index.ejs
│   │   └── form.ejs
│   ├── usuarios/
│   │   ├── index.ejs
│   │   └── form.ejs
│   └── bot-usuarios/
│       ├── index.ejs
│       └── form.ejs
├── public/
│   └── css/
│       └── style.css
└── bot/
    └── index.js              # Bot do Telegram
```

---

## 🛡️ Segurança implementada

- **JWT em cookie HttpOnly** — token não acessível via JavaScript
- **Secure cookie** — ativo em produção (HTTPS)
- **SameSite: strict** — proteção contra CSRF
- **Bcrypt (12 rounds)** — hash seguro de senhas
- **Autorização por perfil** — admin vs operador
- **Proteção de auto-exclusão** — usuário não pode excluir a si mesmo
- **Validação de entradas** — server-side em todos os controllers

---

## 🔧 Personalização dos canais

Para alterar os canais de agendamento disponíveis, edite o array em `views/agendamentos/form.ejs`:

```javascript
const canais = ['Canal 1', 'Canal 2', 'Canal 3', 'Canal 4', 'Canal 5', 'Canal Especial'];
```

---

## 📝 Perfis de usuário

| Perfil    | Permissões                                                  |
|-----------|-------------------------------------------------------------|
| `admin`   | Acesso total: agendamentos + usuários + usuários do bot     |
| `operador`| Apenas agendamentos (criar, editar, excluir, marcar recebido)|
