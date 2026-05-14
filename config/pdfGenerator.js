const PDFDocument = require('pdfkit');
const moment = require('moment');
moment.locale('pt-br');

function gerarPDFAgendamentos(agendamentos, filtros = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 36, size: 'A4', layout: 'landscape' });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width;

    // ---- Cabeçalho ----
    doc.rect(0, 0, W, 70).fill('#0f2240');
    doc.fillColor('#fff').fontSize(16).font('Helvetica-Bold')
      .text('SISTEMA DE AGENDAMENTO DE DESCARGA', 36, 16, { align: 'center' });
    doc.fontSize(10).font('Helvetica')
      .text('Relatório de Agendamentos', 36, 40, { align: 'center' });

    doc.moveDown(4);

    // ---- Info do relatório ----
    doc.fillColor('#334155').fontSize(8).font('Helvetica')
      .text(`Gerado em: ${moment().format('DD/MM/YYYY HH:mm:ss')}`, 36, 80, { align: 'right' });

    if (filtros.dataInicio || filtros.dataFim) {
      const p = [
        filtros.dataInicio ? `De: ${moment(filtros.dataInicio).format('DD/MM/YYYY')}` : '',
        filtros.dataFim ? `Até: ${moment(filtros.dataFim).format('DD/MM/YYYY')}` : '',
      ].filter(Boolean).join('  |  ');
      doc.text(`Período: ${p}`, 36, 90, { align: 'right' });
    }

    // ---- Estatísticas ----
    const total = agendamentos.length;
    const recebidos = agendamentos.filter(a => a.recebido === 1).length;
    const sy = 105;
    doc.rect(36, sy, W - 72, 36).fill('#f1f5f9');
    doc.fillColor('#0f2240').fontSize(9).font('Helvetica-Bold')
      .text(`Total: ${total}`, 56, sy + 13)
      .text(`Recebidos: ${recebidos}`, 200, sy + 13)
      .text(`Pendentes: ${total - recebidos}`, 360, sy + 13);

    // ---- Helper: normaliza data_agendamento para string YYYY-MM-DD ----
    function normalizarData(raw) {
      if (raw instanceof Date) {
        const ano = raw.getUTCFullYear();
        const mes = String(raw.getUTCMonth() + 1).padStart(2, '0');
        const dia = String(raw.getUTCDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
      }
      return String(raw).substring(0, 10);
    }

    // ---- Colunas da tabela ----
    const cols   = [36, 180, 310, 415, 490, 560, 670];
    const widths = [140, 125, 100, 70, 65, 105, 90];
    const hdrs   = ['Fornecedor', 'Nº Notas', 'Agendamento', 'Dia', 'Volume', 'Contato', 'Status'];

    let y = sy + 46;

    const desenharCabecalhoTabela = (yPos) => {
      doc.rect(36, yPos, W - 72, 18).fill('#0f2240');
      doc.fillColor('#fff').fontSize(7.5).font('Helvetica-Bold');
      hdrs.forEach((h, i) => doc.text(h, cols[i] + 3, yPos + 5, { width: widths[i], ellipsis: true }));
      return yPos + 18;
    };

    y = desenharCabecalhoTabela(y);

    // ---- Linhas sem agrupamento — cor alternada simples ----
    agendamentos.forEach((ag, idx) => {
      const rowH = 20;

      if (y + rowH > doc.page.height - 40) {
        doc.addPage({ layout: 'landscape' });
        y = 36;
        y = desenharCabecalhoTabela(y);
      }

      // Alterna cinza-claro / branco
      const bg = idx % 2 === 0 ? '#f1f5f9' : '#ffffff';
      doc.rect(36, y, W - 72, rowH).fill(bg);

      const dataKey = normalizarData(ag.data_agendamento);
      const dataMom = moment(dataKey, 'YYYY-MM-DD', true);
      const dataFmt = dataMom.isValid() ? dataMom.format('DD/MM/YYYY') : dataKey;
      const diaFmt  = dataMom.isValid()
        ? dataMom.format('dddd').replace(/^\w/, c => c.toUpperCase())
        : '';

      const statusText = ag.recebido ? 'Recebido' : 'Pendente';
      const statusBg   = ag.recebido ? '#c6f6d5' : '#fef3c7';
      const statusClr  = ag.recebido ? '#276749' : '#92400e';

      doc.fillColor('#1e293b').fontSize(7.5).font('Helvetica');
      doc.text(ag.nome_fornecedor, cols[0] + 3, y + 6, { width: widths[0], ellipsis: true });
      doc.text(ag.numeros_notas,   cols[1] + 3, y + 6, { width: widths[1], ellipsis: true });
      doc.text(dataFmt,            cols[2] + 3, y + 6, { width: widths[2] });
      doc.text(diaFmt,             cols[3] + 3, y + 6, { width: widths[3], ellipsis: true });
      doc.text(ag.volume ? ag.volume.toLocaleString('pt-BR') : '—', cols[4] + 3, y + 6, { width: widths[4] });
      doc.text(ag.contato || '—',  cols[5] + 3, y + 6, { width: widths[5], ellipsis: true });

      // Badge status
      doc.rect(cols[6] + 3, y + 4, 62, 12).fill(statusBg);
      doc.fillColor(statusClr).font('Helvetica-Bold').fontSize(7)
        .text(statusText, cols[6] + 3, y + 7, { width: 62, align: 'center' });

      y += rowH;
    });

    // ---- Rodapé ----
    doc.rect(0, doc.page.height - 28, W, 28).fill('#0f2240');
    doc.fillColor('#fff').fontSize(7).font('Helvetica')
      .text('Sistema de Agendamento de Descarga — Documento gerado automaticamente', 36, doc.page.height - 16, { align: 'center' });

    doc.end();
  });
}

module.exports = { gerarPDFAgendamentos };
