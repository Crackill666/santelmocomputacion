const fs = require("fs/promises");
const path = require("path");
const config = require("../config");
const {
  migrateLegacyOrder,
  PAYMENT_STATUS,
  PAYMENT_PENDING_REASON,
  syncLegacyFields,
  normalizePaymentStatus,
  normalizeShippingStatus,
} = require("../models/orderModel");

const DATA_FILE = config.ORDERS_FILE;

let queue = Promise.resolve();

async function ensureFile(){
  try{
    await fs.access(DATA_FILE);
  }catch(_err){
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify({ orders: [] }, null, 2), "utf8");
  }
}

async function readDb(){
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf8");
  const content = String(raw || "").trim();

  if(!content){
    const err = new Error("orders.json esta vacio. Se bloquea lectura para evitar perdida silenciosa de datos.");
    err.code = "ORDERS_DB_EMPTY";
    throw err;
  }

  try{
    const parsed = JSON.parse(content);
    if(!Array.isArray(parsed.orders)) parsed.orders = [];
    parsed.orders = parsed.orders.map((order)=> migrateLegacyOrder(order));
    return parsed;
  }catch(err){
    const wrapped = new Error(`orders.json invalido (${DATA_FILE}). Revisar/corregir archivo antes de continuar.`);
    wrapped.code = "ORDERS_DB_INVALID_JSON";
    wrapped.cause = err;
    throw wrapped;
  }
}

async function writeDb(db){
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), "utf8");
}

async function saveOrders(db){
  await writeDb(db);
}

function runExclusive(task){
  const op = queue.then(task, task);
  queue = op.catch(()=>{});
  return op;
}

async function createOrder(order){
  return runExclusive(async ()=>{
    const db = await readDb();
    let normalized = migrateLegacyOrder(order);
    const paymentStatus = normalizePaymentStatus(
      (normalized.payment && normalized.payment.status) || normalized.estado_pago
    );

    if(paymentStatus === PAYMENT_STATUS.PENDING
      && !(normalized.payment && normalized.payment.pendingReason)){
      normalized = syncLegacyFields({
        ...normalized,
        payment: {
          ...(normalized.payment || {}),
          pendingReason: PAYMENT_PENDING_REASON.AWAITING_CONFIRMATION,
        },
      });
    }

    db.orders.push(normalized);
    await saveOrders(db);
    return normalized;
  });
}

async function getOrderById(orderId){
  const db = await readDb();
  return db.orders.find((o)=> o.id === orderId || o.id_pedido === orderId) || null;
}

async function getOrderByPaymentId(paymentId){
  if(!paymentId) return null;
  const db = await readDb();
  return db.orders.find((o)=> String((o.payment && o.payment.paymentId) || o.payment_id || "") === String(paymentId)) || null;
}

async function listOrders(filters){
  const db = await readDb();
  let list = db.orders.slice();

  if(filters && filters.order_id){
    const needle = String(filters.order_id).trim().toLowerCase();
    if(needle){
      list = list.filter((o)=> String(o.id || o.id_pedido || "").toLowerCase().includes(needle));
    }
  }

  if(filters && filters.estado_pago){
    const needle = String(filters.estado_pago || "").trim();
    const normalizedNeedle = normalizePaymentStatus(needle);
    list = list.filter((o)=>{
      const current = normalizePaymentStatus((o.payment && o.payment.status) || o.estado_pago);
      return current === normalizedNeedle || String(o.estado_pago || "") === needle;
    });
  }
  if(filters && filters.estado_envio){
    const needle = String(filters.estado_envio || "").trim();
    const normalizedNeedle = normalizeShippingStatus(needle);
    list = list.filter((o)=>{
      const current = normalizeShippingStatus((o.shipping && o.shipping.status) || o.estado_envio);
      return current === normalizedNeedle || String(o.estado_envio || "") === needle;
    });
  }

  list.sort((a, b)=> String(b.createdAt || b.fecha || "").localeCompare(String(a.createdAt || a.fecha || "")));
  return list;
}

async function updateOrderById(orderId, updater){
  return runExclusive(async ()=>{
    const db = await readDb();
    const index = db.orders.findIndex((o)=> o.id === orderId || o.id_pedido === orderId);
    if(index < 0) return null;

    const current = db.orders[index];
    const updated = updater({ ...current });
    if(!updated) return current;

    db.orders[index] = migrateLegacyOrder(updated);
    await saveOrders(db);
    return db.orders[index];
  });
}

module.exports = {
  saveOrders,
  createOrder,
  getOrderById,
  getOrderByPaymentId,
  listOrders,
  updateOrderById,
};
