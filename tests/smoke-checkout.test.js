const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");

process.env.NODE_ENV = "test";
process.env.MERCADO_PAGO_MODE = "mock";
process.env.MERCADO_PAGO_TEST_TOKEN_FORCE_MOCK = "true";
process.env.MERCADO_PAGO_FALLBACK_TO_MOCK = "true";
process.env.SHIPPING_PROVIDER = "mock";
process.env.SHIPPING_FALLBACK_TO_MOCK = "true";
process.env.SHIPPING_AUTO_CREATE_ON_CUSTOMER_FORM = "false";
process.env.EMAIL_ENABLED = "false";
process.env.FLOW_DIAGNOSTIC = "false";
process.env.ADMIN_TOKEN_REQUIRED = "true";
process.env.ADMIN_TOKEN = "stc-smoke-test-token";

const config = require("../server/config");
const { createApp } = require("../server/app");

const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const JSON_HEADERS = { "Content-Type": "application/json" };

let server;
let baseUrl = "";
let ordersFileExists = false;
let originalOrdersContent = "";
let labelsBefore = new Set();

async function jsonRequest(route, options = {}){
  const method = options.method || "GET";
  const headers = {
    ...(options.headers || {}),
  };
  let body = options.body;

  if(body && typeof body === "object"){
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  const response = await fetch(`${baseUrl}${route}`, {
    method,
    headers,
    body,
  });
  const text = await response.text();
  let data = null;
  if(text){
    data = JSON.parse(text);
  }
  return { response, data };
}

test.before(async ()=>{
  try{
    originalOrdersContent = await fs.readFile(config.ORDERS_FILE, "utf8");
    ordersFileExists = true;
  }catch(err){
    if(err && err.code !== "ENOENT"){
      throw err;
    }
    ordersFileExists = false;
    originalOrdersContent = "";
  }

  await fs.mkdir(config.LABELS_DIR, { recursive: true });
  labelsBefore = new Set(await fs.readdir(config.LABELS_DIR));

  const app = createApp();
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject)=>{
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

test.after(async ()=>{
  if(server){
    await new Promise((resolve)=> server.close(resolve));
  }

  if(ordersFileExists){
    await fs.writeFile(config.ORDERS_FILE, originalOrdersContent, "utf8");
  }else{
    await fs.rm(config.ORDERS_FILE, { force: true });
  }

  const labelsAfter = await fs.readdir(config.LABELS_DIR).catch(()=> []);
  const newLabels = labelsAfter.filter((fileName)=> !labelsBefore.has(fileName));
  await Promise.all(
    newLabels.map((fileName)=> fs.rm(path.join(config.LABELS_DIR, fileName), { force: true }))
  );
});

test("smoke flujo critico checkout -> shipping -> admin shipment + label", async ()=>{
  const productId = `smoke-${Date.now()}`;
  const createPreference = await jsonRequest("/api/checkout/create-preference", {
    method: "POST",
    headers: JSON_HEADERS,
    body: {
      source: "smoke_test",
      product_id: productId,
      product_name: "Producto Smoke Test",
      category: "Varios",
      price_ars: 15000,
      delivery_method: "correo_argentino",
      delivery_type: "homeDelivery",
    },
  });

  assert.equal(createPreference.response.status, 200);
  assert.equal(createPreference.data.ok, true);
  assert.equal(typeof createPreference.data.checkout_url, "string");
  assert.equal(createPreference.data.mode, "mock");

  const orderId = createPreference.data.order_id;
  const accessToken = createPreference.data.access_token;
  assert.ok(orderId);
  assert.ok(accessToken);

  const confirm = await jsonRequest("/api/checkout/confirm", {
    method: "POST",
    headers: JSON_HEADERS,
    body: {
      order_id: orderId,
      access_token: accessToken,
      payment_id: `SMOKE-PAY-${Date.now()}`,
      status: "approved",
    },
  });

  assert.equal(confirm.response.status, 200);
  assert.equal(confirm.data.ok, true);
  assert.equal(confirm.data.order.paymentStatus, "approved");

  const shipping = await jsonRequest(`/api/orders/${encodeURIComponent(orderId)}/shipping`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: {
      access_token: accessToken,
      deliveryType: "homeDelivery",
      receiverName: "Cliente Smoke",
      streetName: "San Martin",
      streetNumber: "50",
      cityName: "CABA",
      state: "Buenos Aires",
      zipCode: "1004",
      phone: "1140000000",
      cellphone: "1140000000",
      email: "smoke@example.com",
      observation: "Prueba automatizada",
    },
  });

  assert.equal(shipping.response.status, 200);
  assert.equal(shipping.data.ok, true);
  assert.equal(shipping.data.already_submitted, false);
  assert.equal(shipping.data.order.shippingStatus, "ready_to_create_shipment");

  const adminHeaders = {
    ...JSON_HEADERS,
    "x-admin-token": ADMIN_TOKEN,
  };

  const createShipment = await jsonRequest(
    `/api/admin/orders/${encodeURIComponent(orderId)}/create-shipment`,
    {
      method: "POST",
      headers: adminHeaders,
      body: { force: false },
    }
  );

  assert.equal(createShipment.response.status, 200);
  assert.equal(createShipment.data.ok, true);
  assert.equal(createShipment.data.shipment.success, true);
  assert.match(createShipment.data.shipment.trackingNumber, /^TRK-/);

  const createLabel = await jsonRequest(`/api/admin/orders/${encodeURIComponent(orderId)}/label`, {
    method: "POST",
    headers: adminHeaders,
    body: { force: false },
  });

  assert.equal(createLabel.response.status, 200);
  assert.equal(createLabel.data.ok, true);
  assert.equal(createLabel.data.label.success, true);
  assert.equal(typeof createLabel.data.label.labelPath, "string");
  assert.ok(createLabel.data.label.labelPath.length > 0);

  const downloadLabel = await fetch(
    `${baseUrl}/api/admin/orders/${encodeURIComponent(orderId)}/label`,
    { headers: { "x-admin-token": ADMIN_TOKEN } }
  );
  assert.equal(downloadLabel.status, 200);
  const fileBuffer = Buffer.from(await downloadLabel.arrayBuffer());
  assert.ok(fileBuffer.length > 0);

  const adminList = await jsonRequest(`/api/admin/orders?order_id=${encodeURIComponent(orderId)}`, {
    method: "GET",
    headers: { "x-admin-token": ADMIN_TOKEN },
  });

  assert.equal(adminList.response.status, 200);
  assert.equal(adminList.data.ok, true);
  assert.ok(adminList.data.total >= 1);
  assert.ok(
    adminList.data.orders.some((order)=> String(order.id || order.id_pedido) === String(orderId))
  );
});
