const REQUIRED_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_KEY',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'ASAAS_API_KEY',
  'ASAAS_WEBHOOK_SECRET',
  'SUBSCRIPTION_VALUE'
];

const warnIfMissing = [
  'CORS_ORIGIN',
  'ASAAS_ENVIRONMENT'
];

const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((name) => {
    const value = process.env[name];
    return value === undefined || value === null || String(value).trim() === '';
  });

  if (missing.length > 0) {
    console.error('[config] Missing required environment variables:');
    missing.forEach((name) => console.error(`  - ${name}`));
    process.exit(1);
  }

  const warnings = warnIfMissing.filter((name) => {
    const value = process.env[name];
    return value === undefined || value === null || String(value).trim() === '';
  });

  warnings.forEach((name) => {
    console.warn(`[config] Environment variable ${name} not set. Using default behaviour.`);
  });
};

module.exports = validateEnv;
