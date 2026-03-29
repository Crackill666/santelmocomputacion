const { normalizeDeliveryType } = require("../../models/orderModel");
const { normalize, isValidEmail } = require("./utils");

function validateShippingInput(raw){
  const deliveryType = normalizeDeliveryType(raw.deliveryType || raw.delivery_type || "homeDelivery");

  const address = {
    receiverName: normalize(raw.receiverName || raw.nombre_apellido),
    streetName: normalize(raw.streetName || raw.calle),
    streetNumber: normalize(raw.streetNumber || raw.numero),
    cityName: normalize(raw.cityName || raw.localidad),
    state: normalize(raw.state || raw.provincia),
    zipCode: normalize(raw.zipCode || raw.codigo_postal),
    floor: normalize(raw.floor || raw.piso || raw.piso_departamento),
    department: normalize(raw.department || raw.departamento || raw.piso_departamento),
    observation: normalize(raw.observation || raw.observaciones),
    phone: normalize(raw.phone || raw.telefono),
    cellphone: normalize(raw.cellphone || raw.telefono),
    email: normalize(raw.email || raw.correo || ""),
  };

  const agencyId = normalize(raw.agencyId || raw.agency_id || "");
  const missing = [];

  if(!address.receiverName) missing.push("receiverName");
  if(!address.cityName) missing.push("cityName");
  if(!address.state) missing.push("state");
  if(!address.zipCode) missing.push("zipCode");

  if(deliveryType === "homeDelivery"){
    if(!address.streetName) missing.push("streetName");
    if(!address.streetNumber) missing.push("streetNumber");
  }

  if((deliveryType === "agency" || deliveryType === "locker") && !agencyId){
    missing.push("agencyId");
  }

  if(!address.phone && !address.cellphone){
    missing.push("phone");
  }

  if(!address.email){
    missing.push("email");
  }

  if(missing.length){
    const err = new Error(`Faltan campos obligatorios de envio: ${missing.join(", ")}`);
    err.status = 400;
    throw err;
  }

  if(address.receiverName.length < 3){
    const err = new Error("Nombre del destinatario invalido.");
    err.status = 400;
    throw err;
  }

  if(address.zipCode.length < 3){
    const err = new Error("Codigo postal invalido.");
    err.status = 400;
    throw err;
  }

  if(!isValidEmail(address.email)){
    const err = new Error("Email invalido.");
    err.status = 400;
    throw err;
  }

  return {
    deliveryType,
    agencyId,
    address,
  };
}

function validatePickupInput(raw){
  const name = normalize(raw.pickup_contact_name || raw.pickupContactName || raw.nombre_apellido);
  const phone = normalize(raw.pickup_contact_phone || raw.pickupContactPhone || raw.telefono);
  const email = normalize(raw.pickup_contact_email || raw.pickupContactEmail || raw.pickup_email || raw.email || raw.correo);
  const missing = [];

  if(!name) missing.push("pickup_contact_name");
  if(!phone) missing.push("pickup_contact_phone");
  if(!email) missing.push("pickup_contact_email");

  if(missing.length){
    const err = new Error(`Faltan campos obligatorios de retiro: ${missing.join(", ")}`);
    err.status = 400;
    throw err;
  }

  if(name.length < 3){
    const err = new Error("Nombre y apellido invalido para retiro.");
    err.status = 400;
    throw err;
  }

  if(phone.length < 6){
    const err = new Error("Telefono invalido para retiro.");
    err.status = 400;
    throw err;
  }

  if(!isValidEmail(email)){
    const err = new Error("Email invalido para retiro.");
    err.status = 400;
    throw err;
  }

  return { name, phone, email };
}

module.exports = {
  validateShippingInput,
  validatePickupInput,
};