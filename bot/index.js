require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const TelegramBot      = require('node-telegram-bot-api');
const moment           = require('moment');
moment.locale('pt-br');

const AgendamentoModel = require('../models/agendamento');
const BotUsuarioModel  = require('../models/botUsuario');
const BotRotaModel     = require('../models/botRota');
const MetricasModel    = require('../models/metricas');
const { gerarPDFAgendamentos } = require('../config/pdfGenerator');

// ---- Usuário bot fictício para agendamentos via bot ----
const BOT_USUARIO_ID = 1; // usa o id 1 (admin) como criador

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
if (!TOKEN) { console.error('❌ TELEGRAM_BOT_TOKEN não definido'); process.exit(1); }

const bot = new TelegramBot(TOKEN, { polling: true });
console.log('🤖 Bot Telegram iniciado...');

// ---- Estado das sessões de agendamento ----
// { [chatId]: { etapa, dados: {} } }
const sessoes = {};

// ---- Helpers ----
async function isAutorizado(chatId) {
  return BotUsuarioModel.estaAutorizado(chatId);
}

function msgNaoAutorizado(chatId) {
  bot.sendMessage(chatId,
    '⛔ *Acesso negado.*\n\nVocê não está autorizado. Contate o administrador.',
    { parse_mode: 'Markdown' }
  );
}

function formatarAgendamento(ag, idx) {
  const status = ag.recebido ? '✅ Recebido' : '⏳ Pendente';
  const dia = moment(ag.data_agendamento).format('dddd').replace(/^\w/, c => c.toUpperCase());
  return (
    `*${idx ? idx + '. ' : ''}${ag.nome_fornecedor}*\n` +
    `📋 Notas: ${ag.numeros_notas}\n` +
    `📅 ${moment(ag.data_agendamento).format('DD/MM/YYYY')} — ${dia}\n` +
    `🚛 ${ag.tipo_veiculo}  |  Canal: ${ag.canal}\n` +
    `📦 Volume: ${ag.volume ? ag.volume.toLocaleString('pt-BR') : '—'}  |  Contato: ${ag.contato || '—'}\n` +
    `Status: ${status}`
  );
}

async function enviarMenuPrincipal(chatId, nomeUsuario, permissoes) {
  const todasRotas = await BotRotaModel.listar(true); // apenas ativas

  // Filtrar rotas por permissão: se permissoes vazio = acesso total
  const rotas = (permissoes && permissoes.length > 0)
    ? todasRotas.filter(r => permissoes.includes(r.id))
    : todasRotas;

  if (rotas.length === 0) {
    return bot.sendMessage(chatId,
      `👋 Olá, *${nomeUsuario}*!\n\n⚠️ Você não possui nenhuma opção disponível.\nContate o administrador.`,
      { parse_mode: 'Markdown' }
    );
  }

  const botoes = rotas.map(r => [{ text: r.titulo, callback_data: `rota_${r.id}` }]);

  await bot.sendMessage(chatId,
    `👋 Olá, *${nomeUsuario}*!\n\n📦 *Sistema de Agendamento de Descarga*\n\nEscolha uma opção:`,
    {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: botoes },
    }
  );
}

// ---- /start e "oi" ----
bot.onText(/\/start|^oi$|^olá$|^ola$/i, async (msg) => {
  const chatId = msg.chat.id;
  if (!await isAutorizado(chatId)) return msgNaoAutorizado(chatId);
  const usuario = await BotUsuarioModel.buscarPorTelegramId(chatId);
  await enviarMenuPrincipal(chatId, usuario.nome, usuario.permissoes || []);
});

// ---- /id ----
bot.onText(/\/id/, (msg) => {
  bot.sendMessage(msg.chat.id, `🆔 Seu Telegram ID: \`${msg.chat.id}\``, { parse_mode: 'Markdown' });
});

// ---- Callback dos botões do menu ----
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const data   = query.data;
  await bot.answerCallbackQuery(query.id);

  if (!await isAutorizado(chatId)) return msgNaoAutorizado(chatId);

  // Rota dinâmica do banco
  if (data.startsWith('rota_')) {
    const rotaId = parseInt(data.replace('rota_', ''));

    // Verificar se o usuário tem permissão para essa rota
    const usuario = await BotUsuarioModel.buscarPorTelegramId(chatId);
    if (usuario && usuario.permissoes && usuario.permissoes.length > 0) {
      if (!usuario.permissoes.includes(rotaId)) {
        return bot.sendMessage(chatId, '⛔ Você não tem permissão para acessar essa opção.');
      }
    }

    const rota = await BotRotaModel.buscarPorId(rotaId);
    if (!rota) return bot.sendMessage(chatId, '❌ Opção não encontrada.');

    // Ações mapeadas por título — condições específicas ANTES das genéricas
    const t = rota.titulo.toLowerCase();

    if (t.includes('pdf') && t.includes('hoje')) {
      return executarPdfHoje(chatId);
    } else if (t.includes('pdf') && t.includes('pendente')) {
      return executarPdfPendentes(chatId);
    } else if (t.includes('agendar') || t.includes('fazer')) {
      return iniciarFluxoAgendamento(chatId);
    } else if (t.includes('hoje')) {
      return executarHoje(chatId);
    } else if (t.includes('pendente')) {
      return executarPendentes(chatId);
    } else if (t.includes('todos') || t.includes('agendamento')) {
      return executarTodos(chatId);
    } else {
      // Rota personalizada: apenas envia a descrição
      const texto = rota.descricao || `Você selecionou: *${rota.titulo}*`;
      return bot.sendMessage(chatId, texto, { parse_mode: 'Markdown' });
    }
  }

  // Confirmação do agendamento
  if (data === 'confirmar_agendamento') return confirmarAgendamento(chatId);
  if (data === 'cancelar_agendamento')  return cancelarAgendamento(chatId);

  // Seleção de tipo de veículo
  if (data.startsWith('veiculo_')) {
    const tipo = data.replace('veiculo_', '');
    if (sessoes[chatId]) {
      sessoes[chatId].dados.tipo_veiculo = tipo;
      sessoes[chatId].etapa = 'volume';
      await bot.sendMessage(chatId, `📦 Informe o *volume* (quantidade de volumes/caixas).\nDigite 0 ou "pular" para não informar:`, { parse_mode: 'Markdown' });
    }
  }

  // Seleção de canal
  if (data.startsWith('canal_')) {
    const canal = data.replace('canal_', '').replace(/_/g, ' ');
    if (sessoes[chatId]) {
      sessoes[chatId].dados.canal = canal;
      sessoes[chatId].etapa = 'tipo_veiculo';
      await bot.sendMessage(chatId, `🚛 Qual o *tipo de veículo*?`, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🚛 Carreta', callback_data: 'veiculo_carreta' }, { text: '🚛🚛 Bitrem', callback_data: 'veiculo_bitrem' }],
            [{ text: '🚚 Truck',   callback_data: 'veiculo_truck'   }, { text: '🚐 Outros',  callback_data: 'veiculo_outros'  }],
          ],
        },
      });
    }
  }
});

// ---- Funções de listagem ----
async function executarHoje(chatId) {
  const hoje = moment().format('YYYY-MM-DD');
  const lista = await AgendamentoModel.listar({ dataInicio: hoje, dataFim: hoje });
  if (lista.length === 0) {
    return bot.sendMessage(chatId, `📅 Nenhum agendamento para hoje (${moment().format('DD/MM/YYYY dddd')}).`);
  }
  const textos = lista.slice(0, 8).map((ag, i) => formatarAgendamento(ag, i + 1)).join('\n\n---\n\n');
  bot.sendMessage(chatId,
    `📅 *Hoje — ${moment().format('DD/MM/YYYY')} (${lista.length} agendamento(s))*\n\n${textos}`,
    { parse_mode: 'Markdown' }
  );
}

async function executarPendentes(chatId) {
  const lista = await AgendamentoModel.listar({ recebido: 0 });
  if (lista.length === 0) return bot.sendMessage(chatId, '✅ Não há agendamentos pendentes!');
  const textos = lista.slice(0, 8).map((ag, i) => formatarAgendamento(ag, i + 1)).join('\n\n---\n\n');
  bot.sendMessage(chatId,
    `⏳ *Pendentes (${lista.length})*\n\n${textos}` +
    (lista.length > 8 ? `\n\n_Use "Gerar PDF pendentes" para ver todos._` : ''),
    { parse_mode: 'Markdown' }
  );
}

async function executarTodos(chatId) {
  const lista = await AgendamentoModel.listar();
  if (lista.length === 0) return bot.sendMessage(chatId, '📭 Nenhum agendamento encontrado.');
  const textos = lista.slice(0, 8).map((ag, i) => formatarAgendamento(ag, i + 1)).join('\n\n---\n\n');
  bot.sendMessage(chatId,
    `📦 *Todos os Agendamentos (${lista.length} total)*\n\n${textos}` +
    (lista.length > 8 ? `\n\n_Mostrando 8 de ${lista.length}. Use "Gerar PDF" para o relatório completo._` : ''),
    { parse_mode: 'Markdown' }
  );
}

async function executarPdfHoje(chatId) {
  await bot.sendMessage(chatId, '⏳ Gerando PDF de hoje...');
  const hoje = moment().format('YYYY-MM-DD');
  const lista = await AgendamentoModel.listar({ dataInicio: hoje, dataFim: hoje });
  if (lista.length === 0) return bot.sendMessage(chatId, '📅 Nenhum agendamento hoje para gerar PDF.');
  const pdf = await gerarPDFAgendamentos(lista, {});
  await bot.sendDocument(chatId, pdf,
    { caption: `📄 Agendamentos de hoje — ${moment().format('DD/MM/YYYY')}` },
    { filename: `hoje_${moment().format('YYYYMMDD')}.pdf`, contentType: 'application/pdf' }
  );
}

async function executarPdfPendentes(chatId) {
  await bot.sendMessage(chatId, '⏳ Gerando PDF dos pendentes...');
  const lista = await AgendamentoModel.listar({ recebido: 0 });
  if (lista.length === 0) return bot.sendMessage(chatId, '✅ Não há pendentes!');
  const pdf = await gerarPDFAgendamentos(lista, {});
  await bot.sendDocument(chatId, pdf,
    { caption: `📄 Pendentes — ${moment().format('DD/MM/YYYY')}` },
    { filename: `pendentes_${moment().format('YYYYMMDD')}.pdf`, contentType: 'application/pdf' }
  );
}

// ---- Fluxo de agendamento pelo bot ----
function iniciarFluxoAgendamento(chatId) {
  sessoes[chatId] = { etapa: 'fornecedor', dados: {} };
  bot.sendMessage(chatId,
    `📋 *Novo Agendamento*\n\nDigite o *nome do fornecedor*:`,
    { parse_mode: 'Markdown' }
  );
}

async function processarEtapaAgendamento(chatId, texto) {
  const sessao = sessoes[chatId];
  if (!sessao) return;

  const { etapa, dados } = sessao;

  if (etapa === 'fornecedor') {
    dados.nome_fornecedor = texto.trim();
    sessao.etapa = 'notas';
    return bot.sendMessage(chatId, `📝 Informe o(s) *número(s) da(s) nota(s)*:\n_Ex.: NF-001, NF-002_`, { parse_mode: 'Markdown' });
  }

  if (etapa === 'notas') {
    dados.numeros_notas = texto.trim();
    sessao.etapa = 'data';
    return bot.sendMessage(chatId,
      `📅 Informe a *data do agendamento*:\n_Formato: DD/MM/AAAA — Ex.: ${moment().add(1,'day').format('DD/MM/YYYY')}_`,
      { parse_mode: 'Markdown' }
    );
  }

  if (etapa === 'data') {
    const data = moment(texto.trim(), 'DD/MM/YYYY', true);
    if (!data.isValid()) {
      return bot.sendMessage(chatId, '❌ Data inválida. Use o formato DD/MM/AAAA. Ex.: 25/12/2025');
    }
    if (data.isBefore(moment().startOf('day'))) {
      return bot.sendMessage(chatId, '❌ A data não pode ser no passado. Tente novamente:');
    }
    dados.data_agendamento = data.format('YYYY-MM-DD');
    sessao.etapa = 'canal';
    return bot.sendMessage(chatId, `🔢 Escolha o *canal*:`, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Canal 1', callback_data: 'canal_Canal_1' }, { text: 'Canal 2', callback_data: 'canal_Canal_2' }],
          [{ text: 'Canal 3', callback_data: 'canal_Canal_3' }, { text: 'Canal 4', callback_data: 'canal_Canal_4' }],
          [{ text: 'Canal 5', callback_data: 'canal_Canal_5' }, { text: 'Canal Especial', callback_data: 'canal_Canal_Especial' }],
        ],
      },
    });
  }

  if (etapa === 'volume') {
    const vol = texto.trim().toLowerCase();
    dados.volume = (vol === '0' || vol === 'pular' || vol === '') ? null : parseInt(vol) || null;
    sessao.etapa = 'contato';
    return bot.sendMessage(chatId,
      `📞 Informe o *contato* (e-mail ou telefone).\nDigite "pular" para não informar:`,
      { parse_mode: 'Markdown' }
    );
  }

  if (etapa === 'contato') {
    const c = texto.trim().toLowerCase();
    dados.contato = (c === 'pular' || c === '') ? null : texto.trim();
    sessao.etapa = 'confirmacao';

    // Verificar capacidade antes de confirmar
    const { disponivel, motivo } = await MetricasModel.verificarDisponibilidade(
      dados.data_agendamento, dados.tipo_veiculo, dados.volume || 0
    );

    if (!disponivel) {
      delete sessoes[chatId];
      return bot.sendMessage(chatId,
        `❌ *Não foi possível agendar:*\n\n${motivo}\n\nEscolha outra data ou contate o administrador.`,
        { parse_mode: 'Markdown' }
      );
    }

    const dia = moment(dados.data_agendamento).format('dddd').replace(/^\w/, c => c.toUpperCase());
    const resumo =
      `✅ *Confirmar agendamento?*\n\n` +
      `🏭 Fornecedor: *${dados.nome_fornecedor}*\n` +
      `📋 Notas: ${dados.numeros_notas}\n` +
      `📅 Data: ${moment(dados.data_agendamento).format('DD/MM/YYYY')} — ${dia}\n` +
      `🔢 Canal: ${dados.canal}\n` +
      `🚛 Veículo: ${dados.tipo_veiculo}\n` +
      `📦 Volume: ${dados.volume ? dados.volume.toLocaleString('pt-BR') : '—'}\n` +
      `📞 Contato: ${dados.contato || '—'}`;

    return bot.sendMessage(chatId, resumo, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Confirmar', callback_data: 'confirmar_agendamento' },
          { text: '❌ Cancelar',  callback_data: 'cancelar_agendamento'  },
        ]],
      },
    });
  }
}

async function confirmarAgendamento(chatId) {
  const sessao = sessoes[chatId];
  if (!sessao || sessao.etapa !== 'confirmacao') return;

  try {
    // Verificar capacidade novamente (race condition)
    const { disponivel, motivo } = await MetricasModel.verificarDisponibilidade(
      sessao.dados.data_agendamento, sessao.dados.tipo_veiculo, sessao.dados.volume || 0
    );

    if (!disponivel) {
      delete sessoes[chatId];
      return bot.sendMessage(chatId,
        `❌ *Agendamento não realizado:*\n\n${motivo}`,
        { parse_mode: 'Markdown' }
      );
    }

    await AgendamentoModel.criar({
      ...sessao.dados,
      origem:     'bot',
      usuario_id: BOT_USUARIO_ID,
    });

    delete sessoes[chatId];
    bot.sendMessage(chatId,
      `✅ *Agendamento realizado com sucesso!*\n\nFornecedor: *${sessao.dados.nome_fornecedor}*\nData: ${moment(sessao.dados.data_agendamento).format('DD/MM/YYYY')}`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('Erro ao criar agendamento via bot:', err);
    delete sessoes[chatId];
    bot.sendMessage(chatId, '❌ Erro ao salvar o agendamento. Tente novamente.');
  }
}

function cancelarAgendamento(chatId) {
  delete sessoes[chatId];
  bot.sendMessage(chatId, '❌ Agendamento cancelado.');
}

// ---- Captura de texto para fluxo de agendamento ----
bot.on('message', async (msg) => {
  if (!msg.text) return;
  const chatId = msg.chat.id;
  const texto  = msg.text;

  // Ignora comandos
  if (texto.startsWith('/')) return;

  // Se está em fluxo de agendamento
  if (sessoes[chatId] && sessoes[chatId].etapa !== 'confirmacao') {
    if (!await isAutorizado(chatId)) return;
    return processarEtapaAgendamento(chatId, texto);
  }

  // Ativadores do menu
  if (/^(oi|olá|ola|menu|ajuda|help)$/i.test(texto.trim())) {
    if (!await isAutorizado(chatId)) return msgNaoAutorizado(chatId);
    const usuario = await BotUsuarioModel.buscarPorTelegramId(chatId);
    return enviarMenuPrincipal(chatId, usuario.nome, usuario.permissoes || []);
  }
});

bot.on('polling_error', (err) => console.error('Polling error:', err.message));

module.exports = bot;
