require("dotenv").config();

const config = require("./server/config");
const logger = require("./server/logger");
const { createApp } = require("./server/app");
const { runStartupChecks } = require("./server/startupChecks");

const app = createApp();
runStartupChecks();

app.listen(config.PORT, ()=>{
  logger.info(`Servidor listo en ${config.APP_BASE_URL}`);
  logger.info(`Modo Mercado Pago: ${config.MERCADO_PAGO_MODE}`);
  logger.info(`Shipping provider: ${config.SHIPPING_PROVIDER}`);
  logger.info(`Modo Correo Argentino: ${config.CORREO_ARGENTINO_MODE}`);
});
