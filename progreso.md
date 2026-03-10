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

Archivos modificados:
- `index.html`
- `catalogo.html`
- `contacto.html`
- `assets/js/catalogo.js`

### 4.1 Meta Pixel instalado en todas las paginas

Se inserto el bloque completo de Meta Pixel dentro de `<head>` en:
- `index.html`
- `catalogo.html`
- `contacto.html`

Implementacion:
- `fbq('init', '1980377969521010');`
- `fbq('track', 'PageView');`
- bloque `<noscript>` correspondiente

### 4.2 Evento Lead al click en boton WhatsApp (FAB)

Se agrego script antes de `</body>` en las 3 paginas HTML para trackear:
- `fbq('track', 'Lead')`

Selector usado:
- `[data-fab-whatsapp]`

Nota:
- No se modifico el comportamiento existente del boton (solo se agrego listener de tracking).

### 4.3 Correccion de textos con codificacion rota (mojibake)

Se corrigieron textos visibles en HTML, por ejemplo:
- `Catalogo`, `Computacion`, `Navegacion` (con tildes restauradas en los HTML)
- `Direccion`, `Telefono`, `Categoria` (con tildes restauradas en los HTML)
- simbolos especiales restaurados: guion largo, puntos suspensivos, flecha arriba y mano indicadora

### 4.4 Fix de ARS en cards del catalogo

Problema:
- En `catalogo.html` el precio en ARS aparecia en modal de detalle, pero no en las tarjetas del listado.

Solucion aplicada en `assets/js/catalogo.js`:
- Se agrego la linea ARS en `card-price` debajo del USD.
- Se usa `window.Currency.getState().rate` + `usdToArs(...)` para calcular ARS.
- Se agrego `window.Currency.subscribe(()=> render());` para refrescar cards cuando llega/actualiza cotizacion.

### 4.5 Mitigacion de cache en produccion (Cloudflare/browser)

Se agrego versionado en `catalogo.html` para forzar carga de JS nuevo:
- `./assets/js/currency.js?v=20260302`
- `./assets/js/catalogo.js?v=20260302`

Observacion de despliegue:
- Si en produccion no se refleja un cambio de JS, hacer `Purge Cache` en Cloudflare y hard refresh (`Ctrl+F5`).

## 5) Pendientes recomendados para proxima sesion

- Verificar en produccion (Events Manager + Meta Pixel Helper) que:
  - `PageView` dispare en las 3 paginas.
  - `Lead` dispare al click en `[data-fab-whatsapp]`.
- Confirmar visualmente en produccion que ARS aparece en cards de `catalogo` sin abrir modal.
- Revisar y limpiar duplicados de estilos SelectX en `assets/css/styles.css`.
- Corregir posible llave sobrante al final de `assets/css/styles.css`.
- Homogeneizar algunos `id` de productos para mantener formato slug consistente en todo el catalogo.

## 6) Punto de reanudacion sugerido

Al retomar, comenzar por:

1. Validar tracking en Meta (PageView + Lead) en entorno productivo.
2. Revalidar `catalogo` en produccion con cache limpio (que ARS aparezca en cards).
3. Continuar con auditoria y limpieza de `assets/css/styles.css`.
4. Mantener `progreso.md` actualizado en cada bloque de cambios para trazabilidad.
