# Sistema de Seguimiento de Compras de Videos

## Resumen

Este documento explica cómo el sistema rastrea las compras de videos y módulos, y cómo saber qué usuario compró qué video.

## Estructura de Datos

### Documento de Compra (VideoPurchase)

Cada compra genera un documento en la colección `videopurchases` con la siguiente estructura:

```typescript
{
  _id: ObjectId,
  userId: ObjectId,              // ID del usuario que compró
  purchaseType: "video" | "module",  // Tipo de compra
  itemId: string,                // ID del item comprado (videoId o moduleId)
  moduleId?: string,             // ⭐ ID del módulo al que pertenece
  videoIds: string[],            // Lista de IDs de videos incluidos
  price: number,                 // Precio pagado
  paymentMethod: "paypal" | "mercadopago",
  paymentId: string,             // ID de la transacción
  status: "completed" | "pending" | "failed" | "refunded",
  purchaseDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Mapeo de Módulos y Videos

Los videos están organizados por módulos en el controlador:

```typescript
const MODULE_VIDEOS: Record<string, string[]> = {
  "1": ["SChqnZyrKW0", "r6EW-dOnGnE", "rhGlmpg4oN0", "MnIbkkDcUB4"],
  "2": ["WVVLAaSW3zY", "jAEnhMx7F4U", "Wzrr1rkU4W0", "6sBnx-6d3xk"],
  "3": ["Q-KKbWLolOs", "NW8GxgmQ3XQ", "KgTKhLOvVKo", "3vStaXhFcEk"],
  "4": ["7jXNVQMPemA", "gVrUec6AgTU", "ruG_C22Cfmk", "JndO50InEQM"],
};
```

## Ejemplos de Compras

### Ejemplo 1: Compra de Video Individual

Cuando un usuario compra **el video 1 del módulo 1** (ID: `SChqnZyrKW0`):

```json
{
  "_id": "68f8daf20b4691e80197b9a7",
  "userId": "68f822423a12fc386fd8c6c7",
  "purchaseType": "video",
  "itemId": "SChqnZyrKW0",
  "moduleId": "1", // ⭐ Ahora se guarda el módulo
  "videoIds": ["SChqnZyrKW0"],
  "price": 500,
  "paymentMethod": "paypal",
  "paymentId": "32B60843MN484951L",
  "status": "completed",
  "purchaseDate": "2025-10-22T13:24:02.016Z"
}
```

**Cómo sabemos que es el video 1 del módulo 1:**

- `moduleId: "1"` → nos dice que pertenece al módulo 1
- `itemId: "SChqnZyrKW0"` → es el ID del video específico
- Consultando `MODULE_VIDEOS["1"][0]` → confirmamos que es el primer video

### Ejemplo 2: Compra de Módulo Completo

Cuando un usuario compra **el módulo 2 completo**:

```json
{
  "_id": "68f8daf20b4691e80197b9a8",
  "userId": "68f822423a12fc386fd8c6c7",
  "purchaseType": "module",
  "itemId": "2",
  "moduleId": "2",
  "videoIds": ["WVVLAaSW3zY", "jAEnhMx7F4U", "Wzrr1rkU4W0", "6sBnx-6d3xk"],
  "price": 1500,
  "paymentMethod": "mercadopago",
  "paymentId": "12345678",
  "status": "completed",
  "purchaseDate": "2025-10-22T14:00:00.000Z"
}
```

## API Endpoints

### 1. Obtener todos los videos a los que tiene acceso un usuario

```http
GET /api/v1/user/video-access
Authorization: Bearer <token>
```

**Respuesta:**

```json
{
  "videoIds": ["SChqnZyrKW0", "r6EW-dOnGnE", "WVVLAaSW3zY"]
}
```

### 2. Verificar acceso a un video específico

```http
GET /api/v1/user/check-video/:videoId
Authorization: Bearer <token>
```

**Respuesta:**

```json
{
  "hasAccess": true
}
```

### 3. Verificar acceso a un módulo completo

```http
GET /api/v1/user/check-module/:moduleId
Authorization: Bearer <token>
```

**Respuesta:**

```json
{
  "hasAccess": true
}
```

### 4. Obtener todos los módulos del usuario

```http
GET /api/v1/user/modules
Authorization: Bearer <token>
```

**Respuesta:**

```json
{
  "moduleIds": ["1", "2", "3"]
}
```

### 5. Obtener videos de un módulo específico

```http
GET /api/v1/user/videos-in-module/:moduleId
Authorization: Bearer <token>
```

**Respuesta:**

```json
{
  "moduleId": "1",
  "videoIds": ["SChqnZyrKW0", "r6EW-dOnGnE", "rhGlmpg4oN0"]
}
```

### 6. Obtener resumen completo de compras ⭐ RECOMENDADO

```http
GET /api/v1/user/purchases-summary
Authorization: Bearer <token>
```

**Respuesta:**

```json
{
  "modulesPurchased": ["2"], // Módulos completos comprados
  "videosByModule": {
    // Videos agrupados por módulo
    "1": ["SChqnZyrKW0", "r6EW-dOnGnE"],
    "2": ["WVVLAaSW3zY", "jAEnhMx7F4U", "Wzrr1rkU4W0", "6sBnx-6d3xk"]
  },
  "totalVideosAccess": [
    // Todos los videos (sin duplicados)
    "SChqnZyrKW0",
    "r6EW-dOnGnE",
    "WVVLAaSW3zY",
    "jAEnhMx7F4U",
    "Wzrr1rkU4W0",
    "6sBnx-6d3xk"
  ]
}
```

## Consultas en Base de Datos

### Encontrar todos los videos de un usuario en un módulo específico

```javascript
db.videopurchases.find({
  userId: ObjectId("68f822423a12fc386fd8c6c7"),
  moduleId: "1",
  status: "completed",
});
```

### Encontrar qué usuarios compraron un video específico

```javascript
db.videopurchases.find({
  videoIds: "SChqnZyrKW0",
  status: "completed",
});
```

### Encontrar todos los módulos que compró un usuario

```javascript
db.videopurchases
  .find({
    userId: ObjectId("68f822423a12fc386fd8c6c7"),
    status: "completed",
    moduleId: { $exists: true, $ne: null },
  })
  .distinct("moduleId");
```

## Función Helper

La función `findModuleByVideoId()` permite encontrar a qué módulo pertenece un video:

```typescript
const moduleId = findModuleByVideoId("SChqnZyrKW0");
// Retorna: "1"
```

## Flujo de Compra

1. Usuario selecciona un video o módulo para comprar
2. Se valida que no haya comprado ya ese item
3. Se procesa el pago (PayPal o MercadoPago)
4. Al capturar el pago:
   - Si es **video individual**: Se busca el módulo con `findModuleByVideoId()`
   - Si es **módulo completo**: Se usa el `moduleId` directamente
5. Se crea el registro de compra con `moduleId` incluido
6. Usuario puede consultar sus compras mediante los endpoints

## Ventajas del Sistema Actual

✅ **Trazabilidad completa**: Cada compra tiene `moduleId` registrado
✅ **Consultas eficientes**: Puedes buscar por usuario, módulo, o video
✅ **Flexible**: Soporta compra individual y por módulos
✅ **Auditoria**: Registro completo con fecha, precio y método de pago
✅ **Sin duplicados**: El sistema previene compras duplicadas

## Mejoras Futuras Recomendadas

- [ ] Agregar índices en MongoDB para `userId + moduleId`
- [ ] Implementar cache para consultas frecuentes
- [ ] Agregar endpoint para exportar historial de compras
- [ ] Implementar sistema de reembolsos
- [ ] Agregar analytics de compras por módulo
