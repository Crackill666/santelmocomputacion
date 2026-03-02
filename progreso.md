# Progreso del proyecto - Santelmo Computacion

Fecha de corte: 2026-03-02

## 1) Estado general del proyecto

- Tipo de proyecto: sitio estatico (`HTML + CSS + JS`), sin framework ni build.
- Paginas principales:
  - `index.html` (showroom interactivo con hotspots)
  - `catalogo.html` (catalogo con filtros y modal de producto)
  - `contacto.html` (datos de contacto y accesos rapidos)
- Estructura tecnica relevante:
  - Estilos: `assets/css/styles.css`
  - Configuracion de negocio/contacto: `assets/js/config.js`
  - Datos de productos: `assets/data/products.json`
  - Logica por pagina:
    - `assets/js/app.js` (showroom)
    - `assets/js/catalogo.js` (catalogo)
    - `assets/js/contacto.js` (contacto)
  - Utilidades compartidas:
    - `assets/js/data.js`
    - `assets/js/currency.js`
    - `assets/js/utils.js`
    - `assets/js/ui-modal.js`
    - `assets/js/selectx.js`

## 2) Inventario y datos (estado actual)

- Archivo validado: `assets/data/products.json` (`ConvertFrom-Json` OK).
- Estructura JSON: `meta`, `categories`, `products`.
- Conteo actual:
  - `categories`: 6
  - `products`: 42

## 3) Cambios ya implementados antes de hoy (sesion previa)

Archivo modificado: `assets/data/products.json`

### 3.1 Producto agregado en categoria "Varios"

- `name`: `Aspiradora Solpadora Aire Portatil Hogar Auto`
- `stock`: `1`
- `price_usd`: `63.0`
- `category`: `Varios`
- `id`: `aspiradora-solpadora-aire-portatil-hogar-auto`
- `folder`: `/assets/products/Aspiradora Solpadora Aire Portatil Hogar Auto/`
- `images`:
  - `/assets/products/Aspiradora Solpadora Aire Portatil Hogar Auto/1.jpg`
  - `/assets/products/Aspiradora Solpadora Aire Portatil Hogar Auto/2.jpg`
  - `/assets/products/Aspiradora Solpadora Aire Portatil Hogar Auto/3.jpg`
- `description` cargada desde PDF `Descripcion II`.

### 3.2 Descripciones actualizadas desde PDF "Descripcion II"

Se actualizaron estos productos:

1. `Auricular Inalambrico+Traductor Idiomas M113`
2. `Auricular Inalambrico+ Traductor Idiomas YYK-Q65`

Fuente usada:
- `C:\STC WEB\000-informacion base\Descripcion II.pdf` (texto extraido por OCR en Windows).

## 4) Cambios implementados hoy (2026-03-02)

Archivo modificado: `contacto.html`

- Se agrego una nueva fila de contacto entre Telefono y Email:
  - `Horario`: `Lunes a Viernes de 10 a 17:30 hs`

Referencia:
- bloque de contacto en `contacto.html` (linea de horario ya insertada).

## 5) Pendientes recomendados para proxima sesion

- Revisar y limpiar duplicados de estilos SelectX en `assets/css/styles.css`.
- Corregir posible llave sobrante al final de `assets/css/styles.css`.
- Homogeneizar algunos `id` de productos para mantener formato slug consistente en todo el catalogo.

## 6) Punto de reanudacion sugerido

Al retomar, comenzar por:

1. Auditoria y limpieza de `assets/css/styles.css`.
2. Revalidar visualmente `catalogo.html` y `contacto.html` despues de los ajustes.
3. Mantener `progreso.md` actualizado en cada bloque de cambios para trazabilidad.
