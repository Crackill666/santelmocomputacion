# Progreso del proyecto - Santelmo Computacion

Fecha de corte: 2026-03-12

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
- Titulo principal: `Como limpiar tu notebook sin daÃ±arla` (centrado).
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

## 11) Cierre de sesion (2026-03-11)

Archivo modificado:
- `guias-tech.html`

### 11.1 Correcciones de texto en Guias Tech

Se corrigio texto con codificacion incorrecta en:
- `<title>`: `Como limpiar tu notebook sin danarla - Santelmo Computacion`
- `<h1>` principal: `Como limpiar tu notebook sin danarla`
- Consejo de limpieza: `pano`, `humedecido`, `alcohol isopropilico`

### 11.2 Ajuste de marca solicitado

En la seccion `Producto recomendado` se cambio:
- `Santelmo Computacion` -> `Santelmocomputacion`

### 11.3 Estado para retomar manana

- El hotfix responsive + navegacion/hotspots quedo aplicado y documentado en la seccion 10.
- Queda una pasada final opcional de codificacion en `assets/js/app.js` (todavia hay textos mojibake en mensajes de vacio/error).

## 12) Sesion de implementacion checkout (2026-03-12)

### 12.1 Objetivo de la sesion

Implementar flujo de compra completo y simple:

`Producto -> Comprar -> Checkout Mercado Pago -> Pago aprobado -> Formulario corto de envio -> Generacion de envio -> Panel interno`

### 12.2 Cambios funcionales en frontend de producto

Archivos modificados:
- `assets/js/app.js`
- `assets/js/catalogo.js`
- `assets/js/novedades.js`
- `index.html`
- `catalogo.html`
- `novedades.html`

Cambios:
- Se renombro boton principal de WhatsApp de `Comprar` a `Consultar`.
- Se agrego boton nuevo `Comprar` al lado de `Consultar` en modal/showroom, catalogo y novedades.
- `Consultar` mantiene comportamiento WhatsApp.
- `Comprar` ahora inicia checkout via `assets/js/checkout.js`.

### 12.3 Backend nuevo (Node + Express) para checkout/pedidos

Archivos creados:
- `package.json`
- `server.js`
- `server/app.js`
- `server/config.js`
- `server/logger.js`
- `server/data/orders.json`
- `server/data/ordersStore.js`
- `server/models/orderModel.js`
- `server/services/productCatalogService.js`
- `server/services/mercadoPagoService.js`
- `server/services/correoArgentinoService.js`
- `server/services/orderService.js`
- `server/routes/checkoutRoutes.js`
- `server/routes/orderRoutes.js`
- `server/routes/webhookRoutes.js`
- `server/routes/adminRoutes.js`
- `server/middleware/errorHandler.js`

API implementada:
- `POST /api/checkout/create-preference`
- `POST /api/checkout/confirm`
- `POST /api/webhooks/mercadopago`
- `GET /api/orders/:orderId/summary`
- `POST /api/orders/:orderId/shipping`
- `GET /api/admin/orders`
- `GET /api/health`

Persistencia:
- Registro interno en JSON (`server/data/orders.json`) con estados de pago/envio y tracking.

### 12.4 Vistas nuevas de flujo de compra

Archivos creados:
- `checkout-success.html`
- `checkout-failure.html`
- `mock-mp-checkout.html`
- `admin-pedidos.html`
- `assets/css/checkout.css`
- `assets/js/checkout.js`
- `assets/js/checkout-success.js`
- `assets/js/mock-mp-checkout.js`
- `assets/js/admin-orders.js`

Comportamiento:
- `checkout-success.html` confirma pago y habilita formulario corto de envio.
- Guardado de envio dispara generacion de tracking mock (`CA-MOCK-*`).
- `admin-pedidos.html` lista pedidos con filtros por estado.
- En modo mock, `mock-mp-checkout.html` permite simular aprobado/rechazado.

### 12.5 Integracion Mercado Pago y ajustes de sandbox

Cambios aplicados:
- Soporte modo `real` y `mock` por `.env`.
- Con token `TEST-*` se prioriza URL `sandbox_init_point`.
- Se removio `auto_return` para evitar error `back_url.success must be defined`.
- Se agrego opcion `MERCADO_PAGO_GUEST_CHECKOUT=true`.
- Se removio exclusion invalida `account_money` (error MP 400: `account_money cannot be excluded`).

Estado actual de entorno local:
- `.env` quedo en `MERCADO_PAGO_MODE=mock` para continuidad de pruebas sin bloqueo sandbox.

### 12.6 Correo Argentino

Implementado servicio separado:
- `server/services/correoArgentinoService.js`

Estado:
- Modo `mock` funcional.
- Quedaron `TODO` para integracion real (cotizacion y generacion de envio en API oficial).

### 12.7 Utilidad operativa para no depender de terminal

Archivos creados/ajustados:
- `iniciar_tienda.bat`
- `detener_tienda.bat`
- `CLICK_AQUI_INICIAR_TIENDA.cmd`
- `CLICK_AQUI_CERRAR_TIENDA.cmd`
- `CLICK_MODO_MOCK.cmd`
- `CLICK_MODO_REAL.cmd`

Objetivo:
- Iniciar/cerrar backend y alternar MP mock/real con doble click en Windows.

### 12.8 Fix UX en formulario de envio

Archivos modificados:
- `checkout-success.html`
- `assets/js/checkout-success.js`

Mejoras:
- Validacion previa en cliente (campos obligatorios + largos minimos).
- Alertas visibles en la seccion de envio (no solo arriba de pagina).
- Estado final de boton corregido a `Envio guardado` / `Envio ya guardado`.

### 12.9 Verificacion funcional realizada

Pruebas realizadas durante la sesion:
- Creacion de preferencia (`/api/checkout/create-preference`) OK en mock y real.
- Flujo mock end-to-end:
  - simular pago aprobado
  - guardar envio
  - tracking generado
  - pedido visible en panel admin

Resultado final validado visualmente:
- En `checkout-success.html` se ve `pago_aprobado`, `envio_generado`, tracking y boton final `Envio guardado`.

## 13) Pendientes para retomar proxima sesion (2026-03-12)

- Integracion real Correo Argentino (reemplazar mock).
- Endurecer seguridad de panel interno (hoy sin autenticacion).
- Agregar busqueda por `id_pedido` en `admin-pedidos.html`.
- Revisar ultima pasada de codificacion/mojibake en textos legacy de JS viejos.
- Cuando sandbox MP este estable:
  - pasar a `CLICK_MODO_REAL.cmd`
  - validar compra real de prueba con buyer test y webhook.

## 14) Punto de reanudacion sugerido (actualizado)

Al retomar:

1. Definir modo de trabajo (`mock` o `real`) con `CLICK_MODO_MOCK.cmd` / `CLICK_MODO_REAL.cmd`.
2. Levantar backend con `CLICK_AQUI_INICIAR_TIENDA.cmd`.
3. Si se trabaja en real, validar usuarios test buyer/seller de MP antes del checkout.
4. Continuar con mejoras del panel y/o integracion real de Correo Argentino.
5. Mantener `progreso.md` actualizado al cerrar cada bloque.

## 15) Ajuste demo-real Mercado Pago (2026-03-12)

### 15.1 Objetivo

Dejar el flujo de compra estable y "como real" para demo comercial, evitando cortes cuando sandbox de Mercado Pago falle.

### 15.2 Fallback automatico real -> mock

Archivos modificados:
- `server/config.js`
- `server/services/mercadoPagoService.js`
- `server/routes/checkoutRoutes.js`
- `server/services/orderService.js`
- `.env`
- `.env.example`
- `CLICK_MODO_DEMO_REAL.cmd` (nuevo)

Cambio implementado:
- Nueva variable `MERCADO_PAGO_FALLBACK_TO_MOCK` (default `true`).
- Si `MERCADO_PAGO_MODE=real` y falla creacion de preferencia (token faltante o error de API/sandbox), el backend redirige automaticamente a checkout mock.
- Se registra `fallback_from_real` para trazabilidad en respuesta/historial.
- `confirmCheckout` ahora valida segun el modo del pedido (`order.mercado_pago.mode`), evitando errores cuando un pedido en fallback mock se confirma en entorno global real.

Resultado:
- El boton `Comprar` no queda bloqueado por errores intermitentes de MP en pruebas.

### 15.3 Checkout mock con apariencia mas real

Archivos modificados:
- `mock-mp-checkout.html`
- `assets/js/mock-mp-checkout.js`
- `assets/css/checkout.css`
- `assets/js/checkout.js`

Mejoras:
- Pantalla de checkout renovada: resumen de pedido + panel de pago con boton principal `Pagar`.
- Mensaje contextual cuando se entra por fallback desde modo real.
- Botones con estado `Procesando...` para experiencia mas fluida.
- Opcion de `Simular pago rechazado` queda disponible como accion secundaria.

### 15.4 Documentacion actualizada

Archivo modificado:
- `README.md`

Se agrego:
- explicacion de `MERCADO_PAGO_FALLBACK_TO_MOCK`
- modo recomendado "demo-real"
- nota de pasar `MERCADO_PAGO_FALLBACK_TO_MOCK=false` al cerrar produccion real.

### 15.5 Verificacion tecnica

- `node --check` OK en:
  - `server/services/mercadoPagoService.js`
  - `server/routes/checkoutRoutes.js`
  - `server/services/orderService.js`
  - `assets/js/checkout.js`
  - `assets/js/mock-mp-checkout.js`

### 15.6 Anti-loop sandbox con token TEST

Archivos modificados:
- `server/config.js`
- `server/services/mercadoPagoService.js`
- `.env`
- `.env.example`
- `CLICK_MODO_REAL.cmd`
- `CLICK_MODO_DEMO_REAL.cmd`
- `CLICK_MODO_REAL_ESTRICTO.cmd` (nuevo)
- `README.md`

Cambios:
- Nueva variable `MERCADO_PAGO_TEST_TOKEN_FORCE_MOCK` (default `true`).
- Si `MERCADO_PAGO_MODE=real` + token `TEST-*` + variable en `true`, se fuerza checkout mock directo para evitar errores `ERR_TOO_MANY_REDIRECTS` del sandbox.
- `CLICK_MODO_REAL.cmd` ahora desactiva esa variable (`false`) para quien quiera insistir con sandbox real.
- `CLICK_MODO_DEMO_REAL.cmd` la deja activa (`true`) para demo estable.
- `CLICK_MODO_REAL_ESTRICTO.cmd` deja `MERCADO_PAGO_MODE=real`, `MERCADO_PAGO_FALLBACK_TO_MOCK=false` y `MERCADO_PAGO_TEST_TOKEN_FORCE_MOCK=false` para forzar paso por MP real sin fallback.

## 16) Validacion manual del flujo (2026-03-12, cierre del dia)

### 16.1 Lo que quedo validado por pruebas reales de navegador

- El flujo completo de tienda funciona en modo estable:
  - Producto -> Comprar -> Checkout -> Pago aprobado -> Formulario de envio -> Tracking generado -> Estado `envio_generado`.
- Con tarjeta de prueba (flujo invitado/sin login completo), Mercado Pago sandbox permitio avanzar en varios intentos.
- El backend y pantallas de retorno (`checkout-success.html`) quedaron operativos.

### 16.2 Incidencia observada en sandbox Mercado Pago

- En el flujo con login/challenge de usuario test (codigo + password), sandbox presento bucle de redireccion:
  - `ERR_TOO_MANY_REDIRECTS` en `sandbox.mercadopago.com.ar`.
- Esta falla es del entorno sandbox de MP y no de la logica de la tienda.
- Se mantuvo estrategia de continuidad:
  - `demo-real` con fallback a mock para no cortar la venta de prueba.

### 16.3 Necesidad para proxima sesion (pedido del usuario)

Objetivo principal de manana:
- reducir pasos manuales y no tener que hacer tantas acciones para probar/operar.

Plan sugerido para implementar:
1. Crear un inicio unificado "1 click" que:
   - deje modo recomendado segun perfil (`demo` o `real estricto`),
   - cierre backend previo si existe,
   - levante backend,
   - abra navegador en URL correcta.
2. Agregar indicador visible en la UI (badge) con modo activo:
   - `MOCK`, `DEMO-REAL`, `REAL ESTRICTO`.
3. Evitar doble navegacion/confusion de scripts:
   - consolidar scripts `.cmd/.bat` y dejar solo los necesarios.
4. Documentar en `README.md` un flujo ultra-corto de operacion diaria (3 pasos maximo).

## 17) Sesion de continuidad (2026-03-16)

### 17.1 Objetivo retomado

Continuar exactamente el bloque pendiente del punto 16.3:
- inicio 1-click,
- badge visible de modo activo,
- simplificacion operativa/documentacion.

### 17.2 Inicio unificado 1-click implementado

Archivos creados/modificados:
- `CLICK_INICIAR_1_CLICK.cmd` (nuevo)
- `CLICK_AQUI_INICIAR_TIENDA.cmd` (actualizado para delegar al nuevo iniciador)
- `CLICK_INICIAR_REAL_ESTRICTO.cmd` (nuevo wrapper)

Comportamiento del iniciador:
- Perfil default: `demo` (`DEMO-REAL`).
- Perfil opcional: `estricto` (`REAL ESTRICTO`).
- Actualiza `.env` automaticamente segun perfil:
  - `MERCADO_PAGO_MODE`
  - `MERCADO_PAGO_FALLBACK_TO_MOCK`
  - `MERCADO_PAGO_TEST_TOKEN_FORCE_MOCK`
- Cierra backend previo en puerto `3000`.
- Instala dependencias si faltan (`node_modules`).
- Inicia backend y abre `http://localhost:3000/index.html`.

### 17.3 Badge de modo activo en UI

Archivos modificados/creados:
- `server/app.js`
- `assets/js/runtime-mode.js` (nuevo)
- `assets/css/styles.css`
- `index.html`
- `catalogo.html`
- `novedades.html`
- `guias-tech.html`
- `contacto.html`

Backend:
- `GET /api/health` ahora expone:
  - `runtime_mode`: `MOCK`, `DEMO-REAL`, `REAL ESTRICTO`
  - detalle de `mercado_pago` (mode/fallback/test_force_mock)

Frontend:
- Nueva pill visual en topbar (`Modo`) con estados de color:
  - mock
  - demo-real
  - real estricto
  - offline (si backend no responde)
- Se agrego script `runtime-mode.js` en paginas principales.
- CSS versionado actualizado a `?v=20260316-mode1` para evitar cache viejo.

### 17.4 README simplificado

Archivo modificado:
- `README.md`

Se agrego seccion operativa corta:
- flujo diario en 3 pasos,
- scripts recomendados de inicio rapido,
- aclaracion de que el iniciador hace setup + cierre + arranque automaticamente.

### 17.5 Validacion tecnica de modo operativo (2026-03-16)

Prueba ejecutada:
- Backend levantado en puertos temporales (`3101`, `3102`, `3103`) con variables de entorno inyectadas por proceso (sin tocar `.env` de trabajo).
- Consulta a `GET /api/health` en cada caso.

Resultados:
1. `MERCADO_PAGO_MODE=real`, `FALLBACK=true`, `TEST_TOKEN_FORCE_MOCK=true`
   - `runtime_mode`: `DEMO-REAL` (OK)
2. `MERCADO_PAGO_MODE=real`, `FALLBACK=false`, `TEST_TOKEN_FORCE_MOCK=false`
   - `runtime_mode`: `REAL ESTRICTO` (OK)
3. `MERCADO_PAGO_MODE=mock`
   - `runtime_mode`: `MOCK` (OK)

Conclusión:
- La lógica de badge/mode en backend quedó consistente con los perfiles operativos definidos.

## 18) Preparacion "listo para subir" (2026-03-16)

### 18.1 Objetivo

Dejar el proyecto preparado para subir/desplegar (sin desplegar), con hardening minimo y controles de configuracion previos.

### 18.2 Hardening backend aplicado

Archivos modificados/creados:
- `server/config.js`
- `server/app.js`
- `server/middleware/adminAuth.js` (nuevo)
- `server/routes/adminRoutes.js`
- `server/data/ordersStore.js`

Cambios:
- Se agregaron headers de seguridad basicos:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Strict-Transport-Security` cuando la request llega por HTTPS.
- Se desactivo `x-powered-by` en Express.
- Se agrego autenticacion para `/api/admin/*` via token:
  - header `x-admin-token`
  - variables nuevas: `ADMIN_PANEL_TOKEN`, `ADMIN_PANEL_TOKEN_REQUIRED`
- Se agrego filtro por `order_id` en listado de pedidos admin.

### 18.3 Panel admin mejorado

Archivos modificados:
- `admin-pedidos.html`
- `assets/js/admin-orders.js`
- `assets/css/checkout.css`

Cambios:
- Nuevo filtro de busqueda por `ID pedido`.
- Campo `Token admin` en UI.
- El frontend envia token en header `x-admin-token`.
- Mensajes de error mas claros para:
  - token invalido/ausente
  - panel deshabilitado por falta de token en backend.

### 18.4 Validacion de entorno pre-subida

Archivos creados/modificados:
- `server/preflight.js` (nuevo)
- `server/startupChecks.js` (nuevo)
- `server.js`
- `package.json`
- `.env.example`

Cambios:
- Script nuevo `npm run preflight` (tambien `npm run release:check`).
- Valida condiciones clave para produccion (HTTPS, tokens, secretos, etc.).
- Se agregaron warnings de arranque en backend cuando hay configuracion riesgosa.
- `.env.example` ahora incluye:
  - `ADMIN_PANEL_TOKEN`
  - `ADMIN_PANEL_TOKEN_REQUIRED`

### 18.5 Documentacion actualizada

Archivo modificado:
- `README.md`

Se agrego:
- checklist "Listo para subir",
- variables nuevas de seguridad/admin,
- uso del token admin y filtro por `id_pedido` en panel.

### 18.6 Verificacion tecnica

Validaciones ejecutadas:
- `node --check` OK en archivos backend/frontend modificados.
- `npm.cmd run preflight` OK en entorno actual:
  - `NODE_ENV=development`
  - salida: `Preflight OK: 0 errores, 0 warning(s).`

## 19) Backup operativo antes de integrar Correo Argentino (2026-03-16)

### 19.1 Incidencia reportada al simular compra

Situacion:
- Se intento simular compra desde `127.0.0.1:5500/catalogo.html` (Live Server del editor).
- Mensaje recibido: no se pudo conectar al backend.

Causa:
- El flujo `Comprar` necesita backend activo (`/api/checkout/...`).
- En `:5500` solo corre frontend estatico, por eso falla la llamada API.

### 19.2 Aclaracion operativa importante

- En local, para probar checkout completo, se debe abrir por backend:
  - `http://localhost:3000/index.html` o `http://localhost:3000/catalogo.html`
- En produccion/despliegue real no se usan scripts `.cmd`; queda servicio backend desplegado y permanente.
- Estado "listo para subir" no significa que `Comprar` funcione desde un host estatico sin backend.

### 19.3 Decision tecnica para continuar sin riesgo

Se acuerda avanzar por fases (no todo junto):
1. Base estable y lista para subir (ya completada en seccion 18).
2. Integracion real de Correo Argentino con `feature flag` y manteniendo mock como fallback.
3. Evolucion del panel sobre la base de envios ya integrados.

Motivo:
- Reduce riesgo de romper checkout actual.
- Mejora trazabilidad y rollback por etapas.

### 19.4 Punto de restauracion (backup documental)

Este archivo `progreso.md` queda actualizado como referencia de recuperacion previa a:
- cambios de integracion Correo Argentino real,
- ampliaciones del panel interno.

Estado base confirmado antes de seguir:
- Checkout funcional en entorno con backend.
- Hardening minimo aplicado.
- Preflight y documentacion de release en estado OK.

## 20) Sistema de pedidos/envios robustecido + base Correo Argentino (2026-03-16)

### 20.1 Alcance ejecutado en esta etapa

Se implemento una base solida para pedidos internos y envios, manteniendo compatibilidad con flujo actual:

- Producto -> Comprar -> Checkout MP -> Pago aprobado -> Formulario envio -> Admin pedidos/envios.
- Modo recomendado de pruebas: `MERCADO_PAGO_MODE=mock` o `DEMO-REAL` con fallback.
- Integracion de shipping desacoplada por adapters (`mock` y base `correo_argentino`).

### 20.2 Modelo y persistencia de pedidos

Archivos clave:
- `server/models/orderModel.js`
- `server/data/ordersStore.js`
- `server/data/orders.json`

Cambios:
- Modelo canónico de pedido con:
  - `payment.status`: `pending|approved|rejected|refunded`
  - `shipping.status`: `pending_shipping_data|ready_to_create_shipment|shipment_created|label_ready|dispatched|delivered|cancelled|shipping_error`
  - `customer`, `items`, `subtotal`, `shippingCost`, `total`, `currency`
  - `shipping.address`, `deliveryType`, `agencyId`, `provider`, `trackingNumber`, `labelPath`, `raw*`, `trackingEvents`
- Compatibilidad legacy mantenida (`id_pedido`, `estado_pago`, `estado_envio`, `mercado_pago`, etc.).
- Migracion de registros legacy en lectura/escritura.

### 20.3 Flujo post-pago y formulario de envio

Archivo clave:
- `server/services/orderService.js`

Cambios:
- Al aprobarse pago:
  - pedido queda listo para pedir datos de envio si faltan.
- Formulario de envio:
  - valida campos obligatorios,
  - guarda direccion en pedido,
  - recalcula costo simple de envio por zona,
  - deja estado `ready_to_create_shipment`.
- Creacion de envio separada como accion admin (default), con opcion de auto-create via flag:
  - `SHIPPING_AUTO_CREATE_ON_CUSTOMER_FORM=false` (recomendado).

### 20.4 Costo de envio simple por zona

Archivo clave:
- `server/services/shipping/shippingConfig.js`

Variables:
- `SHIPPING_COST_CABA`
- `SHIPPING_COST_GBA`
- `SHIPPING_COST_INTERIOR`
- `SHIPPING_DEFAULT_ZONE`

Regla:
- Deteccion basica por ciudad/provincia y monto fijo por zona.

### 20.5 Panel admin de pedidos (lista + detalle)

Archivos:
- `admin-pedidos.html`
- `admin-order-detail.html`
- `assets/js/admin-orders.js`
- `assets/js/admin-order-detail.js`
- `assets/css/checkout.css`
- `server/app.js`
- `server/routes/adminRoutes.js`

UI/acciones:
- Lista `/admin/orders`:
  - id, fecha, cliente, total, estado pago, estado envio, tracking, acciones rapidas.
- Detalle `/admin/orders/:id`:
  - datos cliente/items/totales/direccion/estados/debug.
  - acciones:
    - guardar envio
    - crear envio
    - obtener etiqueta
    - refrescar tracking
    - marcar despachado
    - cancelar pedido
    - ver/descargar etiqueta

### 20.6 Shipping desacoplado (adapters)

Archivos:
- `server/services/shipping/index.js`
- `server/services/shipping/adapters/mockShipping.js`
- `server/services/shipping/adapters/correoArgentinoAdapter.js`
- `server/services/correoArgentinoService.js` (wrapper legacy)

Interfaz implementada:
- `validateCredentials()`
- `createShipment(order)`
- `getLabel(order)`
- `cancelShipment(trackingNumber)`
- `getTracking(trackingNumber)`
- `listAgencies(filters)`

Comportamiento:
- `SHIPPING_PROVIDER=mock|correo_argentino`
- Si faltan credenciales reales y `SHIPPING_FALLBACK_TO_MOCK=true`, cae a mock sin romper flujo.

### 20.7 Mock shipping funcional

En modo mock:
- `createShipment` genera tracking consistente (`CA-MOCK-*`).
- `getLabel` genera etiqueta local en `server/data/labels/`.
- `getTracking` devuelve eventos fake coherentes.
- `cancelShipment` responde cancelacion consistente para pruebas.

### 20.8 Base preparada para Correo Argentino API 2.0

Variables soportadas:
- `CORREO_ARG_API_BASE_URL`
- `CORREO_ARG_API_KEY`
- `CORREO_ARG_AGREEMENT`
- `CORREO_ARG_LABEL_FORMAT`

Headers preparados:
- `Authorization: Apikey <key>`
- `agreement: <agreement>`

Estado:
- adapter base listo para enchufar endpoints definitivos al validar credenciales reales.

### 20.9 Persistencia: politica y resguardo

Decisiones acordadas:
- Se continua con `server/data/orders.json` limpio (sin restaurar pedidos de prueba).
- No borrar automaticamente `orders.json`.
- No limpiar datos persistentes sin confirmacion.
- Para pruebas futuras, usar datos mock separados.

Ajuste de seguridad aplicado:
- `server/data/ordersStore.js` ahora falla explicitamente si `orders.json` esta vacio o invalido,
  para evitar perdida silenciosa de datos por parseo corrupto.

### 20.10 Validaciones y checks ejecutados

Validado:
- `node --check` en archivos principales modificados: OK.
- `npm.cmd run preflight`: OK.
- Flujo mock E2E probado en sesion:
  - checkout
  - confirmacion pago
  - guardado envio
  - creacion envio admin
  - etiqueta
  - tracking

## 21) Etapa acotada: solo pedidos + admin (2026-03-16)

### 21.1 Objetivo aplicado

Se recorto esta etapa para enfocarla exclusivamente en:
- registro interno de pedidos,
- panel admin de pedidos (lista + detalle).

Sin avances funcionales nuevos en:
- Correo Argentino,
- creacion de envio,
- etiqueta,
- tracking.

### 21.2 Ajustes de panel admin

Archivos modificados:
- `admin-pedidos.html`
- `admin-order-detail.html`
- `assets/js/admin-orders.js`
- `assets/js/admin-order-detail.js`

Cambios:
- Lista `/admin/orders` simplificada para mostrar:
  - id pedido
  - fecha
  - cliente
  - total
  - `paymentStatus`
- Detalle `/admin/orders/:id` simplificado en modo lectura:
  - datos cliente
  - items
  - totales
  - direccion de envio (si existe)
  - `paymentStatus`
- Se quitaron de la UI admin los botones/acciones logisticas (envio/etiqueta/tracking).

### 21.3 Persistencia

Se mantiene:
- `server/data/orders.json` como fuente persistente.
- Politica activa: no limpiar ni borrar persistencia automaticamente.

### 21.4 Validacion tecnica

- `node --check` OK en archivos JS tocados.
- `npm.cmd run preflight` OK.

## 22) Etapa siguiente: creacion de envio mock desde admin (2026-03-16)

### 22.1 Objetivo aplicado

Se agrego la operativa de envio mock en panel admin sin integrar Correo Argentino real:
- crear envio desde `/admin/orders/:id`,
- generar etiqueta mock en PDF local,
- mostrar tracking, estado de envio y boton para ver etiqueta.

### 22.2 Archivos modificados

- `server/services/shipping/adapters/mockShipping.js`
- `admin-order-detail.html`
- `assets/js/admin-order-detail.js`
- `admin-pedidos.html`
- `assets/js/admin-orders.js`

### 22.3 Comportamiento nuevo

En detalle admin (`/admin/orders/:id`):
- boton `Crear envio`:
  - genera tracking mock (`TRK-*`),
  - actualiza `shippingStatus=shipment_created`,
  - guarda `trackingNumber`.
- boton `Generar etiqueta`:
  - genera PDF mock local,
  - guarda path en pedido.
- boton `Ver etiqueta`:
  - aparece cuando existe etiqueta y permite abrir/descargar.

En lista admin (`/admin/orders`):
- ahora muestra tambien:
  - `shipping status`
  - `tracking`
  - enlace `Ver etiqueta` si ya existe.

### 22.4 Etiqueta mock

- Formato: PDF simple (sin servicios externos).
- Ubicacion: `server/data/labels/`.
- Contenido minimo:
  - pedido
  - cliente
  - direccion
  - tracking

### 22.5 Validacion tecnica

- `node --check` OK en archivos tocados.
- `npm.cmd run preflight` OK.
- Prueba directa de `mockShipping.getLabel()` OK (PDF generado correctamente).

## 23) Etapa tracking mock manual (2026-03-16)

### 23.1 Objetivo aplicado

Se agrego tracking mock con historial y avance manual desde admin, sin tocar checkout/pago ni integrar Correo Argentino real.

### 23.2 Cambios backend

Archivos:
- `server/models/orderModel.js`
- `server/services/orderService.js`
- `server/routes/adminRoutes.js`

Implementado:
- Estructura de tracking en pedido:
  - `shipping.currentTrackingStatus`
  - `shipping.trackingEvents` con:
    - `status`
    - `label`
    - `date`
    - `detail`
- Al crear envio mock:
  - se agrega evento inicial `shipment_created`.
- Nuevo endpoint admin:
  - `POST /api/admin/orders/:orderId/mock-tracking`
  - permite avanzar manualmente a:
    - `in_transit`
    - `out_for_delivery`
    - `delivered`
- El avance:
  - conserva `trackingNumber`,
  - agrega evento al historial,
  - actualiza `shippingStatus` interno segun etapa.

### 23.3 Cambios frontend admin

Archivos:
- `admin-order-detail.html`
- `assets/js/admin-order-detail.js`
- `admin-pedidos.html`
- `assets/js/admin-orders.js`

Detalle admin (`/admin/orders/:id`):
- Nueva seccion `Tracking mock` con:
  - estado actual,
  - historial de eventos,
  - botones:
    - `Pasar a transito`
    - `Pasar a reparto`
    - `Marcar entregado`

Lista admin (`/admin/orders`):
- Nueva columna `Tracking mock` con estado actual.

### 23.4 Validacion tecnica

- `node --check` OK en archivos modificados.
- `npm.cmd run preflight` OK.

## 24) Metodo de entrega en checkout (2026-03-16)

### 24.1 Objetivo aplicado

Se agrego seleccion de metodo de entrega antes del pago, con impacto en `shippingCost` y `total` antes de crear preferencia/checkout:
- `retail_pickup` (retiro en tienda)
- `correo_argentino`

Sin integrar Correo Argentino real y sin romper flujo mock/admin ya validado.

### 24.2 Reglas implementadas

- `retail_pickup`:
  - `shippingCost = 0`
  - `total = subtotal`
  - no obliga formulario logistico en `checkout-success`
- `correo_argentino`:
  - `shippingCost = 3500`
  - `total = subtotal + shippingCost`

### 24.3 Cambios de frontend checkout

Archivos:
- `assets/js/checkout.js`
- `mock-mp-checkout.html`
- `assets/js/mock-mp-checkout.js`
- `checkout-success.html`
- `assets/js/checkout-success.js`
- `index.html`
- `catalogo.html`
- `novedades.html`

Implementado:
- Modal previo al pago en `checkout.js` para elegir metodo de entrega.
- En ese modal se muestran:
  - subtotal
  - shipping
  - total final
- El payload a backend ahora envia `delivery_method`.
- En checkout mock se muestran metodo/subtotal/shipping/total.
- En `checkout-success`, si es retiro en tienda, se oculta formulario de direccion.

### 24.4 Cambios de backend/persistencia

Archivos:
- `server/models/orderModel.js`
- `server/services/orderService.js`

Implementado:
- Campo persistido `deliveryMethod` (legacy: `metodo_entrega`).
- `createCheckout` calcula `shippingCost/total` por metodo antes del pago.
- `saveShipping` y `saveShippingAdmin` mantienen costo fijo segun metodo (no recotiza por zona en esta etapa).
- Para retiro en tienda, `saveShipping` permite continuar sin exigir direccion.
- `toClientOrder` expone `deliveryMethod`.

### 24.5 Cambios de admin

Archivos:
- `admin-pedidos.html`
- `assets/js/admin-orders.js`
- `admin-order-detail.html`
- `assets/js/admin-order-detail.js`

Implementado:
- Lista admin muestra:
  - `deliveryMethod`
  - `shippingCost`
- Detalle admin muestra:
  - metodo de entrega
  - shipping cost
- Si es retiro en tienda, se deshabilitan acciones logisticas (crear envio/label/tracking).

### 24.6 Validacion tecnica

- `node --check` OK en archivos modificados.
- `npm.cmd run preflight` OK.

## 25) Auditoria tecnica del flujo de compra (2026-03-16)

### 25.1 Objetivo de la auditoria

Se realizo una auditoria tecnica completa del flujo actual para confirmar:
- que pasa realmente desde boton `Comprar` hasta pedido/admin,
- que partes estan en `mock`,
- que partes estan en `real`,
- y que riesgos hay antes de seguir con Correo Argentino real.

### 25.2 Flujo real detectado (resumen operativo)

1. Frontend (showroom/catalogo/novedades) dispara `window.Checkout.start(...)`.
2. `assets/js/checkout.js` muestra selector de metodo de entrega y total final.
3. Se llama `POST /api/checkout/create-preference`.
4. Backend crea pedido en `orders.json` (estado de pago `pending`) antes del pago.
5. Backend devuelve checkout URL:
   - `mock-mp-checkout.html` en modo mock/fallback
   - URL de Mercado Pago en modo real valido
6. En success se llama `POST /api/checkout/confirm`.
7. Si pago aprobado:
   - para `correo_argentino`: formulario de envio y `POST /api/orders/:orderId/shipping`
   - para `retail_pickup`: no se exige formulario logistico
8. Admin:
   - lista: `/admin/orders`
   - detalle: `/admin/orders/:id`
   - acciones mock: crear envio, tracking, etiqueta.

### 25.3 Hallazgos importantes de arquitectura

- El pedido se crea antes del pago (correcto para trazabilidad).
- El formulario de envio se procesa despues del pago (correcto).
- `checkout-failure.html` no confirma pago en backend (riesgo de pedido en pending/rechazado sin cierre claro).
- `pending` de Mercado Pago apunta a `checkout-success.html` (flujo simplificado).
- En `DEMO-REAL` con token `TEST-*` se puede ver UX "real" pero terminar en mock por fallback.
- En produccion, `APP_BASE_URL` y webhook publicos HTTPS son obligatorios para comportamiento real estable.

### 25.4 Archivos auditados (core)

- Frontend compra:
  - `assets/js/app.js`
  - `assets/js/catalogo.js`
  - `assets/js/novedades.js`
  - `assets/js/checkout.js`
  - `assets/js/mock-mp-checkout.js`
  - `assets/js/checkout-success.js`
  - `index.html`, `catalogo.html`, `novedades.html`
  - `mock-mp-checkout.html`, `checkout-success.html`, `checkout-failure.html`
- Backend flujo:
  - `server/app.js`
  - `server/services/orderService.js`
  - `server/services/mercadoPagoService.js`
  - `server/routes/orderRoutes.js`
  - `server/routes/webhookRoutes.js`
  - `server/routes/adminRoutes.js`
  - `server/data/ordersStore.js`
  - `server/models/orderModel.js`

## 26) Incidente detectado y recuperacion aplicada (2026-03-16)

### 26.1 Incidente

Durante auditoria se detecto que faltaba `server/routes/checkoutRoutes.js`.
Eso rompia el arranque del backend por `MODULE_NOT_FOUND` en `server/app.js`.

### 26.2 Recuperacion aplicada

Por un bloqueo de escritura puntual con el nombre exacto `checkoutRoutes.js` (acceso denegado), se restauro la ruta en archivo alternativo:

- creado: `server/routes/checkoutRoutes2.js`
- modificado: `server/app.js` para importar `./routes/checkoutRoutes2`

La ruta restaurada mantiene:
- `POST /api/checkout/create-preference`
- `POST /api/checkout/confirm`

### 26.3 Verificaciones de recuperacion

- `node --check` OK en:
  - `server/routes/checkoutRoutes2.js`
  - `server/app.js`
  - `server/services/orderService.js`
- boot app OK (`createApp()` + `listen`).
- endpoint checkout OK en runtime (`POST /api/checkout/create-preference` responde 200).
- `npm.cmd run preflight` OK.

## 27) Modo diagnostico agregado (2026-03-16)

### 27.1 Configuracion

Se agrego flag de entorno:
- `FLOW_DIAGNOSTIC=false` (default)

Archivos:
- modificado: `server/config.js`
- modificado: `.env.example`

### 27.2 Logs diagnosticos agregados

Con `FLOW_DIAGNOSTIC=true` se loguea:
- request/response de `checkout/create-preference`
- request/response de `checkout/confirm`
- creacion de pedido (`order/created`)
- guardado de envio (`order/shipping_saved`)

Archivos:
- `server/routes/checkoutRoutes2.js`
- `server/services/orderService.js`

### 27.3 Alcance del cambio

- No se cambio la logica funcional del flujo.
- Solo observabilidad/debug.
- Compatible con flujo ya validado (mock + admin + envio/tracking/etiqueta mock).

## 28) Enfoque local simplificado (2026-03-16)

### 28.1 Objetivo

Se priorizo un flujo 100% local, repetible y facil de probar:
- sin produccion,
- sin Cloudflare,
- sin Mercado Pago real.

### 28.2 Iniciador unico recomendado

Se creo iniciador local mock:
- `CLICK_INICIAR_LOCAL_MOCK.cmd`

Y se dejo como entrada principal:
- `CLICK_AQUI_INICIAR_TIENDA.cmd` -> ahora llama a `CLICK_INICIAR_LOCAL_MOCK.cmd`

Comportamiento:
- fuerza `.env` a modo mock (`MERCADO_PAGO_MODE=mock`)
- cierra backend previo en puerto 3000
- instala dependencias si faltan
- inicia backend
- abre automaticamente:
  - `http://localhost:3000/catalogo.html`
- imprime mensaje claro de URL correcta y URL no recomendada.

### 28.3 Aviso de URL incorrecta local

Archivo:
- `assets/js/runtime-mode.js`

Se agrego alerta cuando detecta apertura local en puerto distinto de `3000` (ej `127.0.0.1:5500`), indicando:
- URL correcta para prueba completa:
  - `http://localhost:3000/catalogo.html`

### 28.4 Validacion tecnica

- `node --check assets/js/runtime-mode.js` OK
- `npm.cmd run preflight` OK

## 29) Cierre de etapa local validada (2026-03-16)

### 29.1 Estado real validado

Quedo validado en local (`localhost:3000`) el camino completo mock para `correo_argentino`:
- abrir catalogo local
- elegir producto y comprar
- elegir metodo de entrega (`correo_argentino`)
- ver impacto de shipping en total antes del pago
- entrar a `mock-mp-checkout.html`
- simular pago aprobado
- guardar datos de envio
- ver pedido en admin (`/admin/orders`)
- abrir detalle (`/admin/orders/:id`)
- crear envio mock
- generar etiqueta mock PDF
- actualizar tracking mock (ej: `out_for_delivery`)

### 29.2 Arranque local definitivo de esta etapa

Archivo recomendado unico:
- `CLICK_AQUI_INICIAR_TIENDA.cmd`

Ese archivo delega en:
- `CLICK_INICIAR_LOCAL_MOCK.cmd`

URL operativa correcta:
- `http://localhost:3000/catalogo.html`

URL no recomendada para pruebas de compra:
- `http://127.0.0.1:5500/catalogo.html`

### 29.3 Ajuste final del iniciador local

Se detecto un popup de Windows al intentar abrir URL automaticamente en algunos entornos.
Se ajusto el iniciador para:
- levantar backend en la misma ventana (`node server.js`)
- mantener mensaje claro de URL correcta
- intentar apertura automatica via PowerShell (fallback manual indicado en consola)

### 29.4 Pendientes abiertos (sin cambios grandes)

- `checkoutRoutes.js` sigue reemplazado por workaround `checkoutRoutes2.js` (por bloqueo de nombre en entorno local).
- `checkout-failure.html` aun no confirma estado en backend.
- `pending` de MP aun redirige a `checkout-success.html` (flujo simplificado).

### 29.5 Checklist pendiente para segundo camino (retiro en tienda)

Objetivo de proxima validacion manual:
- validar camino completo con `retail_pickup` sin flujo logistico.

## 30) Mejora de flujo retiro en tienda (2026-03-16)

### 30.1 Objetivo aplicado

Se mejoro exclusivamente el flujo `retail_pickup` sin tocar arquitectura grande ni Correo Argentino real:
- mensaje especifico de retiro post pago,
- numero de pedido destacado,
- datos fijos de showroom,
- mini formulario obligatorio de retiro (nombre + telefono),
- reflejo coherente en admin detalle (sin direccion vacia de envio para pickup),
- estado tracking coherente para pickup (`no_aplica_retiro_en_tienda`) y ocultacion de acciones logisticas no aplicables.

### 30.2 Archivos modificados

- `checkout-success.html`
- `assets/js/checkout-success.js`
- `assets/css/checkout.css`
- `assets/js/config.js`
- `server/models/orderModel.js`
- `server/services/orderService.js`
- `admin-order-detail.html`
- `assets/js/admin-order-detail.js`

### 30.3 Datos showroom configurables

Se centralizaron en `assets/js/config.js`:
- `pickupShowroom.address`
- `pickupShowroom.locality`
- `pickupShowroom.hours`
- `pickupShowroom.whatsappNumber`

Y se reutilizan:
- `phone`
- `email`
- `whatsappDefaultText`

## 31) Bugfix pickup: persistencia y visualizacion admin (2026-03-16)

### 31.1 Sintoma reportado

- En `/admin/orders` el comprador quedaba en `-` para pedidos pickup.
- En `/admin/orders/:id` aparecia `Contacto retiro: - / -`.
- En varios pedidos pickup nuevos, el formulario mostraba confirmacion pero en `orders.json` no quedaban `pickupContactName/pickupContactPhone`.

### 31.2 Causa raiz detectada

1. Flujo pickup dependia de endpoint generico (`/shipping`) en lugar de endpoint dedicado.
2. Faltaba ruta explicita `POST /api/orders/:id/pickup-contact`.
3. Habia pedidos pickup historicos con `shippingSubmittedAt` pero sin datos pickup persistidos (generados por logica previa).
4. `admin-pedidos.html` tenia version de assets vieja, provocando cache de JS anterior en navegador.

### 31.3 Correccion aplicada

Se implemento endpoint dedicado de pickup y se conecto frontend:
- `POST /api/orders/:orderId/pickup-contact`
- `assets/js/checkout-success.js` ahora usa ese endpoint para confirmar retiro.

Se agrego servicio dedicado en backend:
- `savePickupContact(...)` en `server/services/orderService.js`.

`savePickupContact` ahora persiste en el pedido:
- `deliveryMethod = retail_pickup`
- `pickupContact.name / pickupContact.phone`
- `pickupContactName / pickupContactPhone` (via sync legacy)
- `pickup_contact_name / pickup_contact_phone` (legacy)
- `customer.name / customer.phone` (fallback visual/admin)
- `shipping.nombre_apellido / shipping.telefono` (compat)
- `shippingSubmittedAt`
- historial `pickup_contact_saved`

Compatibilidad mantenida:
- si llega un pickup por `POST /api/orders/:id/shipping`, se redirige internamente a `savePickupContact`.

### 31.4 Persistencia explicita

Se agrego `saveOrders()` en `server/data/ordersStore.js` y se usa en:
- `createOrder`
- `updateOrderById`

Con esto queda explicito el guardado de `orders.json` despues de actualizar pedido.

### 31.5 Ajustes admin y cache bust

Archivos:
- `assets/js/admin-orders.js`
- `assets/js/admin-order-detail.js`
- `admin-pedidos.html`
- `admin-order-detail.html`
- `checkout-success.html`

Cambios:
- fallback robusto en columna comprador para pickup.
- fallback robusto en detalle pickup (`Contacto retiro`, `Nombre retiro`, `Telefono retiro`).
- bump de version de assets (`pickup2`/`pickup3`) para evitar cache vieja del navegador.

### 31.6 Alias solicitado de ruta

Se agrego alias:
- `server/routes/orders.js` (re-export de `orderRoutes.js`)

Para mantener compatibilidad con referencia pedida en revision tecnica.

### 31.7 Validacion tecnica realizada

- `node --check` OK en:
  - `assets/js/checkout-success.js`
  - `assets/js/admin-orders.js`
  - `assets/js/admin-order-detail.js`
  - `server/routes/orderRoutes.js`
  - `server/services/orderService.js`
  - `server/data/ordersStore.js`
- carga de modulos OK (`require(...)`).

### 31.8 Nota sobre pedidos historicos pickup

Se confirmo que algunos pedidos pickup previos quedaron sin datos de contacto (antes del fix), por ejemplo:
- `PED-20260316-87BDCA`
- `PED-20260316-9825DD`
- `PED-20260316-5B301A`

Esos registros no pueden reconstruir nombre/telefono automaticamente.
A partir de este fix, pedidos pickup nuevos quedan persistidos con contacto.

## 32) Punto de reanudacion sugerido (2026-03-16)

Al retomar:
1. Iniciar local con `CLICK_AQUI_INICIAR_TIENDA.cmd`.
2. Probar un pedido nuevo `retail_pickup` completo.
3. Verificar en `server/data/orders.json`:
   - `deliveryMethod: retail_pickup`
   - `pickupContactName`
   - `pickupContactPhone`
4. Verificar en admin:
   - `/admin/orders` columna comprador con nombre pickup.
   - `/admin/orders/:id` contacto retiro visible.
5. Si se quiere limpiar historicos incompletos, hacerlo manualmente (sin borrado automatico de persistencia).

## 33) Cierre de etapa - FASE 1 local completa (2026-03-16)

### 33.1 FASE 1 COMPLETA

Estado de cierre confirmado:
- flujo completo local funcionando;
- Correo Argentino mock validado;
- retiro en tienda validado;
- contacto de retiro persistido;
- admin muestra datos correctos;
- tracking mock funcionando;
- etiquetas mock funcionando.

### 33.2 Estado operativo de referencia

- Inicio recomendado: `CLICK_AQUI_INICIAR_TIENDA.cmd`
- URL de trabajo: `http://localhost:3000/catalogo.html`
- Modo de trabajo de esta etapa: local + mock (sin depender de servicios externos para validar punta a punta)
- Persistencia activa: `server/data/orders.json` (sin limpieza automatica)

### 33.3 Pulidos menores pendientes (sin cambios grandes)

1. Resolver el workaround de rutas y volver de `checkoutRoutes2.js` a `checkoutRoutes.js` cuando el bloqueo de nombre del entorno lo permita.
2. Cerrar estado en backend desde `checkout-failure.html` para evitar pedidos que queden ambiguos.
3. Separar el flujo `pending` de pago en una pantalla/estado dedicado (hoy redirige a success por simplificacion).
4. Hacer limpieza manual de pedidos historicos pickup incompletos solo si negocio lo decide (sin borrado masivo automatico).
5. Dar una pasada final de textos legacy con posible mojibake en JS/HTML viejos.

### 33.4 Siguiente gran paso unico recomendado

FASE 2 recomendada: **estabilizar pagos "real test" en un entorno de staging** (Mercado Pago con webhook HTTPS real), manteniendo por ahora shipping en mock.

Motivo:
- reduce riesgo en la parte mas critica (cobro y estados de pago) antes de abrir integracion logistica real;
- permite validar reconciliacion de estados (`approved`, `pending`, `rejected`) con trazabilidad completa;
- deja a Correo Argentino real como paso siguiente, ya sobre una base de pagos mas confiable.

## 34) Cierre de jornada - email post-compra + bugfix pickup email (2026-03-16)

### 34.1 Objetivo de esta tanda

Se cerro la mejora de experiencia post-compra manteniendo el flujo actual local/mock:
- campo `email` obligatorio en post-pago;
- persistencia de email en pedido;
- email de confirmacion (sin romper compra si falla SMTP);
- mensajes de UI mas claros para pickup y envio;
- visualizacion de email en admin.

### 34.2 Archivos trabajados en esta tanda

- `checkout-success.html`
- `assets/js/checkout-success.js`
- `server/services/orderService.js`
- `server/models/orderModel.js`
- `assets/js/admin-order-detail.js`
- `server/services/emailService.js`

### 34.3 Bug puntual detectado en produccion local (pickup)

Sintoma reportado:
- en `retail_pickup` guardaba nombre y telefono, pero no email;
- admin mostraba `Email: -` / `Email retiro: -`.

Hallazgo:
- el codigo fuente ya tenia parte del fix, pero el proceso activo en `:3000` seguia corriendo una version vieja en memoria;
- ademas habia cache de assets en navegador.

Evidencia:
- pedidos pickup como `PED-20260316-320F17` quedaron con `pickupContactEmail: null` y `customer.email: ""`.

### 34.4 Correccion aplicada

1. Front pickup reforzado:
- envio de `pickup_contact_email` y tambien `pickupContactEmail` en payload;
- validacion post-respuesta: si el backend no devuelve email persistido, no se marca confirmacion silenciosa.

2. Backend pickup reforzado:
- `validatePickupInput(...)` acepta alias adicionales de email;
- `savePickupContact(...)` persiste explicitamente:
  - `pickupContact.email`
  - `pickupContactEmail`
  - `pickup_contact_email`
  - `customer.email`
  - `shipping.address.email`

3. Cache bust:
- bump de version en `checkout-success.html` a `checkout-20260316-email2`.

### 34.5 Validacion final (OK)

Resultado confirmado por prueba final de usuario:
- en `checkout-success` (pickup) el email queda cargado tras confirmar;
- en admin detalle se ve `Email retiro` correcto;
- el pedido de evidencia `PED-20260316-283C27` quedo visualmente correcto en pantalla de cliente y admin.

### 34.6 Nota operativa para retomar manana

Si reaparece sintoma de campos pickup en `-`:
1. cerrar backend (`CLICK_AQUI_CERRAR_TIENDA.cmd`);
2. iniciar de nuevo (`CLICK_AQUI_INICIAR_TIENDA.cmd`);
3. recargar navegador con `Ctrl+F5` en `checkout-success`.

### 34.7 Estado de cierre

- FASE 1 local: cerrada y estable.
- Bug pickup email: resuelto y validado.
- Flujo `correo_argentino`: mantenido sin cambios de comportamiento.

## 35) Actualizacion de continuidad (2026-03-21)

### 35.1 Limpieza de rutas checkout

Estado actual consolidado:
- `server/app.js` usa solo `./routes/checkoutRoutes`.
- `server/routes/checkoutRoutes2.js` ya no existe en el proyecto.
- `server/routes` contiene: `checkoutRoutes.js`, `orderRoutes.js`, `adminRoutes.js`, `webhookRoutes.js`, `orders.js`.

Objetivo cumplido en esta etapa:
- unificacion operativa en una sola ruta de checkout sin duplicacion activa.

### 35.2 Cierre de estado desde checkout-failure

Archivo trabajado:
- `checkout-failure.html`

Comportamiento actual implementado:
- lee query params de retorno (`order_id`, `access_token`, `payment_id`, `collection_id`, `status`, `collection_status`);
- calcula estado final para confirmar cierre:
  - prioriza `status`;
  - fallback a `collection_status`;
  - fallback final `cancelled`;
- hace `POST /api/checkout/confirm` con `order_id`, `access_token`, `payment_id||collection_id`, `status`;
- evita sobrescribir visualmente como error cuando el pedido ya estaba aprobado:
  - chequeo principal: `order.paymentStatus === "approved"`;
  - fallback legacy: `order.estado_pago === "pago_aprobado"`;
- alertas visuales:
  - `cancelled`: error
  - `rejected`: error
  - `pending`: error (sin clase warning en CSS)
  - `success` solo cuando ya estaba aprobado y no se sobrescribe.

Alcance:
- sin nuevas rutas;
- sin cambios en `checkout-success.html`;
- compatible con webhook/idempotencia de `POST /api/checkout/confirm`.

### 35.3 Auditoria y saneamiento minimo de "pending"

Se hizo diagnostico completo del uso de `pending` y se definio estrategia minima sin refactor grande:
- separar semantica de estado de pago vs fallback ambiguo;
- agregar observabilidad para diferenciar por que un pedido queda en pending;
- mantener compatibilidad con ordenes legacy.

### 35.4 Observabilidad agregada: payment.pendingReason

Archivos actualizados:
- `server/models/orderModel.js`
- `server/services/orderService.js`

Implementado:
- nuevo campo opcional: `payment.pendingReason`;
- espejo legacy: `payment_pending_reason`;
- valores permitidos:
  - `awaiting_confirmation`
  - `mp_pending`
  - `fallback_missing_status`
  - `fallback_unknown_status`

Reglas de asignacion:
- creacion inicial de pedido: `awaiting_confirmation`;
- confirm/webhook con estado MP `pending` explicito: `mp_pending`;
- confirm/webhook sin status explicito: `fallback_missing_status`;
- confirm/webhook con status desconocido que mapea a pending: `fallback_unknown_status`.

Compatibilidad:
- ordenes viejas sin el campo siguen siendo validas;
- si `payment.status` deja de ser `pending`, el `pendingReason` se limpia.

### 35.5 Bug puntual resuelto: pendingReason no persistia en algunos pedidos nuevos

Sintoma detectado:
- en ciertos pedidos abandonados antes de pagar quedaba:
  - `payment.status = "pending"`
  - `payment_pending_reason = null`

Causa:
- en persistencia inicial faltaba una garantia explicita en `createOrder` del store para completar `pendingReason` cuando llegaba pending sin ese dato.

Fix minimo aplicado:
- archivo: `server/data/ordersStore.js`
- en `createOrder(...)`:
  - tras `migrateLegacyOrder(order)`, si pago esta `pending` y no hay `payment.pendingReason`, se fuerza:
    - `payment.pendingReason = "awaiting_confirmation"`
  - se sincroniza legacy con `syncLegacyFields(...)` para persistir tambien:
    - `payment_pending_reason = "awaiting_confirmation"`

Alcance del fix:
- no toca frontend;
- no toca `mercadoPagoService`;
- no cambia flujo visible del checkout.

### 35.6 Verificaciones de esta etapa

Chequeos realizados:
- `node --check` OK en archivos backend tocados.
- creacion de pedido de prueba validada con ambos campos:
  - `payment.pendingReason = "awaiting_confirmation"`
  - `payment_pending_reason = "awaiting_confirmation"`

### 35.7 Punto de reanudacion recomendado

Al retomar:
1. Probar 1 compra abandonada (sin pagar) y validar en `server/data/orders.json` que quede `awaiting_confirmation`.
2. Probar 1 failure/cancel en `checkout-failure.html` y validar cierre en backend via `/api/checkout/confirm`.
3. Mantener esta base y avanzar luego con ajustes de semantica de `pending` (sin refactor grande) solo si hace falta.

## 36) Continuidad operativa - pendientes preparados (2026-03-21)

### 36.1 Objetivo de esta tanda

Se dejo preparado un set de cambios minimos para distinguir mejor abandono en checkout mock, manteniendo compatibilidad legacy y sin refactor.

Importante:
- en esta tanda se prepararon diffs exactos;
- no se aplicaron cambios de codigo todavia (quedaron pendientes de confirmacion final).

### 36.2 Estado revisado para retomar

- `PROJECT_STATUS.md` sigue marcando FASE 1 local completa (mock).
- `.env` operativo actual en local:
  - `APP_BASE_URL=http://localhost:3000`
  - `MERCADO_PAGO_MODE=mock`
  - `CORREO_ARGENTINO_MODE=mock`
- `server/data/orders.json` (foto de esta revision):
  - total pedidos: 50
  - pagos: `approved=43`, `pending=6`, `rejected=1`

### 36.3 Diff pendiente 1 - nuevo pending reason en modelo

Archivo objetivo:
- `server/models/orderModel.js`

Cambio preparado (minimo):
1. agregar en `PAYMENT_PENDING_REASON`:
   - `CHECKOUT_ABANDONED: "checkout_abandoned"`
2. extender `normalizePaymentPendingReason(value)` para reconocer ese valor y devolver `PAYMENT_PENDING_REASON.CHECKOUT_ABANDONED`.

Alcance:
- sin tocar otras reglas de normalizacion;
- sin cambiar nombres existentes.

### 36.4 Diff pendiente 2 - override opcional en applyPaymentToOrder

Archivo objetivo:
- `server/services/orderService.js`

Cambio preparado (minimo):
1. firma de `applyPaymentToOrder(...)` con parametro opcional:
   - `pendingReasonOverride`
2. en construccion de `paymentPendingReason`, cuando estado mapeado es `pending`:
   - usar `pendingReasonOverride || resolvePaymentPendingReason(payment...)`
3. para estados no `pending`, mantener limpieza actual (sin reason).

Alcance:
- comportamiento intacto cuando no se pasa override;
- sin refactor de la funcion.

### 36.5 Diff pendiente 3 - soporte de estado abandoned en confirmCheckout (solo mock)

Archivo objetivo:
- `server/services/orderService.js` (solo bloque `confirmCheckout()`)

Cambio preparado (minimo):
- incorporar tercer hint en mock:
  - `approved` -> `status=approved`, `status_detail=accredited`
  - `abandoned` -> `status=pending`, `status_detail=checkout_abandoned`
  - resto -> `status=rejected`, `status_detail=cc_rejected_bad_filled_card_number`
- al llamar `applyPaymentToOrder(...)`, pasar:
  - `pendingReasonOverride: PAYMENT_PENDING_REASON.CHECKOUT_ABANDONED`
  - solo cuando `hint === "abandoned"`.

Alcance:
- no tocar rama real (`useRealValidation`);
- approved/rejected se mantienen como estaban.

### 36.6 Diff pendiente 4 - abandono automatico desde checkout mock (frontend)

Archivo objetivo:
- `assets/js/mock-mp-checkout.js`

Cambio preparado (minimo):
1. variable de scope principal:
   - `let isCompletingCheckout = false;`
2. en click de aprobar/rechazar:
   - setear `isCompletingCheckout = true` antes de deshabilitar y redirigir.
3. helper nuevo `notifyAbandoned(orderId, accessToken)`:
   - `POST /api/checkout/confirm`
   - `status: "abandoned"`
   - primero `navigator.sendBeacon` con `Blob` `application/json`
   - fallback `fetch(..., keepalive:true)`.
4. listener `pagehide` dentro de `DOMContentLoaded`:
   - si `!isCompletingCheckout`, notifica abandono.

Alcance:
- no cambia logica de approve/reject;
- sin refactor.

### 36.7 Punto de reanudacion inmediato

Para seguir en la proxima sesion:
1. aplicar los 4 diffs ya preparados (en el mismo orden 36.3 -> 36.6).
2. correr prueba rapida local en mock:
   - aprobar, rechazar y abandonar (cerrar pestana/volver atras).
3. verificar en `server/data/orders.json`:
   - `status=pending` + `payment_pending_reason=checkout_abandoned` cuando haya abandono.
4. validar que `approved` y `rejected` sigan sin cambios funcionales.

## 37) Aplicado y consolidado (2026-03-21)

### 37.1 Objetivo de esta tanda

Se aplicaron efectivamente los cambios que en la seccion 36 estaban solo como "pendientes preparados", para cerrar el flujo de abandono real en checkout mock y persistir correctamente `checkout_abandoned`.

### 37.2 Archivos modificados

- `server/models/orderModel.js`
- `server/services/orderService.js`
- `assets/js/mock-mp-checkout.js`
- `mock-mp-checkout.html`

### 37.3 Backend: nuevo pending reason `checkout_abandoned`

Archivo:
- `server/models/orderModel.js`

Cambios aplicados:
1. Se agrego en `PAYMENT_PENDING_REASON`:
   - `CHECKOUT_ABANDONED: "checkout_abandoned"`
2. Se extendio `normalizePaymentPendingReason(value)` para reconocer:
   - `checkout_abandoned`

Resultado:
- el modelo ya acepta y normaliza el nuevo motivo de pending sin romper compatibilidad con los motivos previos.

### 37.4 Backend: `confirmCheckout` mock ahora soporta `abandoned`

Archivo:
- `server/services/orderService.js` (funcion `confirmCheckout`)

Cambios aplicados en rama mock:
- `approved`:
  - `status = "approved"`
  - `status_detail = "accredited"`
- `abandoned`:
  - `status = "pending"`
  - `status_detail = "checkout_abandoned"`
  - envia `pendingReasonOverride: PAYMENT_PENDING_REASON.CHECKOUT_ABANDONED`
- otros estados no approved:
  - `status = "rejected"`
  - `status_detail = "cc_rejected_bad_filled_card_number"`

Resultado:
- el abandono ya no cae incorrectamente en rechazo.

### 37.5 Backend: `applyPaymentToOrder` respeta override

Archivo:
- `server/services/orderService.js` (funcion `applyPaymentToOrder`)

Cambios aplicados:
1. Firma actualizada para aceptar parametro opcional:
   - `pendingReasonOverride`
2. Calculo de `paymentPendingReason`:
   - si viene `pendingReasonOverride`, se usa ese valor
   - si no viene, mantiene `resolvePaymentPendingReason(...)`

Resultado:
- el motivo `checkout_abandoned` ahora persiste correctamente y deja de mapearse como `mp_pending` por error.

### 37.6 Frontend: notificacion de abandono real al backend

Archivo:
- `assets/js/mock-mp-checkout.js`

Cambios aplicados:
1. Se agrego estado de control:
   - `let isCompletingCheckout = false;`
2. Se creo helper `notifyAbandoned(orderId, accessToken)`:
   - `POST /api/checkout/confirm`
   - body con `status: "abandoned"`
   - intento principal con `navigator.sendBeacon` (Blob JSON)
   - fallback con `fetch(..., keepalive: true)`
3. Se agrego listener `pagehide`:
   - cuando no se esta completando pago, notifica abandono
4. En botones `approve/reject`:
   - marca `isCompletingCheckout = true` antes de redireccionar

Resultado:
- cuando el usuario cierra, vuelve atras o abandona la pagina de checkout mock, el backend recibe cierre de estado como abandono.

### 37.7 Frontend: anti-duplicado de notificacion en `pagehide`

Archivo:
- `assets/js/mock-mp-checkout.js`

Mejora adicional aplicada:
- nuevo flag:
  - `let abandonmentNotified = false;`
- `notifyAbandoned(...)` corta si ya notifico y marca `abandonmentNotified = true` al iniciar
- guard en `pagehide` actualizado a:
  - `if(isCompletingCheckout || abandonmentNotified) return;`

Resultado:
- evita doble confirmacion cuando `pagehide` dispara mas de una vez.

### 37.8 Carga de script en checkout mock

Archivo:
- `mock-mp-checkout.html`

Cambio aplicado:
- se agrego antes de `</body>`:
  - `<script src="/assets/js/mock-mp-checkout.js"></script>`

Nota:
- se mantuvo tambien el include versionado existente, por lo que actualmente quedaron ambos scripts cargados en la pagina.

### 37.9 Verificaciones realizadas

Chequeos ejecutados:
- `node --check server/models/orderModel.js` OK
- `node --check server/services/orderService.js` OK
- `node --check assets/js/mock-mp-checkout.js` OK

### 37.10 Punto de reanudacion recomendado

Al retomar:
1. Ejecutar prueba manual en `mock-mp-checkout.html` para 3 caminos:
   - aprobar
   - rechazar
   - abandonar (cerrar pestana o volver atras)
2. Validar en `server/data/orders.json` para caso abandono:
   - `payment.status = "pending"`
   - `payment.statusDetail = "checkout_abandoned"`
   - `payment.pendingReason = "checkout_abandoned"`
   - `payment_pending_reason = "checkout_abandoned"`
3. Confirmar que approved/rejected no cambiaron comportamiento funcional.
4. Revisar si se deja doble include de script en `mock-mp-checkout.html` o se unifica a uno solo en la proxima tanda.

## 38) Actualizacion de continuidad (2026-03-22)

### 38.1 Objetivo de esta tanda

Dejar documentado el estado real actual para continuar la siguiente etapa sin ruido:
- panel admin de pedidos alineado con la trazabilidad nueva de `pending`;
- `PROJECT_STATUS.md` sincronizado con `progreso.md` y con el codigo vigente.

### 38.2 Sincronizacion documental aplicada

Archivo trabajado:
- `PROJECT_STATUS.md`

Cambio aplicado:
- se reemplazo el estado viejo (corte 2026-03-16) por una version sincronizada al 2026-03-22;
- se dejo explicitado que el archivo estaba desactualizado;
- se consolido en un unico documento:
  - estado del flujo local actual;
  - evolucion por fases de `pending`;
  - cierre de abandono `checkout_abandoned`;
  - estado actual de panel admin y trazabilidad.

Resultado:
- `PROJECT_STATUS.md` ahora refleja el estado real del sistema y queda consistente con esta bitacora.

### 38.3 Panel admin: mejora visual de Payment status

Archivo trabajado:
- `assets/js/admin-orders.js`

Cambio aplicado (minimo, sin tocar backend):
- se actualizo solo la funcion `toDisplayPayment(order)`;
- lectura de `status` compatible nuevo/legacy:
  - `order.payment?.status`
  - `order.paymentStatus`
  - `order.estado_pago`
- lectura de `pendingReason` compatible nuevo/legacy:
  - `order.payment?.pendingReason`
  - `order.payment_pending_reason`
- cuando `status === "pending"` y existe `pendingReason`, se muestra:
  - `pending (checkout_abandoned)`
  - `pending (mp_pending)`
  - `pending (awaiting_confirmation)`
- la salida paso de texto plano a badge HTML con clase por estado.

Resultado:
- el panel admin ya diferencia visualmente pending ambiguo vs pending con motivo especifico.

### 38.4 CSS de badges en tabla admin

Archivo trabajado:
- `assets/css/checkout.css`

Clases agregadas:
- `.payment-badge`
- `.payment-badge--approved`
- `.payment-badge--rejected`
- `.payment-badge--pending`
- `.payment-badge--neutral`

Criterio visual implementado:
- `approved` verde
- `rejected` rojo
- `pending` ambar

Alcance:
- solo presentacion en frontend;
- sin cambios de logica de negocio ni de persistencia.

### 38.5 Nota de consistencia sobre checkout mock

Chequeo manual de estructura HTML actual:
- `mock-mp-checkout.html` hoy carga un unico script al final:
  - `/assets/js/mock-mp-checkout.js`

Resultado:
- la nota previa de doble include quedo desactualizada frente al estado vigente del archivo.

### 38.6 Archivos modificados en esta tanda

- `assets/js/admin-orders.js`
- `assets/css/checkout.css`
- `PROJECT_STATUS.md`

### 38.7 Verificacion realizada en esta tanda

- validacion por inspeccion de codigo/archivos de:
  - lectura de estados y pending reason en admin;
  - clases CSS disponibles para render visual;
  - sincronizacion documental.
- no se ejecuto prueba end-to-end de navegador en esta misma tanda.

### 38.8 Punto de reanudacion sugerido (siguiente etapa)

1. Smoke test rapido en `admin-pedidos.html` con pedidos:
   - approved
   - rejected
   - pending (`checkout_abandoned`, `mp_pending`, `awaiting_confirmation`)
2. Confirmar visual de badges y texto esperado en columna `Payment status`.
3. Si todo OK, avanzar a etapa de pagos `real test` (Mercado Pago + webhook HTTPS en staging), manteniendo shipping mock.

## 39) Continuidad real sandbox + cierre de arranque (2026-03-22)

### 39.1 Objetivo de esta tanda

Dejar operativo el flujo de prueba real sandbox de Mercado Pago en local, minimizando cambios y sin romper el flujo mock existente.

### 39.2 Launchers: real test separado + fix de arranque

Archivos trabajados:
- `CLICK_INICIAR_LOCAL_REAL_TEST.cmd`
- `CLICK_INICIAR_1_CLICK.cmd`

Cambios aplicados:
1. Se agrego launcher dedicado de real test:
   - `CLICK_INICIAR_LOCAL_REAL_TEST.cmd`
   - contenido: `call "%~dp0CLICK_INICIAR_1_CLICK.cmd" estricto`
2. Se corrigio el arranque de backend en el launcher base (problema de quoting):
   - de `start ... cmd /k "cd /d ... ^& node server.js"`
   - a `start "Santelmo Backend" /D "%~dp0" cmd /k "node server.js"`

Resultado:
- se mantiene intacto el launcher mock actual;
- el launcher real usa perfil estricto sin fallback ni force-mock;
- el backend arranca sin depender del patrón de quoting conflictivo.

### 39.3 Backend: confirmacion manual post-return sin webhook local

Archivos trabajados:
- `server/services/orderService.js`
- `server/routes/checkoutRoutes.js`

Cambios aplicados:
1. Nuevo helper en service:
   - `confirmCheckoutFromReturn({ externalReference, paymentId, status })`
   - reutiliza `confirmCheckout(...)` con el `accessToken` del pedido persistido.
2. Nuevo endpoint:
   - `GET /api/checkout/confirm-return`
3. El endpoint soporta:
   - `payment_id` o `collection_id`
   - `status` o `collection_status`
4. Tras confirmar, ahora redirige (no JSON):
   - `approved` -> `/checkout-success.html?order_id=...&access_token=...`
   - `pending` -> `/checkout-success.html?order_id=...&access_token=...`
   - resto -> `/checkout-failure.html?order_id=...&access_token=...`
5. Se agrego fallback robusto para `accessToken` en redirect:
   - `result.order.access_token`
   - `result.order.accessToken`
   - `result.access_token`
   - `result.accessToken`
   - `result.raw?.access_token`
   - `result.order?.raw?.access_token`
   - fallback final `""`.

Resultado:
- en localhost, el pago real puede cerrarse por return_url aun sin webhook publico.

### 39.4 Preferencia real Mercado Pago: ajuste de back_urls

Archivo trabajado:
- `server/services/mercadoPagoService.js`

Cambios aplicados en payload REAL:
- `back_urls.success`:
  - `\`${config.APP_BASE_URL}/api/checkout/confirm-return\``
- `back_urls.failure`:
  - `buildBackUrl("/api/checkout/confirm-return", order)`
- `back_urls.pending`:
  - `buildBackUrl("/api/checkout/confirm-return", order)`

Notas de esta tanda:
- se probo `auto_return: "approved"` y luego se removio para evitar loops de redireccion.
- flujo mock no se toca (rama `buildMockPreference(...)` intacta).

### 39.5 Debug temporal activo en MP real

Archivo:
- `server/services/mercadoPagoService.js`

Se dejaron logs temporales antes de `mpRequest("/checkout/preferences", ...)`:
- `APP_BASE_URL`
- `payload.auto_return`
- `payload.back_urls`
- `payload.back_urls.success`
- payload completo serializado

Estado:
- logs activos para diagnostico; remover en limpieza cuando se cierre la validacion.

### 39.6 Frontend checkout-success: tolerancia a access_token vacio

Archivo:
- `assets/js/checkout-success.js`

Cambios aplicados:
1. Validacion inicial:
   - antes: cortaba por `!orderId || !accessToken`
   - ahora: corta solo por `!orderId`
2. Confirm backend:
   - `access_token: accessToken || null`

Resultado:
- no bloquea la pantalla si falta `access_token` en query;
- mantiene resto del flujo igual.

### 39.7 Evidencia funcional observada en datos

En `server/data/orders.json` ya hay casos en modo `real` con:
- preferencia real creada (`mercadoPago.mode = "real"`);
- pagos aprobados persistidos (`payment.status = "approved"`);
- historial con `payment_updated`.

### 39.8 Punto de reanudacion sugerido

1. Ejecutar compra real sandbox con launcher real test y validar retorno completo:
   - MP -> `/api/checkout/confirm-return` -> `checkout-success.html` con `order_id` y `access_token`.
2. Confirmar en `orders.json` que el pedido quede `approved` sin depender del webhook.
3. Si queda estable, quitar logs `[MP DEBUG]` de `mercadoPagoService.js`.

## 40) Continuidad operativa - Correo Argentino base + checkout minimo (2026-03-23)

### 40.1 Objetivo de esta tanda

Dejar preparado el sistema para la siguiente etapa de Correo Argentino sin romper Mercado Pago ni rehacer checkout:
- backend con base API 2.0 (auth + agencies + create order);
- entorno local listo por `.env`;
- selector minimo de metodo de entrega con 3 opciones.

### 40.2 Backend: `POST /api/checkout/confirm` con `access_token` opcional

Archivos trabajados:
- `server/routes/checkoutRoutes.js`
- `server/services/orderService.js`

Cambios aplicados:
1. En ruta `POST /api/checkout/confirm` se valida solo `order_id`.
2. `access_token` pasa a opcional en la ruta.
3. En service `confirmCheckout(...)`:
   - si llega `accessToken`, mantiene control de acceso actual;
   - si no llega, valida existencia del pedido para permitir continuidad de return/success.

Resultado:
- se elimina el bloqueo por mensaje `order_id y access_token son obligatorios`.

### 40.3 Backend Correo Argentino API 2.0: base operativa minima

Archivos trabajados:
- `server/config.js`
- `server/services/correoArgentinoService.js`
- `server/routes/shippingCorreoRoutes.js` (nuevo)
- `server/app.js`
- `.env.example`

Cambios aplicados:
1. Variables nuevas soportadas:
   - `CORREO_ARG_ENABLED`
   - `CORREO_ARG_BASE_URL`
   - `CORREO_ARG_API_KEY`
   - `CORREO_ARG_AGREEMENT`
2. Compatibilidad legacy mantenida:
   - `CORREO_ARGENTINO_*`
   - alias `CORREO_ARG_API_BASE_URL`
3. Servicio nuevo/actualizado con funciones minimas:
   - `validateCredentials()` -> `GET /v1/auth`
   - `getAgencies(...)` -> `GET /v1/agencies`
   - `createOrder(payload)` -> `POST /v1/orders`
4. Rutas nuevas expuestas:
   - `GET /api/shipping/correo/auth-check`
   - `GET /api/shipping/correo/agencies`
   - `POST /api/shipping/correo/order`
5. Si `CORREO_ARG_ENABLED=false`, responde controladamente (`503`, `CORREO_ARG_DISABLED`).

Resultado:
- base tecnica lista para conectar credenciales reales mas adelante, sin tocar flujo MP.

### 40.4 Frontend de prueba minima para Correo

Archivos creados:
- `correo-test.html`
- `assets/js/correo-test.js`

Alcance:
- prueba manual de `auth-check` y `agencies`;
- sin rediseño y sin tocar checkout principal.

### 40.5 Checkout: selector minimo de metodo de entrega (3 opciones)

Archivos trabajados:
- `assets/js/checkout.js`
- `server/services/orderService.js`
- `checkout-success.html`
- `assets/js/checkout-success.js`

Cambios aplicados:
1. Modal de checkout ahora ofrece:
   - `Retiro en local`
   - `Envio a domicilio`
   - `Sucursal Correo Argentino`
2. Payload de checkout incluye:
   - `delivery_method`
   - `delivery_type` (`homeDelivery` o `agency`)
3. Persistencia de seleccion en orden:
   - `deliveryMethod`
   - `shipping.deliveryType`
4. En `checkout-success`:
   - `retail_pickup`: flujo actual de retiro (sin cambios funcionales);
   - `homeDelivery`: formulario de domicilio actual;
   - `agency`: bloque placeholder de sucursal (sin llamada real a API).

Mensaje placeholder aplicado:
- `Seleccion de sucursal disponible cuando se conecten las credenciales reales de Correo Argentino.`

### 40.6 Ajuste de `.env` local para pruebas

Archivo trabajado:
- `.env`

Cambios aplicados:
- `CORREO_ARG_ENABLED=true`
- `CORREO_ARG_BASE_URL=`
- `CORREO_ARG_API_KEY=`
- `CORREO_ARG_AGREEMENT=`
- `CORREO_ARG_API_BASE_URL=` (compatibilidad)

Resultado:
- entorno local preparado sin credenciales reales cargadas.

### 40.7 Verificaciones realizadas

- `node --check` OK en:
  - `assets/js/checkout.js`
  - `assets/js/checkout-success.js`
  - `server/services/orderService.js`
  - `server/services/correoArgentinoService.js`
  - `server/routes/shippingCorreoRoutes.js`
  - `server/app.js`
- smoke test local de rutas nuevas con `CORREO_ARG_ENABLED=false`:
  - respuesta controlada `503` + `CORREO_ARG_DISABLED`.

### 40.8 Punto de reanudacion sugerido

1. Cargar credenciales reales en `.env` para Correo cuando corresponda.
2. Conectar seleccion real de sucursal (`agencyId`) al bloque placeholder de `checkout-success`.
3. Mantener envio domicilio y retiro en local sin cambios mientras se valida agencies real.

## 41) Continuidad frontend y conversion (2026-03-23, tarde)

### 41.1 Modal producto y cards: ajuste de microcopy/UI sin tocar logica

Archivos trabajados:
- `assets/js/app.js`
- `assets/js/catalogo.js`
- `assets/js/novedades.js`
- `assets/css/styles.css`

Cambios consolidados:
1. Se agrego bloque de confianza bajo acciones en modal:
   - `Compra segura`
   - `Retiro o envio disponible`
   - `Soporte por WhatsApp`
2. Se refino visual del bloque (`.product-trust`) con separador superior, espaciado y check sutil por `::before`.
3. Se eliminaron chips de categoria en modal para reducir ruido; se mantiene chip de stock.
4. CTA de consulta en modal quedo compacto:
   - `Consultar por WhatsApp` -> `Consultar este producto` -> `Consultar ahora`.
5. `Comprar ahora` se mantiene sin cambios.

### 41.2 Stock copy unificado para claridad comercial

Archivos trabajados:
- `assets/js/app.js`
- `assets/js/catalogo.js`
- `assets/js/novedades.js`

Cambio de textos (sin cambiar reglas de stock):
- `Stock bajo` -> `Ultimas unidades`
- `Stock medio` y `stock alto` -> `Disponible ahora`

Notas:
- Se removio la variante intermedia `Stock disponible`.
- No se tocaron condiciones ni eventos.

### 41.3 Jerarquia visual de chips (categoria/stock)

Archivo trabajado:
- `assets/css/styles.css`

Cambios:
1. Variante de layout en detalle:
   - `.chip-row.chip-row-stack` en columna.
2. Categoria mas liviana (secundaria).
3. Stock mas visible y limpio.
4. Ajuste de densidad de chip (`padding` y `font-size`) para lectura rapida.
5. Se dejo clase `.chip-stock.warning` preparada para futura activacion por estado sin tocar logica actual.

### 41.4 Contacto: microcopy de confianza (sin cambiar logica)

Archivos trabajados:
- `contacto.html`
- `assets/css/styles.css`

Estado final de textos:
- Titulo principal: `Contacto`
- Boton principal: `Escribinos por WhatsApp`
- Textos de apoyo activos:
  - `Respondemos rapido ✓`
  - `Podes consultarnos sin compromiso`
- Texto contextual adicional:
  - `Oficina en CABA (con cita previa)`

### 41.5 WhatsApp frontend: estandar operativo confirmado

Archivos revisados/ajustados:
- `assets/js/utils.js`
- `assets/js/app.js`
- `assets/js/catalogo.js`
- `assets/js/contacto.js`
- `assets/js/guias-tech.js`
- `assets/js/novedades.js`
- `assets/js/OLD_catalogo.js`

Resultado:
1. Builder central ya opera con `https://wa.me/<numero>?text=<mensaje_codificado>`.
2. Numero saneado a solo digitos.
3. Mensaje codificado con `encodeURIComponent`.
4. Apertura de ventana unificada con `noopener,noreferrer`.
5. Verificacion realizada: sin referencias activas a `api.whatsapp.com/send` en frontend.

### 41.6 Catalogo: correccion puntual de typo en producto Cables

Archivo trabajado:
- `assets/data/products.json`

Cambio aplicado:
- `Cable Belkin USD to MicroUSB` -> `Cable Belkin USB to MicroUSB`

Compatibilidad preservada:
- no se tocaron precios;
- no se tocaron rutas/folder/id para no romper assets existentes;
- `orders.json` historico conserva nombres previos de pedidos ya emitidos.

### 41.7 Punto de reanudacion sugerido

1. Validar visual final en mobile (cards + modal + contacto) con cache limpio.
2. Si se quiere diferenciar color de `Ultimas unidades`, mapear clase de estado en render (sin cambiar regla de negocio).
3. Continuar con integracion real de sucursales Correo Argentino (`agencyId`) sobre el placeholder actual.

## 42) Consolidado checkout, admin y UX (2026-03-27, noche)

### 42.1 Checkout y metodos de entrega

Archivos trabajados:
- `assets/js/checkout.js`
- `server/services/orderService.js`
- `assets/js/checkout-success.js`
- `checkout-success.html`

Cambios consolidados:
1. Modal de checkout simplificado visualmente a 2 opciones cliente:
   - `Retiro en local`
   - `Envio a domicilio`
2. Shipping domicilio actualizado y unificado en frontend a `ARS 10.500` (base).
3. Regla de shipping por categoria en backend:
   - `Mochilas` => `18.000`
   - resto => `10.500`
   - retiro => `0`
4. Totales recalculados manteniendo flujo existente (sin rehacer checkout).
5. Textos cliente unificados en pantallas visibles:
   - `retail_pickup` => `Retiro en local`
   - `correo_argentino/homeDelivery` => `Envio a domicilio`

### 42.2 Mercado Pago: retorno y consistencia de montos

Archivos trabajados:
- `server/services/mercadoPagoService.js`
- `server/routes/checkoutRoutes.js`
- `server/services/orderService.js`

Cambios consolidados:
1. Preferencia MP con:
   - `auto_return: "approved"`
   - `back_urls.success/failure/pending` consistentes
2. `confirm-return` usa `external_reference` como fuente de verdad.
3. El flujo no depende de params custom para encontrar pedido.
4. Monto enviado a MP alineado con pedido guardado.
5. Preferencia MP ahora separa items:
   - item producto (`unit_price = subtotal`)
   - item envio (`unit_price = shippingCost`, solo si corresponde)
6. Se agregaron logs de diagnostico de payload MP (`items` y payload completo) para auditoria rapida.

### 42.3 Checkout success: guardado y UX del formulario

Archivos trabajados:
- `checkout-success.html`
- `assets/js/checkout-success.js`

Cambios consolidados:
1. Submit del formulario de envio estabilizado para evitar GET nativo accidental.
2. Guardado preserva contexto de pedido (`order_id`) y flujo post-pago.
3. Microcopy UX actualizado:
   - titulo: `Ultimo paso: datos de envio`
   - subtitulo: `Completa estos datos para despachar tu compra. Te va a llevar menos de un minuto.`
4. Subtitulos discretos agregados dentro del formulario:
   - `Contacto`
   - `Direccion`
   - `Observaciones`

### 42.4 Panel admin: ruta discreta + gate frontend + proteccion backend

Archivos trabajados:
- `server/app.js`
- `assets/js/admin-orders.js`
- `assets/js/admin-order-detail.js`
- `admin-pedidos.html`
- `admin-order-detail.html`
- `server/middleware/adminAuth.js`
- `server/config.js`
- `server/preflight.js`
- `server/startupChecks.js`
- `.env`
- `CLICK_VER_ADMIN_PEDIDOS.cmd`

Cambios consolidados:
1. Ruta publica admin cambiada:
   - lista: `/stc-admin-orders-9x7q`
   - detalle: `/stc-admin-orders-9x7q/:orderId`
2. Gate visual en frontend admin:
   - sin token: solo vista de acceso
   - token invalido: no carga datos
   - token valido: desbloquea panel/listado/detalle
3. Proteccion real backend aplicada a todo `/api/admin` via middleware.
4. Token backend estandar:
   - `ADMIN_TOKEN`
   - valor local cargado: `stc-admin-7392x`
5. Validacion confirmada:
   - sin token => `401`
   - token incorrecto => `401`
   - token correcto => `200`

### 42.5 Modal producto y conversion (microcopy)

Archivos trabajados:
- `assets/js/app.js`
- `assets/js/catalogo.js`
- `assets/js/novedades.js`

Cambios consolidados:
1. CTA consulta:
   - `Consultar por WhatsApp`
2. CTA compra del modal:
   - quedo en `Comprar ahora`
3. Bloque de confianza actualizado a:
   - `Compra 100% segura con Mercado Pago`
   - `Envio a todo el pais o retiro en local`
   - `Asesoramiento rapido por WhatsApp`
4. Mensaje WhatsApp modal reescrito (sin emojis ni caracteres raros), con formato claro y profesional.
5. URL WhatsApp mantiene `encodeURIComponent(message)`.
6. Etiqueta de stock unificada:
   - se elimina `Ultimas unidades`
   - queda `Disponible ahora` en renders frontend.

### 42.6 Estado para retomar

1. Checkpoint guardado en archivos locales (sin commit automatico desde esta terminal).
2. Punto de reanudacion recomendado:
   - pruebas manuales E2E: modal -> checkout -> MP -> success -> admin
   - revisar que texto final de WhatsApp se vea igual en Android/iOS/desktop.

## 43) Continuidad tecnica y hardening (2026-03-28, tarde)

### 43.1 Etiqueta PDF: A6 real + ajuste de layout operativo

Archivo trabajado:
- `server/services/shipping/adapters/mockShipping.js`

Cambios consolidados:
1. Se fijo tamano de pagina A6 real (portrait) para etiqueta PDF.
2. Se simplifico contenido de etiqueta (solo destinatario y direccion util para pegado).
3. Se removieron del contenido: pedido, tracking, fecha y textos mock.
4. Se ajusto version final visual a formato operativo:
   - contenido pequeno,
   - arriba a la izquierda,
   - margen aprox 11mm,
   - interlineado corto,
   - footer pequeno `Santelmocomputacion`.
5. Se mantuvo intacta la logica de descarga/endpoint de etiqueta.

### 43.2 Mercado Pago: limpieza de logs sensibles y debug controlado

Archivo trabajado:
- `server/services/mercadoPagoService.js`

Cambios consolidados:
1. Se eliminaron logs crudos con payload/respuesta completa.
2. Se incorporo diagnostico controlado solo cuando:
   - `FLOW_DIAGNOSTIC=true`
3. El diagnostico ahora es resumido/sanitizado:
   - ids enmascarados,
   - email enmascarado,
   - URLs sanitizadas sin query sensible,
   - sin tokens ni bodies completos en logs.
4. Se preservo la logica de negocio de preferencia/fallback/mock.

### 43.3 Email: desactivacion segura de ruta legacy SMTP

Archivos trabajados:
- `server/services/emailService.js`
- `server/services/orderService.js`

Cambios consolidados:
1. Se dejo explicitamente desactivada la ruta legacy SMTP en:
   - `sendOrderConfirmationEmail(...)`
2. Se agrego guard de retorno inmediato en ruta legacy (sin borrar codigo).
3. Se removio en respuestas del flujo cliente la reason legacy:
   - `legacy_confirmation_email_disabled`
4. Se mantiene operativo el flujo actual por Resend:
   - email cliente aprobado,
   - email admin.

### 43.4 Admin auth: estandar header + compatibilidad legacy

Archivo trabajado:
- `server/middleware/adminAuth.js`

Cambios consolidados:
1. Prioridad de token:
   - `x-admin-token` (header) primero.
2. Fallback temporal conservado para compatibilidad:
   - `query.token` / `body.token`
   - y compat legacy `admin_token`.
3. Validacion contra `process.env.ADMIN_TOKEN` (con fallback config local).
4. Si entra por query/body se emite warning:
   - `Admin auth using legacy token method (query/body). Should migrate to header.`
5. Estructura de respuesta de errores preservada.

### 43.5 Git hygiene: blindaje de datos sensibles en repo

Archivo trabajado:
- `.gitignore`

Cambios consolidados:
1. Reglas agregadas para evitar exposicion de datos operativos:
   - `server/data/orders.json`
   - `server/data/*.json`
   - `logs/`
   - `*.log`
   - `labels/`
   - `*.pdf`
2. Se mantuvieron reglas existentes.
3. Diagnostico posterior de indice git: no habia archivos sensibles ya trackeados en el estado actual.

### 43.6 Propuesta smoke tests (diagnostico, sin implementacion)

Estado:
1. Se analizo estrategia minima y segura.
2. Recomendacion Fase 1:
   - `node:test` + `fetch` nativo (sin dependencias nuevas),
   - cubrir flujo critico:
     - create checkout,
     - confirm approved,
     - save shipping/pickup,
     - create shipment + label admin.
3. Sin cambios de codigo aplicados en esta linea (solo propuesta).

### 43.7 Refactor orderService Fase 1 (bajo riesgo)

Archivos nuevos:
- `server/services/orders/utils.js`
- `server/services/orders/shippingValidation.js`
- `server/services/orders/trackingHelpers.js`

Archivo actualizado:
- `server/services/orderService.js`

Cambios consolidados:
1. Se extrajeron helpers puros/casi puros a modulos nuevos.
2. `orderService.js` se mantuvo como fachada publica unica.
3. `module.exports` final de `orderService.js` se preservo sin cambios de API publica.
4. No se cambiaron endpoints, mensajes funcionales ni flujo de negocio.

Funciones movidas:
- `utils.js`:
  - `normalize`, `toNumber`, `round2`, `safeLower`, `isValidEmail`, `isMercadoPagoSandboxEmail`, `resolveDeliveryMethod`, `normalizeCategory`, `isMochilasCategory`, `shippingCostByDeliveryMethod`
- `shippingValidation.js`:
  - `validateShippingInput`, `validatePickupInput`
- `trackingHelpers.js`:
  - `mapTrackingStatusToShippingStatus`, `normalizeTrackingEvents`, `getCurrentTrackingStatus`, `mapMockTrackingToShippingStatus`, `buildMockTrackingEvent`

### 43.8 Validaciones realizadas en esta tanda

1. Verificaciones de sintaxis con `node --check` en archivos nuevos/modificados.
2. Carga de `orderService` verificada por require sin error.
3. Sin cambios de endpoints ni contratos de respuesta expuestos.

### 43.9 Punto de reanudacion sugerido

1. Ejecutar smoke tests Fase 1 (archivo unico) para blindar regresiones de flujo critico.
2. Luego avanzar con Refactor Fase 2 (orquestacion shipping/admin) en cambios pequenos y auditables.
3. Mantener enfoque incremental: un dominio por tanda + chequeo rapido.

## 44) Home: bloque de confianza inline (2026-03-28, cierre)

### 44.1 Bloque de confianza debajo del showroom

Archivos trabajados:
- `index.html`
- `assets/css/styles.css`

Cambios consolidados:
1. Se agrego bloque de confianza justo debajo de la imagen principal/showroom.
2. Se dejo formato final minimalista inline de 2 lineas:
   - linea 1: `📍 San Martín 50, CABA · Desde 2009`
   - linea 2: `🚚 Envíos a todo el país · 🏪 Retiro en CABA · 💳 Pagá seguro con MercadoPago · 💬 Atención rápida por WhatsApp`
3. Se mantuvo sin cajas/fondos/bordes para no romper la estetica actual.
4. Se conservo ubicacion, imagen y navbar sin cambios.

### 44.2 Ajuste visual de unificacion entre lineas

Archivo trabajado:
- `assets/css/styles.css`

Cambios consolidados:
1. `.trust-line-1` se alineo visualmente con `.trust-line-2`:
   - peso visual similar (`font-weight: 500`),
   - color casi igual (blanco levemente mas suave),
   - `line-height` igual,
   - tamano apenas menor para mantener jerarquia discreta.
2. Resultado: ambas lineas se leen como una pieza visual unificada.

### 44.3 Responsive

1. En mobile se mantiene centrado.
2. Se habilita salto de linea natural y padding lateral para evitar texto apretado.

### 44.4 Estado para retomar

1. Bloque de confianza en home consolidado y estable.
2. Proximo paso sugerido al retomar:
   - smoke tests Fase 1 del flujo critico,
   - luego Refactor Fase 2 en `orderService` por dominios.

## 45) Novedades: alineacion visual con Catalogo + compactacion final (2026-03-29)

### 45.1 Objetivo de la tanda

Llevar la seccion `Novedades` a una estetica mas cercana a `Catalogo`:
- cards mas compactas y modernas,
- misma sensacion de sistema visual,
- hover sutil,
- sin tocar logica, textos ni funcionalidad.

### 45.2 Archivo trabajado

- `assets/css/styles.css`

### 45.3 Ajuste visual base aplicado (primera pasada)

Cambios consolidados sobre `.novedades-list` y `.novedad-item`:
1. Cards de novedades con look de card moderno (borde/radius/sombra/transicion) alineado con `Catalogo`.
2. Estructura visual mas compacta en contenido interno (`product-info`, tipografia, precios, acciones).
3. Descripcion acotada para limpiar altura visual (line clamp).
4. Hover sutil agregado en `Novedades` (elevacion suave + sombra + realce leve de imagen).
5. Grid desktop en 2 columnas para mejorar balance visual del bloque.

### 45.4 Ajuste de compactacion adicional (segunda pasada)

Se hizo un micro-ajuste para bajar aun mas el peso visual:
1. Menor separacion entre cards y menor densidad vertical interna.
2. Imagen menos dominante por proporcion.
3. Menor cantidad de lineas visibles de descripcion.
4. Botones mas compactos (alto/padding/radius), manteniendo misma funcionalidad.
5. Hover reducido de `translateY(-4px)` a `translateY(-2px)`.

### 45.5 Ajuste de imagen y rollback por recorte agresivo

Se probo una tercera micro-pasada con altura fija por `clamp(...)` en `.novedad-item .product-main` para uniformar alto.

Resultado observado:
- el recorte de producto quedo demasiado agresivo.

Accion final aplicada:
1. Se revirtio ese ultimo ajuste.
2. Se elimino la altura fija por `clamp(...)`.
3. Se restauro proporcion por `aspect-ratio: 16/11` (desktop y mobile) para respetar mejor la imagen.

Estado final:
- se conservan las mejoras de compactacion/estilo/hover,
- sin mutilar imagenes,
- sin cambios en JS ni en logica de compra/consulta.

### 45.6 Alcance funcional (sin cambios)

Se confirma que NO hubo cambios en:
1. `assets/js/novedades.js`
2. textos de productos
3. botones a nivel funcional
4. enlaces
5. checkout/consulta

### 45.7 Punto de reanudacion sugerido

1. Validar visual final en desktop y mobile con cache limpio (`Ctrl+F5`).
2. Si hiciera falta un ultimo ajuste, priorizar micro-ajuste de spacing/padding antes que recorte de imagen.

## 46) Hotfix checkout: normalizeDeliveryType undefined (2026-03-29)

### 46.1 Sintoma reportado

En frontend, al hacer `Comprar` y luego `Continuar al pago`, aparecia el error:
- `normalizeDeliveryType is not defined`

Impacto observado:
- fallo en `catalogo.html`
- fallo en `novedades.html`
- el modal de metodo de entrega abria, pero el flujo se cortaba antes de redirigir a checkout.

### 46.2 Causa exacta

Archivo afectado:
- `server/services/orderService.js`

Detalle:
1. En `createCheckout(...)` se usa `normalizeDeliveryType(...)`.
2. Despues de la limpieza/refactor, la funcion quedo sin importar en el bloque `require("../models/orderModel")`.
3. Resultado: `ReferenceError` en runtime al crear preferencia de checkout.

### 46.3 Fix aplicado (minimo, conservador y reversible)

Archivo modificado:
- `server/services/orderService.js`

Cambio puntual:
1. Se agrego el import faltante en destructuring:
   - `normalizeDeliveryType,`

Alcance del fix:
- sin cambios de logica de negocio
- sin cambios de estilos
- sin cambios de contratos de API
- sin refactor adicional

### 46.4 Verificacion realizada

1. `node --check server/services/orderService.js` OK.
2. Prueba funcional de `createCheckout` con `source: catalogo` -> devuelve `checkoutUrl`.
3. Prueba funcional de `createCheckout` con `source: novedades` -> devuelve `checkoutUrl`.
4. Confirmado: desaparece el error `normalizeDeliveryType is not defined` en el punto del flujo previo a redireccion.

### 46.5 Nota operativa

Durante la verificacion se generaron pedidos de prueba locales y se limpiaron al cerrar la prueba para no contaminar historial operativo.

### 46.6 Punto de reanudacion sugerido

1. Validar manualmente en navegador:
   - `catalogo.html` -> `Comprar` -> `Continuar al pago`
   - `novedades.html` -> `Comprar` -> `Continuar al pago`
2. Si se ve cache viejo en frontend, aplicar hard refresh (`Ctrl+F5`).
3. Continuar con el plan ya definido (smoke tests Fase 1 / Refactor Fase 2).

## 47) Actualizacion masiva de precios en catalogo (2026-03-29)

### 47.1 Objetivo de la tanda

Actualizar precios en `assets/data/products.json` segun listado comercial, con criterio conservador:
- modificar solo `price_usd`;
- no tocar estructura del JSON;
- no cambiar `id`;
- no tocar frontend ni backend.

### 47.2 Archivo trabajado

- `assets/data/products.json`

### 47.3 Resultado de busqueda y aplicacion

1. Se procesaron 38 productos solicitados por nombre visible.
2. Se encontraron todos los productos (`missing = 0`).
3. Se aplicaron 31 cambios efectivos de `price_usd`.
4. Hubo 7 productos que ya estaban en el precio objetivo y se dejaron sin cambios.

Productos ya correctos (sin cambio necesario):
- `Mochila Targus Intellect Essential 15.6`
- `Mochila Targus Sport 15.6`
- `Mouse Logitech M317c Chirpy Bird`
- `Mouse Logitech M317c Floral`
- `Mouse Logitech M317c Golden Garden`
- `Mouse Targus Mini`
- `Cable Belkin USB to MicroUSB`

### 47.4 Verificacion tecnica

1. JSON validado correctamente tras la edicion (`ConvertFrom-Json`/parse OK).
2. Se confirmo que los cambios quedaron acotados a lineas de `price_usd`.
3. No se crearon productos nuevos ni se alteraron ids/rutas.

## 48) Verificacion final de 7 productos objetivo (2026-03-29)

### 48.1 Alcance

Se verificaron de forma puntual en `assets/data/products.json` los siguientes productos:
- `Mochila Targus Intellect Essential 15.6`
- `Mochila Targus Sport 15.6`
- `Mouse Logitech M317c Chirpy Bird`
- `Mouse Logitech M317c Floral`
- `Mouse Logitech M317c Golden Garden`
- `Mouse Targus Mini`
- `Cable Belkin USB to MicroUSB`

### 48.2 Resultado

- 7/7 encontrados.
- 7/7 con `price_usd` coincidente con objetivo.

## 49) Ajuste puntual de 3 precios (2026-03-29)

### 49.1 Objetivo de la tanda

Actualizar 3 productos solicitados, sin tocar ningun otro campo:
1. `Auricular Inalambrico+Traductor Idiomas M113` -> `24`
2. `Auricular Inalambrico+ Traductor Idiomas YYK-Q65` -> `19`
3. `Aspiradora Solpadora Aire Portatil Hogar Auto` -> `56`

### 49.2 Archivo trabajado

- `assets/data/products.json`

### 49.3 Diff aplicado (solo `price_usd`)

- `27.0 -> 24` (`Auricular Inalambrico+Traductor Idiomas M113`)
- `21.0 -> 19` (`Auricular Inalambrico+ Traductor Idiomas YYK-Q65`)
- `63.0 -> 56` (`Aspiradora Solpadora Aire Portatil Hogar Auto`)

### 49.4 Verificacion final

- 3/3 productos encontrados por nombre exacto.
- 3/3 con `price_usd` final correcto.
- Sin cambios en ids, estructura ni logica de aplicacion.

## 50) CORS produccion para frontend publico (2026-03-29)

### 50.1 Objetivo

Permitir llamadas del frontend online a API en Railway sin romper compatibilidad local.

### 50.2 Archivo trabajado

- `server/app.js`

### 50.3 Cambio aplicado

Se reemplazo validacion por regex de localhost por lista explicita de origenes permitidos:
- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `https://santelmocomputacion.com.ar`
- `https://www.santelmocomputacion.com.ar`

### 50.4 Resultado

- Frontend productivo habilitado para consumir `/api/*`.
- Compatibilidad localhost mantenida.

## 51) Retorno MP: hardening de `confirm-return` (2026-03-29)

### 51.1 Problema

En algunos retornos desde Mercado Pago, el flujo quedaba en `/api/checkout/confirm-return` sin llegar correctamente a pantalla final.

### 51.2 Causa principal

La ruta dependia solo de `external_reference`; en casos reales llegaba `order_id`.
Adicionalmente, errores internos de esa ruta podian terminar en JSON del errorHandler (usuario quedaba en endpoint API).

### 51.3 Archivo trabajado

- `server/routes/checkoutRoutes.js`

### 51.4 Cambios aplicados

1. Fallback de referencia:
- `orderId = external_reference || order_id`.
2. Construccion de query de retorno preservando:
- `order_id`, `access_token`, `payment_id`, `status`.
3. Fallback visual en errores:
- redireccion al frontend en lugar de responder JSON en ese flujo de retorno.

### 51.5 Resultado

- El usuario deja de quedar clavado en ruta `/api/...` en retornos problematicos.
- Flujo visual final estabilizado.

## 52) UX final: redireccion de Railway al dominio publico (2026-03-29)

### 52.1 Objetivo

Tras `confirm-return` en Railway, llevar siempre al frontend publico.

### 52.2 Archivo trabajado

- `server/routes/checkoutRoutes.js`

### 52.3 Cambio aplicado

Se cambiaron URLs finales de redirect:
- success -> `https://santelmocomputacion.com.ar/checkout-success.html`
- failure -> `https://santelmocomputacion.com.ar/checkout-failure.html`

Manteniendo query params:
- `order_id`
- `access_token`
- `payment_id`
- `status`

### 52.4 Resultado

- El usuario no queda en dominio Railway en etapa final.
- UX final consistente en dominio publico.

## 53) Catalogo: alta producto FILM + ajuste precio (2026-03-29)

### 53.1 Archivo trabajado

- `assets/data/products.json`

### 53.2 Alta de producto

Se agrego producto:
- `id`: `film-protector`
- `name`: `Film Protector Pantalla`
- `category`: `Varios`
- `stock`: `1`
- `images`: `/assets/products/FILM/1.jpg`, `/2.jpg`, `/3.jpg`
- `folder`: `/assets/products/FILM/`

### 53.3 Ajuste posterior de precio

- `price_usd`: `2` -> `0.5`

### 53.4 Verificacion local

- Producto visible en catalogo local.
- En carpeta `assets/products/FILM/` se detecto `1.jpg` presente y `2.jpg`/`3.jpg` faltantes al momento del chequeo.

## 54) Email comprador en submit final (retiro/envio) (2026-03-29)

### 54.1 Problema

En `checkout-success`, al guardar retiro/envio final:
- pedido se guardaba,
- email admin seguia,
- pero `email` de respuesta venia `null` y no habia confirmacion real de envio al comprador en esa etapa.

### 54.2 Causa exacta

Archivo:
- `server/services/orderService.js`

En `savePickupContact` y `saveShipping`:
- se llamaba trigger asincrono,
- luego se seteaba `const emailResult = null`.

### 54.3 Fix aplicado

1. Se agrego helper:
- `sendCustomerEmailAfterApprovedOrder(order, source)`
- envia email comprador si corresponde,
- registra `approved_email_sent` en history cuando se envia.
2. Se mantuvo `triggerApprovedPaymentEmail(...)` para flujos existentes.
3. En submit final (`savePickupContact`/`saveShipping`) ahora:
- `emailResult` se obtiene del helper (no `null`),
- y se mantiene envio admin con `sendAdminEmailAfterCustomerData(...)`.

### 54.4 Resultado

- El submit final vuelve a tener estado real de email comprador en respuesta.
- Se conserva email admin y no se rompe flujo de pago/guardado.

## 55) Smoke tests Fase 1 flujo critico (2026-04-08)

### 55.1 Objetivo

Agregar una prueba E2E minima automatizada para cubrir el flujo critico recomendado:
- create checkout
- confirm approved
- guardar datos de envio
- crear envio desde admin
- generar/descargar etiqueta desde admin

### 55.2 Archivos trabajados

- `tests/smoke-checkout.test.js` (nuevo)
- `package.json`

### 55.3 Implementacion aplicada

1. Se creo test nativo con `node:test` + `fetch` (sin dependencias nuevas).
2. El test levanta `createApp()` en puerto efimero y ejecuta el flujo completo via HTTP real:
   - `POST /api/checkout/create-preference`
   - `POST /api/checkout/confirm`
   - `POST /api/orders/:orderId/shipping`
   - `POST /api/admin/orders/:orderId/create-shipment`
   - `POST /api/admin/orders/:orderId/label`
   - `GET /api/admin/orders/:orderId/label`
   - `GET /api/admin/orders?order_id=...`
3. Se agrego script npm:
   - `test:smoke` -> `node --test --test-isolation=none tests/smoke-checkout.test.js`
4. Aislamiento operativo incluido en el test:
   - backup/restore de `server/data/orders.json`
   - limpieza de labels nuevas en `server/data/labels`
   (evita contaminar datos operativos locales).

### 55.4 Resultado de verificacion local

- `npm run test:smoke` ejecutado OK (flujo verde).

## 56) Fix ruta admin publica en hosting estatico (2026-04-08)

### 56.1 Problema reportado

Al abrir:
- `https://santelmocomputacion.com.ar/stc-admin-orders-9x7q`

en produccion se mostraba `index.html` en lugar del panel admin.

### 56.2 Causa tecnica

La ruta discreta existia en backend Node (`server/app.js`), pero el dominio publico sirve frontend estatico.
En ese hosting, rutas no fisicas terminaban resolviendo al `index`, por eso no llegaba al panel.

### 56.3 Cambios aplicados

Archivos trabajados:
- `stc-admin-orders-9x7q/index.html` (nuevo)
- `assets/js/admin-orders.js`
- `assets/js/admin-order-detail.js`
- `admin-order-detail.html`

Implementacion:
1. Se agrego alias fisico estatico en carpeta:
   - `/stc-admin-orders-9x7q/index.html`
   - replica el panel admin para que la URL discreta funcione en hosting estatico.
2. En listado admin, el link de detalle dejo de depender de ruta dinamica:
   - antes: `/stc-admin-orders-9x7q/:orderId`
   - ahora: `/admin-order-detail.html?order_id=...`
3. `admin-order-detail.js` ahora soporta `order_id` por query param (y mantiene fallback path legacy).
4. Boton "Volver a pedidos" en detalle apunta a:
   - `/stc-admin-orders-9x7q/`

### 56.4 Resultado esperado

- El link especial vuelve a abrir el panel en produccion.
- El detalle sigue funcionando sin depender de rutas dinamicas del servidor.

### 56.5 Estado de cierre

- Documentacion de avance guardada en `progreso.md`.
- Recomendacion operativa post deploy:
  - abrir `https://santelmocomputacion.com.ar/stc-admin-orders-9x7q/`
  - aplicar `Ctrl+F5` (y `Purge Cache` en Cloudflare si hiciera falta).

### 57. Guias Tech como indice de informes

Implementacion:

- `guias-tech.html` queda como listado/indice de informes.
- Se crea `guia-limpiar-notebook.html` para el informe `Cómo limpiar tu notebook sin dañarla`.
- Se agregan estilos de tarjeta para listar informes y facilitar nuevas publicaciones.

Estado:

- Guías Tech ya permite entrar al primer informe desde un link dedicado.
