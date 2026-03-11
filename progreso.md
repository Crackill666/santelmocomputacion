# Progreso del proyecto - Santelmo Computacion

Fecha de corte: 2026-03-10

## 1) Estado general del proyecto

- Tipo de proyecto: sitio estatico (`HTML + CSS + JS`), sin framework ni build.
- Paginas principales:
  - `index.html` (showroom interactivo con hotspots)
  - `catalogo.html` (catalogo con filtros y modal de producto)
  - `contacto.html` (datos de contacto y accesos rapidos)
  - `novedades.html` (listado vertical de productos destacados)
  - `guias-tech.html` (articulo corto + CTA comercial)
- Estructura tecnica relevante:
  - Estilos: `assets/css/styles.css`
  - Configuracion de negocio/contacto: `assets/js/config.js`
  - Datos de productos: `assets/data/products.json`
  - Logica por pagina:
    - `assets/js/app.js` (showroom)
    - `assets/js/catalogo.js` (catalogo)
    - `assets/js/contacto.js` (contacto)
    - `assets/js/novedades.js` (novedades)
    - `assets/js/guias-tech.js` (guias tech)
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

## 7) Cambios implementados hoy (2026-03-10)

Archivos modificados/creados durante la sesion:
- `index.html`
- `catalogo.html`
- `contacto.html`
- `novedades.html` (nuevo)
- `guias-tech.html` (nuevo/reconstruido)
- `assets/js/app.js`
- `assets/js/catalogo.js`
- `assets/js/novedades.js` (nuevo)
- `assets/js/guias-tech.js` (nuevo)
- `assets/css/styles.css`

### 7.1 Ajuste de cards: quitar precio duplicado en chip-row

Se elimino el chip de precio (USD) que repetia informacion en:
- Cards de `catalogo` (`assets/js/catalogo.js`)
- Cards de showroom (`assets/js/app.js`)
- Detalle/modal de producto en showroom y catalogo (se mantiene precio abajo en `product-price`/`card-price`)

Resultado:
- Arriba quedan chips de categoria + stock.
- Abajo queda el bloque de precio (USD + ARS), evitando duplicacion visual.

### 7.2 Navegacion: nuevas secciones "Novedades" y "Guias Tech"

Se actualizo la barra de navegacion en:
- `index.html`
- `catalogo.html`
- `contacto.html`

Se separo el item anterior combinado en dos items:
- `Novedades`
- `Guias Tech`

### 7.3 Seccion Novedades implementada

Se creo `novedades.html` y `assets/js/novedades.js` para mostrar 4 productos definidos:
1. `Aspiradora Solpadora Aire Portatil Hogar Auto`
2. `Auricular Inalambrico+Traductor Idiomas M113`
3. `Auricular Inalambrico+ Traductor Idiomas YYK-Q65`
4. `Teclado Gamer Redragon k630 Dragonbron`

Comportamiento:
- Carga de datos desde `assets/data/products.json` usando `StoreData.loadProducts()`.
- Render vertical (uno debajo del otro) con imagen, descripcion, categoria y stock.
- Bloque de precio completo (USD, ARS, tipo de cambio) y boton `Comprar`.
- Boton `Comprar` abre WhatsApp con mensaje de producto + precio.

Ajustes de UI posteriores en `assets/css/styles.css`:
- Reduccion/ajuste de altura visual de imagen en novedades.
- Mayor separacion vertical entre productos.
- Igualacion de altura entre bloque de imagen y bloque de descripcion en desktop.

### 7.4 Seccion Guias Tech implementada

Se construyo `guias-tech.html` con articulo corto SEO/comercial:
- Titulo principal: `Como limpiar tu notebook sin dañarla` (centrado).
- Introduccion breve + consejos rapidos + solucion recomendada + producto recomendado + CTA.
- Se dejo una sola imagen en el articulo (se reemplazo la 3ra por la 2da, segun pedido).

Cambio de copy solicitado:
- Consejo actualizado con texto especifico sobre microfibra + alcohol isopropilico al 70%.

CTA:
- Texto del boton cambiado a `Ver`.
- Enlace configurado para abrir producto puntual en showroom/modal.

### 7.5 Deep-link a producto desde Guias Tech

Se agrego soporte en `assets/js/app.js` para abrir categoria/producto por URL:
- Parametros soportados: `category`, `product`, `q`
- Ejemplo usado:  
  `./index.html?v=20260310&category=varios&product=aspiradora-solpadora-aire-portatil-hogar-auto`

Flujo:
- Se abre categoria `Varios`.
- Se abre automaticamente el detalle del producto objetivo.

### 7.6 Mitigacion de cache adicional (produccion)

Para evitar que deploy use JS viejo:
- `index.html` carga `app.js` con version:
  - `./assets/js/app.js?v=20260310`
- Boton `Ver` en `guias-tech.html` usa URL con `?v=20260310` + parametros deep-link.

## 8) Pendientes recomendados para proxima sesion (actualizado)

- Validar en produccion que el boton `Ver` de `Guias Tech` abra directo el producto en modal (categoria `Varios`).
- Verificar que los ajustes visuales de `Novedades` queden OK en mobile (espaciado y alturas).
- Si hay textos con mojibake en algun archivo HTML/JS, hacer pasada final de normalizacion de codificacion.
- Definir si `guias-tech.html` quedara como landing unica o como indice para multiples articulos.

## 9) Punto de reanudacion sugerido (actualizado)

Al retomar, comenzar por:

1. Probar en produccion `Guias Tech > Ver` con cache limpio (`Purge Cache` + `Ctrl+F5`).
2. Revisar visual de `Novedades` en desktop/mobile y ajustar fine-tuning de alturas/espacios si hace falta.
3. Cargar el siguiente articulo en `Guias Tech` reutilizando misma estructura.
4. Mantener `progreso.md` actualizado al cerrar cada bloque de cambios.

## 10) Hotfix responsive mobile (2026-03-10)

Archivos modificados:
- `assets/css/styles.css`
- `index.html`
- `catalogo.html`
- `contacto.html`
- `novedades.html`
- `guias-tech.html`

### 10.1 Navegacion mobile (topbar)

Problema reportado:
- En telefono se cortaba el item `Contacto` en la barra superior.

Solucion aplicada:
- En `@media (max-width: 768px)` se paso `topbar-row2` a layout vertical.
- La `nav` ahora usa wrap y los links se distribuyen en varias filas (sin recorte lateral).
- `rate-pill` en mobile pasa a ocupar ancho completo y centrado.

### 10.2 Modal/categorias en showroom

Problema reportado:
- En mobile, dentro del modal de productos, al scrollear se podia desalinear/cortar contenido.

Solucion aplicada:
- Se bloqueo scroll horizontal en `body` y `.modal-body`.
- Se dejo scroll vertical explicito en `.modal-body`.
- Se agregaron defensas de quiebre de texto (`overflow-wrap`) en titulo/descripcion para evitar desbordes.
- Se sumo soporte `dvh` en altura de `.modal-sheet` para mejorar comportamiento en navegadores mobile/in-app.

### 10.3 Zonas clickeables del showroom en touch

Problema reportado:
- En Inicio no se identificaban bien las zonas tocables.

Solucion aplicada:
- En mobile se muestran de forma persistente bordes suaves en `.hotspot`.
- Las etiquetas de hotspots (`::after`) quedan visibles para guiar el toque.

### 10.4 Cache busting de CSS

Para asegurar que produccion cargue el fix nuevo:
- Se versiono el stylesheet en todas las paginas principales:
  - `./assets/css/styles.css?v=20260310-mobilefix`

### 10.5 Ajuste visual hotspots (desktop-like)

Cambio solicitado:
- No mostrar iconos/etiquetas persistentes en la imagen del showroom.
- Mantener comportamiento tipo web: nombre visible solo en hover/active.

Implementacion:
- Se removio la visibilidad forzada de hotspots en mobile (`.hotspot` + `.hotspot::after`).
- Se normalizaron titulos de hotspots sin emojis en `assets/js/app.js`.
- Se actualizo cache busting:
  - CSS: `?v=20260310-mobilefix2`
  - JS showroom (`index.html`): `app.js?v=20260310-hotspots2`
