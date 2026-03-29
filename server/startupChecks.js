const config = require("./config");
const logger = require("./logger");

function runStartupChecks(){
  const warnings = [];

  if(config.NODE_ENV === "production" && !String(config.APP_BASE_URL || "").toLowerCase().startsWith("https://")){
    warnings.push("APP_BASE_URL deberia usar https en produccion.");
  }

  if(config.MERCADO_PAGO_MODE === "real" && !config.MERCADO_PAGO_ACCESS_TOKEN){
    warnings.push("MERCADO_PAGO_MODE=real pero falta MERCADO_PAGO_ACCESS_TOKEN.");
  }

  if(config.ADMIN_TOKEN_REQUIRED && !config.ADMIN_TOKEN){
    warnings.push("ADMIN_TOKEN_REQUIRED=true pero falta ADMIN_TOKEN.");
  }

  if(config.NODE_ENV === "production" && !config.WEBHOOK_SHARED_SECRET){
    warnings.push("Falta WEBHOOK_SHARED_SECRET en produccion.");
  }

  if(config.NODE_ENV === "production" && config.MERCADO_PAGO_MODE === "real" && config.MERCADO_PAGO_FALLBACK_TO_MOCK){
    warnings.push("MERCADO_PAGO_FALLBACK_TO_MOCK=true en produccion: recomendado false para operacion real estricta.");
  }

  if(!["mock", "correo_argentino"].includes(config.SHIPPING_PROVIDER)){
    warnings.push("SHIPPING_PROVIDER invalido. Valores esperados: mock|correo_argentino.");
  }

  if(config.SHIPPING_PROVIDER === "correo_argentino"){
    if(!config.CORREO_ARG_API_BASE_URL) warnings.push("SHIPPING_PROVIDER=correo_argentino pero falta CORREO_ARG_API_BASE_URL.");
    if(!config.CORREO_ARG_API_KEY) warnings.push("SHIPPING_PROVIDER=correo_argentino pero falta CORREO_ARG_API_KEY.");
    if(!config.CORREO_ARG_AGREEMENT) warnings.push("SHIPPING_PROVIDER=correo_argentino pero falta CORREO_ARG_AGREEMENT.");
  }

  warnings.forEach((message)=> logger.warn(message));
}

module.exports = { runStartupChecks };
