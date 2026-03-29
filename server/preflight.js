require("dotenv").config();

const config = require("./config");

function startsWithHttps(value){
  return String(value || "").toLowerCase().startsWith("https://");
}

function isTestToken(value){
  return String(value || "").startsWith("TEST-");
}

function run(){
  const errors = [];
  const warnings = [];

  const isProd = config.NODE_ENV === "production";
  const isRealMp = config.MERCADO_PAGO_MODE === "real";

  if(isProd && !startsWithHttps(config.APP_BASE_URL)){
    errors.push("APP_BASE_URL debe ser https en produccion.");
  }

  if(isRealMp && !config.MERCADO_PAGO_ACCESS_TOKEN){
    errors.push("MERCADO_PAGO_MODE=real requiere MERCADO_PAGO_ACCESS_TOKEN.");
  }

  if(isProd && isRealMp && isTestToken(config.MERCADO_PAGO_ACCESS_TOKEN)){
    errors.push("En produccion no debes usar MERCADO_PAGO_ACCESS_TOKEN TEST-*.");
  }

  if(config.ADMIN_TOKEN_REQUIRED && !config.ADMIN_TOKEN){
    errors.push("ADMIN_TOKEN_REQUIRED=true requiere ADMIN_TOKEN.");
  }

  if(isProd && !config.WEBHOOK_SHARED_SECRET){
    errors.push("Falta WEBHOOK_SHARED_SECRET para validar webhooks en produccion.");
  }

  if(isProd && isRealMp && config.MERCADO_PAGO_FALLBACK_TO_MOCK){
    warnings.push("MERCADO_PAGO_FALLBACK_TO_MOCK=true: recomendado false en produccion real.");
  }

  if(isProd && config.CORREO_ARGENTINO_MODE !== "real"){
    warnings.push("CORREO_ARGENTINO_MODE no esta en real.");
  }

  if(isProd && config.MERCADO_PAGO_TEST_TOKEN_FORCE_MOCK){
    warnings.push("MERCADO_PAGO_TEST_TOKEN_FORCE_MOCK=true: recomendable false para produccion.");
  }

  if(!["mock", "correo_argentino"].includes(config.SHIPPING_PROVIDER)){
    errors.push("SHIPPING_PROVIDER debe ser mock|correo_argentino.");
  }

  if(config.SHIPPING_PROVIDER === "correo_argentino"){
    if(!config.CORREO_ARG_API_BASE_URL) warnings.push("Falta CORREO_ARG_API_BASE_URL.");
    if(!config.CORREO_ARG_API_KEY) warnings.push("Falta CORREO_ARG_API_KEY.");
    if(!config.CORREO_ARG_AGREEMENT) warnings.push("Falta CORREO_ARG_AGREEMENT.");
  }

  console.log("[preflight] NODE_ENV=", config.NODE_ENV);
  console.log("[preflight] APP_BASE_URL=", config.APP_BASE_URL);
  console.log("[preflight] MERCADO_PAGO_MODE=", config.MERCADO_PAGO_MODE);
  console.log("[preflight] SHIPPING_PROVIDER=", config.SHIPPING_PROVIDER);
  console.log("[preflight] CORREO_ARGENTINO_MODE=", config.CORREO_ARGENTINO_MODE);

  warnings.forEach((item)=> console.warn("[WARN]", item));
  errors.forEach((item)=> console.error("[ERROR]", item));

  if(errors.length){
    console.error(`\nPreflight fallido: ${errors.length} error(es), ${warnings.length} warning(s).`);
    process.exit(1);
  }

  console.log(`\nPreflight OK: 0 errores, ${warnings.length} warning(s).`);
}

run();
