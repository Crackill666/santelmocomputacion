const config = require("../../config");

const ZONES = {
  CABA: "CABA",
  GBA: "GBA",
  INTERIOR: "INTERIOR",
};

function toStr(value){
  return String(value || "").trim().toLowerCase();
}

function detectZoneFromAddress(address){
  const city = toStr(address && address.cityName);
  const state = toStr(address && address.state);

  if(city.includes("caba") || city.includes("capital federal") || city.includes("ciudad autonoma")){
    return ZONES.CABA;
  }

  if(state.includes("buenos aires")){
    return ZONES.GBA;
  }

  return ZONES.INTERIOR;
}

function costByZone(zone){
  if(zone === ZONES.CABA) return Number(config.SHIPPING_COST_CABA || 0);
  if(zone === ZONES.GBA) return Number(config.SHIPPING_COST_GBA || 0);
  return Number(config.SHIPPING_COST_INTERIOR || 0);
}

function getShippingQuote({ address } = {}){
  const zone = address ? detectZoneFromAddress(address) : (config.SHIPPING_DEFAULT_ZONE || ZONES.INTERIOR);
  const amount = costByZone(zone);
  return {
    zone,
    amount,
    currency: config.MERCADO_PAGO_CURRENCY || "ARS",
  };
}

module.exports = {
  ZONES,
  detectZoneFromAddress,
  getShippingQuote,
};
