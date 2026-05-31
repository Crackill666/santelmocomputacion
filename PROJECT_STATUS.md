# PROJECT STATUS - Santelmo Computacion

Fecha de actualizacion: 2026-05-30
Estado general: SISTEMA LOCAL OPERATIVO + CHECKOUT CON 3 METODOS DE ENTREGA (preparado para sucursal Correo Argentino sin credenciales reales)

## Nota de sincronizacion

- Este archivo estaba desactualizado (ultimo corte: 2026-03-16).
- Esta version sincroniza el estado real con:
  - `progreso.md` (secciones 35, 36 y 37; 2026-03-21).
  - codigo actual del repositorio al 2026-03-22.

## Estado actual del sistema

- Ecommerce funcional en local.
- Flujo completo activo:
  - catalogo -> checkout -> mock Mercado Pago -> success/failure -> persistencia -> panel admin.
- Estados de pago no ambiguos en backend y visibles en frontend admin.
- Trazabilidad de `pending` completa para debugging operativo.

## Stack actual

- Frontend: HTML + CSS + JS (vanilla)
- Backend: Node.js + Express
- Persistencia: JSON local (`server/data/orders.json`)
- Pagos: Mercado Pago (`mock` operativo, base preparada para `real`)

## Flujo operativo implementado

1. Desde catalogo se inicia checkout.
2. Se crea pedido en estado de pago inicial `pending`.
3. Checkout mock permite aprobar o rechazar.
4. Si hay abandono de checkout, se confirma como `abandoned` (mapeado a `pending` trazable).
5. Success/failure consolidan estado via `POST /api/checkout/confirm`.
6. Pedido persiste en `orders.json` y se visualiza en panel admin.

## Evolucion de la semantica `pending`

### FASE 1 - Observabilidad

Se agrego `payment.pendingReason` (con espejo legacy `payment_pending_reason`) con estos valores:
- `awaiting_confirmation`
- `mp_pending`
- `fallback_missing_status`
- `fallback_unknown_status`

### FASE 2 - Problema detectado

- El abandono de checkout no se distinguia del resto de `pending`.

### FASE 3 - Backend aplicado

- Nuevo motivo: `CHECKOUT_ABANDONED` (`checkout_abandoned`).
- `confirmCheckout` soporta `status: "abandoned"` en rama mock, con mapping:
  - `status = "pending"`
  - `status_detail = "checkout_abandoned"`
  - `pendingReason = "checkout_abandoned"`
- `applyPaymentToOrder` respeta `pendingReasonOverride`.

### FASE 4 - Frontend checkout mock aplicado

Archivo: `assets/js/mock-mp-checkout.js`

- Detecta abandono con `pagehide`.
- Notifica backend con `sendBeacon` y fallback `fetch(... keepalive:true)`.
- Evita duplicados con flags de control.
- Bug de carga del script en HTML: resuelto (script presente en `mock-mp-checkout.html`).

### FASE 5 - Panel admin aplicado

Archivo: `assets/js/admin-orders.js`

- La columna **Payment status** ahora muestra:
  - `pending (checkout_abandoned)`
  - `pending (mp_pending)`
  - `pending (awaiting_confirmation)`
- Se agregaron badges visuales por estado:
  - `approved` (verde)
  - `rejected` (rojo)
  - `pending` (ambar)

CSS asociado:
- `assets/css/checkout.css`

## Validacion y persistencia

Validacion funcional local completada en flujo mock:
- `approved` OK
- `rejected` OK
- `abandoned` OK

Persistencia confirmada:
- `pending + checkout_abandoned` se guarda correctamente en pedido (`payment.pendingReason` y `payment_pending_reason`).

Foto de datos actual (`server/data/orders.json`):
- total pedidos: 64
- pagos: `approved=45`, `pending=14`, `rejected=5`
- casos `checkout_abandoned`: 2

## Entorno operativo actual

- Inicio recomendado: `CLICK_AQUI_INICIAR_TIENDA.cmd`
- URL local: `http://localhost:3000/index.html`
- Modo operativo local recomendado:
  - `MERCADO_PAGO_MODE=mock`
  - `CORREO_ARGENTINO_MODE=mock`
- Persistencia sin limpieza automatica:
  - `server/data/orders.json`

## Historial relevante preservado (corte anterior 2026-03-16)

- FASE 1 local completada:
  - flujo de compra validado en local;
  - shipping mock validado;
  - retiro en tienda validado;
  - panel admin operativo;
  - tracking mock y etiqueta mock funcionando.

## Siguiente gran paso recomendado (sin implementar en esta actualizacion)

FASE siguiente: estabilizar pagos en entorno `real test` (Mercado Pago + webhook HTTPS en staging), manteniendo shipping en mock hasta cerrar trazabilidad end-to-end en entorno real.

## Actualizacion de continuidad (2026-03-23)

### Cambios consolidados de esta tanda

- Checkout/confirm:
  - `POST /api/checkout/confirm` ahora permite confirmar con `order_id` aun cuando `access_token` no llega en query/body.
- Correo Argentino API 2.0 (base):
  - variables nuevas activas por config (`CORREO_ARG_ENABLED`, `CORREO_ARG_BASE_URL`, `CORREO_ARG_API_KEY`, `CORREO_ARG_AGREEMENT`), con compatibilidad legacy.
  - rutas nuevas listas:
    - `GET /api/shipping/correo/auth-check`
    - `GET /api/shipping/correo/agencies`
    - `POST /api/shipping/correo/order`
  - si `CORREO_ARG_ENABLED=false`, responde en forma controlada (`503`).
- Checkout UX minima (sin tocar Mercado Pago):
  - selector de metodo de entrega con 3 opciones:
    - `Retiro en local`
    - `Envio a domicilio`
    - `Sucursal Correo Argentino`
  - persistencia de seleccion en pedido usando campos existentes:
    - `deliveryMethod`
    - `shipping.deliveryType`
  - en `checkout-success`, opcion `Sucursal Correo Argentino` muestra placeholder (sin integracion real de agencies todavia).

### Estado operativo despues de esta actualizacion

- Mercado Pago: flujo existente preservado.
- Shipping:
  - domicilio y retiro siguen operativos como antes;
  - sucursal Correo Argentino queda preparada en UI/flujo para conectar credenciales reales en la proxima etapa.

### Proximo paso recomendado

1. Cargar credenciales reales de Correo Argentino en `.env`.
2. Conectar seleccion de sucursal real (`agencyId`) en el bloque placeholder de `checkout-success`.
3. Validar end-to-end: checkout -> success -> guardado de shipping tipo `agency`.

## Actualizacion complementaria (2026-03-23, cierre de jornada)

### Frontend: conversion + microcopy (sin cambios de backend)

Se completo una tanda de mejoras de alto impacto visual/comercial sin alterar logica de negocio:

1. Modal de producto:
   - bloque de confianza agregado y refinado (`Compra segura`, `Retiro o envio`, `Soporte por WhatsApp`);
   - categoria removida del modal para reducir ruido;
   - CTA de consulta compactado a `Consultar ahora`;
   - `Comprar ahora` preservado.

2. Stock copy unificado:
   - `Ultimas unidades` (stock bajo);
   - `Disponible ahora` (stock medio/alto);
   - aplicado en cards y modal donde correspondia.

3. Contacto:
   - titulo final: `Contacto`;
   - boton principal: `Escribinos por WhatsApp`;
   - microcopy activo: `Respondemos rapido ✓` y `Podes consultarnos sin compromiso`;
   - linea contextual: `Oficina en CABA (con cita previa)`.

4. WhatsApp UX:
   - builder central confirmado en `wa.me` con `encodeURIComponent`;
   - apertura unificada con `noopener,noreferrer`;
   - verificacion final: sin referencias frontend a `api.whatsapp.com/send`.

5. Catalogo (Cables):
   - typo corregido en nombre de producto:
     - `Cable Belkin USD to MicroUSB` -> `Cable Belkin USB to MicroUSB`.

### Estado para retomar

- Sistema listo para continuar desde frontend/pulido o avanzar en Correo Argentino real.
- Proximo paso tecnico sugerido:
  1. conectar seleccion real de sucursal (`agencyId`) en success/checkout;
  2. validar flujo completo con credenciales reales de Correo;
  3. cerrar QA visual mobile final de cards/modal/contacto.

## Actualizacion de continuidad (2026-04-30)

### Estado general actualizado

- Catalogo actualizado y validado.
- Conteo actual en `assets/data/products.json`: `57` productos.
- `progreso.md` queda como historial detallado de cambios hasta seccion `63`.

### Productos agregados en esta tanda

Se agregaron productos nuevos desde carpetas en `assets/products/`, respetando estructura existente de catalogo:

1. Categoria `Cables`:
   - `Cable Cargas_Datos Display` - USD `7.2`
   - `Cable Datos_Carga Soporte` - USD `10.5`
   - `Cable Carga con Luz` - USD `1.3`
   - `Estuche Multicable` - USD `2.5`

2. Categoria `Mouse / Teclados / Gaming`:
   - `Mini Teclado Plegable` - USD `19.2`

3. Categoria `Varios`:
   - `Smartwatch Inteligente H59` - USD `38`
   - `Smartwatch Tank M1` - USD `58.5`

### Verificaciones realizadas

- `assets/data/products.json` validado correctamente con `ConvertFrom-Json`.
- Se verifico existencia fisica de imagenes agregadas.
- Las rutas respetan mayusculas/minusculas reales de archivos (`.jpg` / `.JPG`) para evitar fallos en hosting.

### Novedades: estado visual final

- `novedades.html` usa cache-buster de CSS:
  - `v=20260430-novedades-grid3`
- `Novedades` queda en formato de cards verticales similar a `Catalogo`.
- En desktop:
  - 2 productos por fila.
  - imagen arriba e informacion debajo.
  - se mantiene el tamano de letra existente.
  - imagen limitada con:
    - `.novedad-item .product-gallery { width: min(100%, 430px); margin: 0 auto; }`
- En mobile/tablet:
  - 1 producto por fila.

### Archivos principales modificados en la tanda

- `assets/data/products.json`
- `assets/css/styles.css`
- `novedades.html`
- `progreso.md`
- `project_status.md`

### Estado para retomar

- Revisar visual final de `Novedades` en produccion con `Ctrl+F5`.
- Si se usa Cloudflare cache, aplicar `Purge Cache` si el cambio de CSS no aparece.
- Continuar nuevas altas de productos usando el mismo flujo:
  1. carpeta en `assets/products/`,
  2. imagenes con nombres exactos,
  3. `.txt` para descripcion/precio,
  4. alta en `assets/data/products.json`,
  5. validar JSON e imagenes,
  6. documentar en `progreso.md`.

## Actualizacion de continuidad (2026-05-30)

### Catalogo: alta de mochilas Targus

Se agregaron 6 productos nuevos en categoria `Mochilas`, manteniendo la estructura existente del catalogo y sin tocar estetica, HTML, CSS, JavaScript ni backend:

1. `Mochila Targus Ascend 16"` - USD `26`
2. `Mochila Targus Avila 15-16"` - USD `58`
3. `Mochila Targus Geolite Advanced EcoSmart 16"` - USD `31`
4. `Mochila Targus City 16" Negro` - USD `17`
5. `Mochila Targus Geolite Essential 15-16"` - USD `17`
6. `Mochila Targus Terra EcoSmart 15-16"` - USD `29`

### Verificaciones realizadas

- `assets/data/products.json` validado correctamente con `ConvertFrom-Json`.
- Conteo actualizado: `56` productos.
- Se verifico existencia fisica de las 18 imagenes nuevas.
- No se detectaron nombres ni `id` duplicados.

### Ajuste de imagenes posterior

- Se revirtio el ajuste CSS especifico porque dejaba las mochilas demasiado chicas.
- Se convirtieron las 18 imagenes de las 6 mochilas Targus nuevas a `1500x1000`.
- Se reordeno la primera imagen de cada mochila nueva para priorizar la foto mas completa disponible.
- Ajuste posterior: por pedido, la portada de las 6 mochilas nuevas queda como imagen `1` (`1.JPG` / `1.jpg` segun extension real).
- Objetivo: que se vean mas parejas con las mochilas ya existentes en la primera linea del catalogo.
- No se modifico la estetica general, HTML, CSS ni JavaScript.

### Catalogo: alta Teclado Bluetooth

Se agrego 1 producto nuevo en categoria `Mouse / Teclados / Gaming`:

- `Teclado plegable Ergo` - USD `23`

Verificaciones:
- `assets/data/products.json` validado correctamente con `ConvertFrom-Json`.
- Conteo actualizado: `57` productos.
- Se verifico existencia fisica de las 3 imagenes.
- No se detectaron nombres ni `id` duplicados.
