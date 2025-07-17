require('dotenv').config();

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'STRIPE_API_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'CLIENT_URL',
  'STRIPE_PRICE_ID_MONTHLY',
  'STRIPE_PRICE_ID_YEARLY',
  'RESEND_API_KEY'
];

for (const varName of requiredEnvVars) {
  if (!process.env[varName]) {
    throw new Error(`Erro Crítico: A variável de ambiente obrigatória "${varName}" não foi definida.`);
  }
}

module.exports = {
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  stripeApiKey: process.env.STRIPE_API_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  clientUrl: process.env.CLIENT_URL,
  stripePriceIdMonthly: process.env.STRIPE_PRICE_ID_MONTHLY,
  stripePriceIdYearly: process.env.STRIPE_PRICE_ID_YEARLY,
  resendApiKey: process.env.RESEND_API_KEY
};