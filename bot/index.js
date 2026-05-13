require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const TelegramBot = require('node-telegram-bot-api');
const moment = require('moment');
const AgendamentoModel = require('../models/agendamento');
const BotUsuarioModel  = require('../models/botUsuario');
const { gerarPDFAgendamentos } = require('../config/pdfGenerator');

// ---- Inicialização ----
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) {
  console.error('❌ TELEGRAM_BOT_TOKEN não definido no .env');
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });
console.log('🤖 Bot do Telegram iniciado...');

// ---- Helpers ----
async function isAutorizado(chatId) {
  return BotUsuarioModel.estaAutorizado(chatId);
}

function msgNaoAutorizado(chatId) {
  bot.sendMessage(chatId,
    '⛔ *Acesso negado.*\n\nVocê não está autorizado a usar este bot.\nContate o administrador do sistema.',
    { parse_mode: 'Markdown' }
  );
}

function formatarAgendamento(ag) {
  const status = ag.recebido ? '✅ Recebido' : '⏳ Pendente';
  const dataReceb = ag.data_recebimento
    ? moment(ag.data_recebimento).format('DD/MM/YYYY HH:mm')
    : '—';
  return (
    `*Fornecedor:* ${ag.nome_fornecedor}\n` +
    `*Notas:* ${ag.numeros_notas}\n` +
    `*Agendado:* ${moment(ag.data_agendamento).format('DD/MM/YYYY')}\n` +
    `*Canal:* ${ag.canal}\n` +
    `*Status:* ${status}\n` +
    `*Recebimento:* ${dataReceb}`
  );
}

// ---- Comandos ----

// /start - Boas-vindas
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const autorizado = await isAutorizado(chatId);

  if (!autorizado) return msgNaoAutorizado(chatId);

  const usuario = await BotUsuarioModel.buscarPorTelegramId(chatId);
  bot.sendMessage(chatId,
    `👋 Olá, *${usuario.nome}*!\n\n` +
    `📦 *Sistema de Agendamento de Descarga*\n\n` +
    `Comandos disponíveis:\n` +
    `• /agendamentos — Lista todos os agendamentos\n` +
    `• /pendentes — Lista agendamentos pendentes\n` +
    `• /hoje — Agendamentos do dia\n` +
    `• /pdf — Gerar relatório PDF\n` +
    `• /pdf\\_pendentes — PDF apenas dos pendentes\n` +
    `• /id — Ver seu Telegram ID\n` +
    `• /ajuda — Lista de comandos`,
    { parse_mode: 'Markdown' }
  );
});

// /id - Mostrar Telegram ID
bot.onText(/\/id/, (msg) => {
  bot.sendMessage(msg.chat.id,
    `🆔 Seu Telegram ID é: \`${msg.chat.id}\``,
    { parse_mode: 'Markdown' }
  );
});

// /ajuda
bot.onText(/\/ajuda/, async (msg) => {
  const chatId = msg.chat.id;
  if (!await isAutorizado(chatId)) return msgNaoAutorizado(chatId);

  bot.sendMessage(chatId,
    `📋 *Comandos disponíveis:*\n\n` +
    `• /agendamentos — Todos os agendamentos\n` +
    `• /pendentes — Apenas pendentes\n` +
    `• /hoje — Agendamentos do dia atual\n` +
    `• /pdf — PDF com todos os agendamentos\n` +
    `• /pdf\\_pendentes — PDF apenas dos pendentes\n` +
    `• /id — Seu Telegram ID`,
    { parse_mode: 'Markdown' }
  );
});

// /agendamentos - Listar todos
bot.onText(/\/agendamentos/, async (msg) => {
  const chatId = msg.chat.id;
  if (!await isAutorizado(chatId)) return msgNaoAutorizado(chatId);

  try {
    const lista = await AgendamentoModel.listar();

    if (lista.length === 0) {
      return bot.sendMessage(chatId, '📭 Nenhum agendamento encontrado.');
    }

    // Enviar em lotes de 5 para não ultrapassar limite do Telegram
    const lote = lista.slice(0, 10);
    const textos = lote.map((ag, i) => `*${i + 1}.* ${formatarAgendamento(ag)}`).join('\n\n---\n\n');

    await bot.sendMessage(chatId,
      `📦 *Agendamentos (${lista.length} total)*\n\n${textos}` +
      (lista.length > 10 ? `\n\n_Mostrando 10 de ${lista.length}. Use /pdf para o relatório completo._` : ''),
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('Erro /agendamentos:', err);
    bot.sendMessage(chatId, '❌ Erro ao buscar agendamentos.');
  }
});

// /pendentes
bot.onText(/\/pendentes/, async (msg) => {
  const chatId = msg.chat.id;
  if (!await isAutorizado(chatId)) return msgNaoAutorizado(chatId);

  try {
    const lista = await AgendamentoModel.listar({ recebido: 0 });

    if (lista.length === 0) {
      return bot.sendMessage(chatId, '✅ Não há agendamentos pendentes!');
    }

    const lote = lista.slice(0, 10);
    const textos = lote.map((ag, i) => `*${i + 1}.* ${formatarAgendamento(ag)}`).join('\n\n---\n\n');

    bot.sendMessage(chatId,
      `⏳ *Pendentes (${lista.length})*\n\n${textos}` +
      (lista.length > 10 ? `\n\n_Use /pdf\\_pendentes para o relatório completo._` : ''),
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('Erro /pendentes:', err);
    bot.sendMessage(chatId, '❌ Erro ao buscar pendentes.');
  }
});

// /hoje
bot.onText(/\/hoje/, async (msg) => {
  const chatId = msg.chat.id;
  if (!await isAutorizado(chatId)) return msgNaoAutorizado(chatId);

  try {
    const hoje = moment().format('YYYY-MM-DD');
    const lista = await AgendamentoModel.listar({ dataInicio: hoje, dataFim: hoje });

    if (lista.length === 0) {
      return bot.sendMessage(chatId, `📅 Nenhum agendamento para hoje (${moment().format('DD/MM/YYYY')}).`);
    }

    const textos = lista.map((ag, i) => `*${i + 1}.* ${formatarAgendamento(ag)}`).join('\n\n---\n\n');
    bot.sendMessage(chatId,
      `📅 *Agendamentos de hoje — ${moment().format('DD/MM/YYYY')} (${lista.length})*\n\n${textos}`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('Erro /hoje:', err);
    bot.sendMessage(chatId, '❌ Erro ao buscar agendamentos de hoje.');
  }
});

// /pdf - Relatório completo
bot.onText(/\/pdf$/, async (msg) => {
  const chatId = msg.chat.id;
  if (!await isAutorizado(chatId)) return msgNaoAutorizado(chatId);

  try {
    await bot.sendMessage(chatId, '⏳ Gerando relatório PDF, aguarde...');
    const lista = await AgendamentoModel.listar();
    const pdfBuffer = await gerarPDFAgendamentos(lista, {});

    await bot.sendDocument(chatId, pdfBuffer, {
      caption: `📄 Relatório completo — ${moment().format('DD/MM/YYYY HH:mm')}\nTotal: ${lista.length} agendamento(s)`,
    }, {
      filename: `agendamentos_${moment().format('YYYYMMDD')}.pdf`,
      contentType: 'application/pdf',
    });
  } catch (err) {
    console.error('Erro /pdf:', err);
    bot.sendMessage(chatId, '❌ Erro ao gerar PDF.');
  }
});

// /pdf_pendentes
bot.onText(/\/pdf_pendentes/, async (msg) => {
  const chatId = msg.chat.id;
  if (!await isAutorizado(chatId)) return msgNaoAutorizado(chatId);

  try {
    await bot.sendMessage(chatId, '⏳ Gerando PDF dos pendentes, aguarde...');
    const lista = await AgendamentoModel.listar({ recebido: 0 });

    if (lista.length === 0) {
      return bot.sendMessage(chatId, '✅ Não há agendamentos pendentes para gerar PDF!');
    }

    const pdfBuffer = await gerarPDFAgendamentos(lista, {});

    await bot.sendDocument(chatId, pdfBuffer, {
      caption: `📄 Relatório — Pendentes — ${moment().format('DD/MM/YYYY HH:mm')}\nTotal: ${lista.length} pendente(s)`,
    }, {
      filename: `pendentes_${moment().format('YYYYMMDD')}.pdf`,
      contentType: 'application/pdf',
    });
  } catch (err) {
    console.error('Erro /pdf_pendentes:', err);
    bot.sendMessage(chatId, '❌ Erro ao gerar PDF dos pendentes.');
  }
});

// Mensagens não reconhecidas
bot.on('message', async (msg) => {
  if (msg.text && msg.text.startsWith('/')) return; // comando não mapeado

  const chatId = msg.chat.id;
  if (!await isAutorizado(chatId)) return;

  bot.sendMessage(chatId,
    'Não entendi. Use /ajuda para ver os comandos disponíveis.',
  );
});

// Tratamento de erros de polling
bot.on('polling_error', (err) => {
  console.error('Polling error:', err.message);
});

module.exports = bot;
