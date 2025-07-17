const { Resend } = require('resend');
const config = require('../config');

const resend = new Resend(config.resendApiKey);

const fromEmail = 'Arca Law <onboarding@resend.dev>';

async function sendNewUpdateNotification(userEmail, userName, processNumber, updates) {
    if (!config.resendApiKey) {
        console.log("Chave da Resend não configurada. Pulando envio de email.");
        return;
    }
    
    const updatesHtml = updates.map(u => `<li><strong>${u.date}:</strong> ${u.description}</li>`).join('');

    try {
        await resend.emails.send({
            from: fromEmail,
            to: [userEmail],
            subject: `Nova(s) Movimentação(ões) no Processo ${processNumber}`,
            html: `<h1>Olá, ${userName}!</h1><p>Seu processo <strong>${processNumber}</strong> teve ${updates.length} nova(s) movimentação(ões) detectada(s):</p><ul>${updatesHtml}</ul><p>Acesse o painel do Arca Law para ver todos os detalhes.</p><br><p>Atenciosamente,<br>Equipe Arca Law</p>`,
        });
    } catch (error) {
        console.error("Erro ao enviar email de notificação:", error);
    }
}

module.exports = {
    sendNewUpdateNotification
};