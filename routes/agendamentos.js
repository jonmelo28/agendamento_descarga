const express = require('express');
const router  = express.Router();
const AgendamentoController = require('../controllers/agendamentoController');
const { authMiddleware } = require('../middleware/auth');
const AgendamentoModel   = require('../models/agendamento');
const { gerarPDFAgendamentos } = require('../config/pdfGenerator');
const moment = require('moment');

router.use(authMiddleware);

router.get('/',           AgendamentoController.listar);
router.get('/novo',       AgendamentoController.exibirFormCriar);
router.post('/',          AgendamentoController.criar);
router.get('/:id/editar', AgendamentoController.exibirFormEditar);
router.post('/:id',       AgendamentoController.atualizar);
router.post('/:id/recebido', AgendamentoController.marcarRecebido);
router.post('/:id/excluir',  AgendamentoController.excluir);

// Exportar PDF
router.get('/exportar/pdf', async (req, res) => {
  try {
    const { dataInicio, dataFim, recebido, fornecedor } = req.query;
    const agendamentos = await AgendamentoModel.listarParaRelatorio({ dataInicio, dataFim, recebido, fornecedor });
    const pdfBuffer    = await gerarPDFAgendamentos(agendamentos, { dataInicio, dataFim });

    const fileName = `agendamentos_${moment().format('YYYYMMDD_HHmmss')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Erro ao gerar PDF:', err);
    res.redirect('/agendamentos?erro=Erro+ao+gerar+PDF.');
  }
});

module.exports = router;
