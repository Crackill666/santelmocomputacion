# Santelmo Computacion - Flujo de compra simple

Sitio web con flujo de compra sin login obligatorio:

Producto -> Comprar -> Checkout Mercado Pago -> Pago aprobado -> Formulario de envio -> Pedido listo para crear envio -> Acciones admin (crear envio / etiqueta / tracking).

## Stack

- Frontend: HTML + CSS + JS (sin framework)
- Backend: Node.js + Express
- Persistencia: JSON local (`server/data/orders.json`)
- Mercado Pago: modo `mock` o `real`
- Correo Argentino: capa separada con `mock` + placeholder para API real

## Estructura principal

- `server.js`: entrypoint del backend
- `server/app.js`: configuracion Express + rutas
- `server/routes/`: checkout, pedidos, webhooks, admin
- `server/services/mercadoPagoService.js`: integracion MP
- `server/services/shipping/`: capa desacoplada de logistica (mock + Correo Argentino API 2.0 preparada)
- `server/services/correoArgentinoService.js`: wrapper legacy compatible
- `server/services/orderService.js`: logica de estados
- `server/data/orders.json`: registro interno de pedidos
- `checkout-success.html`: pagina post-pago + formulario corto de envio
- `admin-pedidos.html`: lista admin de pedidos
- `admin-order-detail.html`: detalle admin con acciones de envio
- `mock-mp-checkout.html`: simulador de checkout para pruebas locales
- `assets/js/checkout.js`: dispara checkout desde boton Comprar

## Instalacion

1. Instalar dependencias:

```bash
npm install
```

Si en PowerShell hay restriccion de scripts, usar:

```bash
npm.cmd install --cache .npm-cache
```

2. Copiar variables de entorno:

```bash
copy .env.example .env
```

3. Levantar servidor:

```bash
npm start
```

4. Abrir en navegador:

- `http://localhost:3000/index.html`

## Variables de entorno importantes

- `MERCADO_PAGO_MODE=mock|real`
- `MERCADO_PAGO_ACCESS_TOKEN=` (obligatorio en modo `real`)
- `MERCADO_PAGO_FALLBACK_TO_MOCK=true|false` (si `real` falla, continua en checkout simulado)
- `MERCADO_PAGO_TEST_TOKEN_FORCE_MOCK=true|false` (si el token es `TEST-*`, evita sandbox y usa mock)
- `APP_BASE_URL=` (URL publica del backend, usada por back_urls y webhook)
- `FX_USD_TO_ARS=` (fallback si no se envia ARS desde frontend)
- `CORREO_ARGENTINO_MODE=mock|real`
- `CORREO_ARGENTINO_API_URL=` y `CORREO_ARGENTINO_API_TOKEN=` para futura integracion real
- `SHIPPING_PROVIDER=mock|correo_argentino`
- `SHIPPING_FALLBACK_TO_MOCK=true|false`
- `SHIPPING_AUTO_CREATE_ON_CUSTOMER_FORM=true|false` (default recomendado `false`)
- `SHIPPING_COST_CABA`, `SHIPPING_COST_GBA`, `SHIPPING_COST_INTERIOR`
- `CORREO_ARG_API_BASE_URL`, `CORREO_ARG_API_KEY`, `CORREO_ARG_AGREEMENT`, `CORREO_ARG_LABEL_FORMAT`
- `ADMIN_PANEL_TOKEN=` token de proteccion para `/api/admin/*`
- `ADMIN_PANEL_TOKEN_REQUIRED=true|false` (default: `true` en produccion, `false` en desarrollo)
- `WEBHOOK_SHARED_SECRET=` secreto opcional/recomendado para validar webhooks entrantes

## Politica de persistencia

- El archivo real de pedidos es `server/data/orders.json`.
- No hay limpieza automatica de pedidos al iniciar backend.
- No borrar ni vaciar `orders.json` sin confirmacion manual.
- Para pruebas, usar datos mock separados (no mezclar con persistencia real).

## Operacion diaria (3 pasos maximo)

1. Doble click en `CLICK_AQUI_INICIAR_TIENDA.cmd` (modo recomendado `DEMO-REAL`).
2. Esperar a que se abra `http://localhost:3000/index.html`.
3. Vender/probar flujo completo.

Opcional (forzar real sin fallback):
- `CLICK_INICIAR_REAL_ESTRICTO.cmd`
- o `CLICK_INICIAR_1_CLICK.cmd estricto`

El iniciador 1-click hace automaticamente:
- Ajuste de `.env` segun perfil.
- Cierre de backend previo en puerto `3000`.
- Instalacion de dependencias si faltan.
- Inicio de backend y apertura de navegador.

## Checklist "Listo para subir" (sin desplegar)

1. Configurar `.env` con datos reales (no `TEST-*`) para Mercado Pago y URL publica HTTPS.
2. Definir `ADMIN_PANEL_TOKEN` y habilitar `ADMIN_PANEL_TOKEN_REQUIRED=true`.
3. Definir `WEBHOOK_SHARED_SECRET`.
4. Ejecutar validacion de preflight:

```bash
npm run preflight
```

Si hay errores, corregir variables y repetir hasta obtener `Preflight OK`.

## Flujo implementado

1. Boton `Comprar` llama `POST /api/checkout/create-preference`
2. Se crea pedido en estado `pending` (compat legacy: `pendiente_pago`)
3. Se redirige a checkout (MP real o mock)
4. Al volver, `checkout-success.html` confirma pago con `POST /api/checkout/confirm`
5. Si pago aprobado, habilita formulario corto de envio
6. Formulario guarda direccion con `POST /api/orders/:orderId/shipping`
7. El pedido queda en estado `ready_to_create_shipment`
8. En admin se ejecutan acciones:
   - crear envio
   - obtener/regenerar etiqueta
   - refrescar tracking
   - marcar despachado
   - cancelar pedido (estado interno)

## Modo demo-real recomendado

Para vender con UX estable en pruebas:

1. Dejar `MERCADO_PAGO_MODE=real` si queres probar contra MP.
2. Dejar `MERCADO_PAGO_FALLBACK_TO_MOCK=true`.
3. Dejar `MERCADO_PAGO_TEST_TOKEN_FORCE_MOCK=true` mientras uses credenciales `TEST-*`.
4. Si MP sandbox falla (login/cookies/errores temporales), el sistema redirige automaticamente al checkout simulado sin cortar el flujo.

Asi podes entrar a la web, ver producto, tocar `Comprar` y simular la venta siempre.

En Windows tambien podes usar:
- `CLICK_AQUI_INICIAR_TIENDA.cmd` (inicio 1-click en `DEMO-REAL`)
- `CLICK_INICIAR_REAL_ESTRICTO.cmd` (inicio 1-click en `REAL ESTRICTO`)
- `CLICK_INICIAR_1_CLICK.cmd demo|estricto` (mismo iniciador con perfil por parametro)

## Estados de pedido usados

- Pago:
  - `pending`
  - `approved`
  - `rejected`
  - `refunded`
- Logistica:
  - `pending_shipping_data`
  - `ready_to_create_shipment`
  - `shipment_created`
  - `label_ready`
  - `dispatched`
  - `delivered`
  - `cancelled`
  - `shipping_error`

Nota:
- Se mantienen campos legacy en paralelo (`estado_pago`, `estado_envio`) para compatibilidad con datos/rutas viejas.

## Panel interno

- URLs:
  - `http://localhost:3000/admin/orders` (lista)
  - `http://localhost:3000/admin/orders/:id` (detalle)
- Filtros lista: `id_pedido`, estado de pago y estado de envio
- Soporta token en campo `Token admin` (header `x-admin-token`)
- Detalle admin:
  - editar/guardar datos de envio
  - crear envio
  - obtener etiqueta
  - refrescar tracking
  - marcar despachado
  - cancelar pedido
  - ver/descargar etiqueta

## Rutas admin de envios (API)

- `GET /api/admin/orders`
- `GET /api/admin/orders/:orderId`
- `POST /api/admin/orders/:orderId/shipping`
- `POST /api/admin/orders/:orderId/create-shipment`
- `POST /api/admin/orders/:orderId/label`
- `GET /api/admin/orders/:orderId/label`
- `POST /api/admin/orders/:orderId/refresh-tracking`
- `POST /api/admin/orders/:orderId/mark-dispatched`
- `POST /api/admin/orders/:orderId/cancel`
- `GET /api/admin/agencies`

## Integracion real Mercado Pago (pasos)

1. Poner `MERCADO_PAGO_MODE=real`
2. Cargar `MERCADO_PAGO_ACCESS_TOKEN`
3. Publicar backend con HTTPS y setear `APP_BASE_URL` publica
4. Configurar webhook de MP a `https://TU_DOMINIO/api/webhooks/mercadopago`
5. En produccion final, si ya no queres fallback de demo: `MERCADO_PAGO_FALLBACK_TO_MOCK=false`

## Integracion real Correo Argentino

- Adapter preparado: `server/services/shipping/adapters/correoArgentinoAdapter.js`
- Adapter mock funcional: `server/services/shipping/adapters/mockShipping.js`
- Selector por feature flag/provider: `server/services/shipping/index.js`
- Estructura lista para API 2.0 (paq.ar) con headers:
  - `Authorization: Apikey <key>`
  - `agreement: <agreement>`
- Si faltan credenciales y `SHIPPING_FALLBACK_TO_MOCK=true`, usa mock sin romper flujo.
