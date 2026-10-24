const defaultOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://stock-portfolio-tracker-bice.vercel.app',
  'https://stock-portfolio-tracker-git-main-aditya-465e.vercel.app',
];

const allowedOrigins = new Set([
  ...defaultOrigins,
  process.env.CLIENT_URL,
  ...(process.env.CORS_ORIGINS || '').split(','),
].map((origin) => origin?.trim().replace(/\/$/, '')).filter(Boolean));

module.exports = allowedOrigins;
