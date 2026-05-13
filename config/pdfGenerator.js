const PDFDocument = require('pdfkit');
const moment = require('moment');

/**
 * Gera um buffer PDF com o relatório de agendamentos.
 * @param {Array} agendamentos - Lista de agendamentos
 * @param {Object} filtros - Filtros aplicados
 * @returns {Promise<Buffer>}
 */
function gerarPDFAgendamentos(agendamentos, filtros = {}) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ---- Cabeçalho ----
    doc.rect(0, 0, doc.page.width, 80).fill('#1a365d');
    doc
      .fillColor('#ffffff')
      .fontSize(20)
      .font('Helvetica-Bold')
      .text('SISTEMA DE AGENDAMENTO DE DESCARGA', 40, 20, { align: 'center' });
    doc
      .fontSize(12)
      .font('Helvetica')
      .text('Relatório de Agendamentos', 40, 48, { align: 'center' });

    doc.moveDown(3);

    // ---- Informações do relatório ----
    doc
      .fillColor('#333333')
      .fontSize(9)
      .font('Helvetica')
      .text(`Gerado em: ${moment().format('DD/MM/YYYY HH:mm:ss')}`, { align: 'right' });

    if (filtros.dataInicio || filtros.dataFim) {
      const periodo = [
        filtros.dataInicio ? `De: ${moment(filtros.dataInicio).format('DD/MM/YYYY')}` : '',
        filtros.dataFim    ? `Até: ${moment(filtros.dataFim).format('DD/MM/YYYY')}` : '',
      ].filter(Boolean).join('  |  ');
      doc.text(`Período: ${periodo}`, { align: 'right' });
    }

    doc.moveDown(0.5);

    // ---- Estatísticas ----
    const total      = agendamentos.length;
    const recebidos  = agendamentos.filter(a => a.recebido === 1).length;
    const pendentes  = total - recebidos;

    const statsY = doc.y;
    doc.rect(40, statsY, doc.page.width - 80, 40).fill('#edf2f7');
    doc
      .fillColor('#1a365d')
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(`Total: ${total}`, 60, statsY + 14);
    doc.text(`Recebidos: ${recebidos}`, 200, statsY + 14);
    doc.text(`Pendentes: ${pendentes}`, 360, statsY + 14);

    doc.moveDown(3);

    // ---- Tabela ----
    const tableTop = doc.y;
    const colWidths = [30, 130, 90, 75, 90, 90];
    const cols = [40, 70, 200, 290, 365, 455];
    const headers = ['#', 'Fornecedor', 'Nº das Notas', 'Agendamento', 'Canal', 'Status'];

    // Cabeçalho da tabela
    doc.rect(40, tableTop, doc.page.width - 80, 22).fill('#2d5a8e');
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
    headers.forEach((h, i) => {
      doc.text(h, cols[i] + 4, tableTop + 7, { width: colWidths[i], ellipsis: true });
    });

    let y = tableTop + 22;

    agendamentos.forEach((ag, idx) => {
      const rowHeight = 22;

      // Verificar quebra de página
      if (y + rowHeight > doc.page.height - 60) {
        doc.addPage();
        y = 40;
      }

      const bg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
      doc.rect(40, y, doc.page.width - 80, rowHeight).fill(bg);

      const statusColor = ag.recebido ? '#276749' : '#92400e';
      const statusText  = ag.recebido ? 'Recebido' : 'Pendente';
      const statusBg    = ag.recebido ? '#c6f6d5' : '#fef3c7';

      doc.fillColor('#333333').fontSize(8).font('Helvetica');
      doc.text(String(idx + 1),                             cols[0] + 4, y + 7, { width: colWidths[0] });
      doc.text(ag.nome_fornecedor,                          cols[1] + 4, y + 7, { width: colWidths[1], ellipsis: true });
      doc.text(ag.numeros_notas,                            cols[2] + 4, y + 7, { width: colWidths[2], ellipsis: true });
      doc.text(moment(ag.data_agendamento).format('DD/MM/YYYY'), cols[3] + 4, y + 7, { width: colWidths[3] });
      doc.text(ag.canal,                                    cols[4] + 4, y + 7, { width: colWidths[4], ellipsis: true });

      // Badge de status
      doc.rect(cols[5] + 4, y + 5, 60, 13).fill(statusBg);
      doc.fillColor(statusColor).font('Helvetica-Bold').fontSize(7)
        .text(statusText, cols[5] + 4, y + 8, { width: 60, align: 'center' });

      // Data de recebimento
      if (ag.data_recebimento) {
        doc.fillColor('#555').font('Helvetica').fontSize(7)
          .text(moment(ag.data_recebimento).format('DD/MM/YY'), cols[5] + 4, y + 13, { width: 60, align: 'center' });
      }

      y += rowHeight;
    });

    // ---- Rodapé ----
    doc
      .rect(0, doc.page.height - 35, doc.page.width, 35)
      .fill('#1a365d');
    doc
      .fillColor('#ffffff')
      .fontSize(8)
      .font('Helvetica')
      .text(
        'Sistema de Agendamento de Descarga - Documento gerado automaticamente',
        40,
        doc.page.height - 22,
        { align: 'center' }
      );

    doc.end();
  });
}

module.exports = { gerarPDFAgendamentos };
