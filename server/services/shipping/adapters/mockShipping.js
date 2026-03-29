const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const config = require("../../../config");

function toStr(value){
  return String(value || "").trim();
}

function sleep(ms){
  return new Promise((resolve)=> setTimeout(resolve, ms));
}

function buildTracking(orderId){
  const hash = crypto.createHash("sha1").update(String(orderId || "NO_ORDER")).digest("hex").slice(0, 10).toUpperCase();
  return `TRK-${hash}`;
}

function buildShipmentClientId(orderId){
  const hash = crypto.createHash("md5").update(String(orderId || "NO_ORDER")).digest("hex").slice(0, 10).toUpperCase();
  return `MOCK-SHP-${hash}`;
}

function toAscii(value){
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "");
}

function escapePdfText(value){
  return toAscii(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function estimateTextWidth(text, fontSize){
  const chars = toAscii(text).length;
  return chars * Number(fontSize || 12) * 0.52;
}

function buildSimplePdfBuffer(lines){
  // A6 portrait in PostScript points (105mm x 148mm).
  const pageWidth = 297.64;
  const pageHeight = 419.53;
  const defaultGap = 4;
  const mmToPt = 2.83465;
  const leftMargin = 11 * mmToPt;
  const topMargin = 11 * mmToPt;
  const entries = Array.isArray(lines)
    ? lines
      .map((entry)=>{
        if(entry && typeof entry === "object"){
          return {
            text: toStr(entry.text),
            size: Number(entry.size || 16),
            gapAfter: Number(entry.gapAfter ?? defaultGap),
          };
        }
        return {
          text: toStr(entry),
          size: 13,
          gapAfter: defaultGap,
        };
      })
      .filter((entry)=> Boolean(entry.text))
    : [];
  let currentY = pageHeight - topMargin;

  const textOps = ["BT"];
  entries.forEach((entry)=>{
    const size = Math.max(8, Math.min(40, Number(entry.size || 16)));
    const safeText = escapePdfText(entry.text);
    const x = leftMargin;

    // Use top-left anchored flow for compact shipping-label readability.
    const baselineY = currentY - size;

    textOps.push(`/F1 ${size} Tf`);
    textOps.push(`1 0 0 1 ${x.toFixed(2)} ${baselineY.toFixed(2)} Tm`);
    textOps.push(`(${safeText}) Tj`);

    currentY -= size + Math.max(0, Number(entry.gapAfter ?? defaultGap));
  });
  textOps.push("ET");

  const stream = `${textOps.join("\n")}\n`;

  const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n`;
  const obj4 = `4 0 obj\n<< /Length ${Buffer.byteLength(stream, "utf8")} >>\nstream\n${stream}endstream\nendobj\n`;
  const obj5 = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";

  const header = "%PDF-1.4\n";
  const chunks = [header, obj1, obj2, obj3, obj4, obj5];

  let offset = 0;
  const offsets = [0];
  chunks.forEach((chunk, idx)=>{
    if(idx > 0){
      offsets.push(offset);
    }
    offset += Buffer.byteLength(chunk, "utf8");
  });

  const xrefStart = offset;
  const xref = [
    "xref",
    "0 6",
    "0000000000 65535 f ",
    ...offsets.slice(1).map((num)=> `${String(num).padStart(10, "0")} 00000 n `),
    "trailer",
    "<< /Size 6 /Root 1 0 R >>",
    "startxref",
    String(xrefStart),
    "%%EOF",
    "",
  ].join("\n");

  return Buffer.from(chunks.join("") + xref, "utf8");
}

async function ensureLabelsDir(){
  await fs.mkdir(config.LABELS_DIR, { recursive: true });
}

async function validateCredentials(){
  return {
    ok: true,
    provider: "mock",
    message: "Mock shipping always available.",
  };
}

async function createShipment(order){
  await sleep(120);

  const trackingNumber = buildTracking(order.id);
  const shipmentClientId = buildShipmentClientId(order.id);

  return {
    ok: true,
    success: true,
    provider: "mock",
    trackingNumber,
    shipmentClientId,
    message: "Envio mock creado correctamente.",
    raw: {
      mode: "mock",
      tracking: trackingNumber,
      shipment_client_id: shipmentClientId,
      created_at: new Date().toISOString(),
    },
  };
}

async function getLabel(order){
  await sleep(80);
  await ensureLabelsDir();

  const tracking = toStr(order && order.shipping && order.shipping.trackingNumber) || buildTracking(order.id);
  const fileName = `${order.id}-label.pdf`;
  const filePath = path.join(config.LABELS_DIR, fileName);

    const buyerName = toStr(
    (order && order.customer && order.customer.name)
    || (order && order.shipping && order.shipping.address && order.shipping.address.receiverName)
    || (order && order.shipping && order.shipping.nombre_apellido)
    || "DESTINATARIO"
  ).toUpperCase();
  const addressLine = `${toStr(order && order.shipping && order.shipping.address && order.shipping.address.streetName)} ${toStr(order && order.shipping && order.shipping.address && order.shipping.address.streetNumber)}`.trim() || "-";
  const cityLine = toStr(order && order.shipping && order.shipping.address && order.shipping.address.cityName) || "-";
  const provinceLine = toStr(order && order.shipping && order.shipping.address && order.shipping.address.state) || "-";
  const postalCode = toStr(order && order.shipping && order.shipping.address && order.shipping.address.zipCode) || "-";

  const lines = [
    { text: buyerName, size: 11, gapAfter: 6 },
    { text: addressLine, size: 9, gapAfter: 4 },
    { text: cityLine, size: 9, gapAfter: 4 },
    { text: provinceLine, size: 9, gapAfter: 4 },
    { text: `CP: ${postalCode}`, size: 9, gapAfter: 8 },
    { text: "Santelmocomputacion", size: 7 },
  ];

  const pdfBuffer = buildSimplePdfBuffer(lines);
  await fs.writeFile(filePath, pdfBuffer);

  return {
    ok: true,
    success: true,
    provider: "mock",
    trackingNumber: tracking,
    labelPath: filePath,
    labelFileName: fileName,
    message: "Etiqueta PDF mock generada.",
    raw: {
      mode: "mock",
      path: filePath,
      generated_at: new Date().toISOString(),
    },
  };
}

async function cancelShipment(trackingNumber){
  await sleep(100);
  return {
    ok: true,
    success: true,
    provider: "mock",
    trackingNumber: toStr(trackingNumber),
    message: "Envio mock cancelado.",
    raw: {
      mode: "mock",
      cancelled_at: new Date().toISOString(),
    },
  };
}

async function getTracking(trackingNumber){
  await sleep(90);
  const tracking = toStr(trackingNumber);
  const now = Date.now();

  const events = [
    {
      code: "shipment_created",
      description: "Envio creado",
      at: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
      city: "Centro de distribucion CABA",
    },
    {
      code: "in_transit",
      description: "En transito",
      at: new Date(now - 1000 * 60 * 60 * 2).toISOString(),
      city: "Planta logistica",
    },
  ];

  return {
    ok: true,
    success: true,
    provider: "mock",
    trackingNumber: tracking,
    currentStatus: "in_transit",
    events,
    raw: {
      mode: "mock",
      tracking,
      fetched_at: new Date().toISOString(),
    },
  };
}

async function listAgencies(filters){
  const city = toStr(filters && filters.cityName).toLowerCase();
  const agencies = [
    { id: "AG-CABA-001", name: "Sucursal Centro CABA", cityName: "CABA", state: "Buenos Aires" },
    { id: "AG-GBA-001", name: "Sucursal San Justo", cityName: "San Justo", state: "Buenos Aires" },
    { id: "AG-INT-001", name: "Sucursal Cordoba Centro", cityName: "Cordoba", state: "Cordoba" },
  ];

  return {
    ok: true,
    success: true,
    provider: "mock",
    agencies: city
      ? agencies.filter((a)=> a.cityName.toLowerCase().includes(city) || a.state.toLowerCase().includes(city))
      : agencies,
  };
}

module.exports = {
  validateCredentials,
  createShipment,
  getLabel,
  cancelShipment,
  getTracking,
  listAgencies,
};

