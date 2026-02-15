# Showroom interactivo (sitio estático)

## Cómo probar en local (VS Code)
1. Abrí esta carpeta en VS Code.
2. Instalá la extensión **Live Server**.
3. Click derecho en `index.html` → **Open with Live Server**.

## Configuración rápida
Editá:
- `assets/js/config.js` (WhatsApp, dirección, redes, etc.)

## Imágenes de productos
Los productos están en `assets/data/products.json` y cada producto referencia:
`/assets/products/<Nombre del producto>/1.jpg` (y 2.jpg, 3.jpg).

En esta entrega se creó la estructura de carpetas y un archivo `.keep` en cada una.
Solo tenés que copiar las fotos reales en esas carpetas con esos nombres.

## Tipo de cambio (USD → ARS)
Se consulta Binance (USDT/ARS o ARS/USDT como fallback).  
Si falla, el sitio muestra USD y deja ARS como “—”.

## Deploy a Cloudflare Pages
- Subí este proyecto a un repo (GitHub).
- En Cloudflare Pages: **Create a project** → apuntá al repo.
- Framework preset: **None** (sitio estático).
- Build command: vacío.
- Output directory: `/` (raíz).

Listo.
