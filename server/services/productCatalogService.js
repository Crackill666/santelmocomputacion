const fs = require("fs/promises");
const path = require("path");
const config = require("../config");

const PRODUCTS_FILE = path.join(config.ROOT_DIR, "assets", "data", "products.json");

function normalize(value){
  return String(value || "").trim().toLowerCase();
}

async function loadCatalog(){
  const raw = await fs.readFile(PRODUCTS_FILE, "utf8");
  const parsed = JSON.parse(raw || "{}");
  parsed.products = Array.isArray(parsed.products) ? parsed.products : [];
  return parsed;
}

function normalizeProduct(p){
  const id = p.id || slugify(p.name || "producto");
  return {
    id,
    nombre: p.name || "Producto",
    categoria: p.category || "Producto",
    price_usd: Number(p.price_usd || 0),
    raw: p,
  };
}

function slugify(value){
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "producto";
}

async function findProduct({ id, name }){
  const catalog = await loadCatalog();
  const products = catalog.products;

  const byId = id ? products.find((p)=> normalize(p.id) === normalize(id)) : null;
  if(byId) return normalizeProduct(byId);

  const byName = name ? products.find((p)=> normalize(p.name) === normalize(name)) : null;
  if(byName) return normalizeProduct(byName);

  return null;
}

module.exports = {
  findProduct,
};
