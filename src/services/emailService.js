const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendNewUpdateNotification(userEmail, userName, processNumber) {
    if (!process.env.RESEND_API_KEY) {
        console.log("Chave da Resend não configurada. Pulando envio de email.");
        return;
    }
    try {
        await resend.emails.send({
            from: 'Arca Law <onboarding@resend.dev>',
            to: [userEmail],
            subject: `Nova Movimentação no Processo ${processNumber}`,
            html: `
                <h1>Olá, ${userName}!</h1>
                <p>Seu processo <strong>${processNumber}</strong> teve uma nova movimentação.</p>
                <p>Acesse o painel do Arca Law para ver os detalhes.</p>
                <br>
                <p>Atenciosamente,<br>Equipe Arca Law</p>
            `,
        });
    } catch (error) {
        console.error("Erro ao enviar email de notificação:", error);
    }
}

module.exports = {
    sendNewUpdateNotification
};