# Visitas Compartidas - Documentación de API

## Descripción
Las visitas compartidas permiten que múltiples usuarios (hasta 10) puedan participar en una misma visita a una cafetería. El sistema maneja invitaciones, aceptaciones y rechazos automáticamente.

## Endpoints Disponibles

### 1. Crear Visita Compartida
**POST** `/api/visitas-compartidas`

Crea una nueva visita compartida e invita automáticamente a los amigos seleccionados.

**Headers requeridos:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body (form-data):**
- `cafeteriaId` (number): ID de la cafetería
- `comentario` (string, opcional): Comentario sobre la visita
- `calificacion` (number, 1-5): Calificación de la visita
- `amigosIds` (array): Array de IDs de amigos a invitar
- `maxParticipantes` (number, opcional, default: 10): Máximo número de participantes
- `imagenes` (files, opcional): Hasta 5 imágenes

**Ejemplo de respuesta:**
```json
{
  "mensaje": "Visita compartida creada exitosamente",
  "visita": {
    "id": 1,
    "usuarioId": 1,
    "cafeteriaId": 1,
    "comentario": "¡Excelente café!",
    "calificacion": 5,
    "esCompartida": true,
    "maxParticipantes": 10,
    "fecha": "2024-01-01T12:00:00.000Z",
    "cafeteria": { ... },
    "usuario": { ... },
    "participantes": [
      {
        "id": 1,
        "usuarioId": 1,
        "rol": "creador",
        "estado": "aceptada",
        "usuario": { ... }
      },
      {
        "id": 2,
        "usuarioId": 2,
        "rol": "participante",
        "estado": "pendiente",
        "usuario": { ... }
      }
    ]
  }
}
```

### 2. Responder a Invitación
**PUT** `/api/visitas-compartidas/:visitaId/respuesta`

Permite a un usuario aceptar o rechazar una invitación a una visita compartida.

**Headers requeridos:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "respuesta": "aceptada" // o "rechazada"
}
```

**Ejemplo de respuesta:**
```json
{
  "mensaje": "Invitación aceptada exitosamente",
  "invitacion": {
    "id": 2,
    "visitaId": 1,
    "usuarioId": 2,
    "rol": "participante",
    "estado": "aceptada",
    "fechaRespuesta": "2024-01-01T12:30:00.000Z"
  }
}
```

### 3. Obtener Invitaciones Pendientes
**GET** `/api/visitas-compartidas/invitaciones-pendientes`

Obtiene todas las invitaciones pendientes del usuario autenticado.

**Headers requeridos:**
```
Authorization: Bearer <token>
```

**Ejemplo de respuesta:**
```json
{
  "mensaje": "Invitaciones pendientes obtenidas exitosamente",
  "totalInvitaciones": 2,
  "invitaciones": [
    {
      "id": 2,
      "visitaId": 1,
      "usuarioId": 2,
      "estado": "pendiente",
      "visita": {
        "id": 1,
        "cafeteria": { ... },
        "usuario": { ... },
        "participantes": [ ... ]
      }
    }
  ]
}
```

### 4. Obtener Mis Visitas Compartidas
**GET** `/api/visitas-compartidas/mis-visitas-compartidas`

Obtiene todas las visitas compartidas donde el usuario es participante (aceptadas).

**Headers requeridos:**
```
Authorization: Bearer <token>
```

**Ejemplo de respuesta:**
```json
{
  "mensaje": "Visitas compartidas obtenidas exitosamente",
  "totalVisitas": 3,
  "visitas": [
    {
      "id": 1,
      "visitaId": 1,
      "usuarioId": 2,
      "rol": "participante",
      "estado": "aceptada",
      "visita": {
        "id": 1,
        "esCompartida": true,
        "cafeteria": { ... },
        "usuario": { ... },
        "imagenes": [ ... ],
        "participantes": [ ... ]
      }
    }
  ]
}
```

### 5. Obtener Detalles de Visita Compartida
**GET** `/api/visitas-compartidas/:visitaId`

Obtiene los detalles completos de una visita compartida específica.

**Headers requeridos:**
```
Authorization: Bearer <token>
```

**Ejemplo de respuesta:**
```json
{
  "mensaje": "Visita compartida obtenida exitosamente",
  "visita": {
    "id": 1,
    "esCompartida": true,
    "cafeteria": { ... },
    "usuario": { ... },
    "imagenes": [ ... ],
    "participantes": [ ... ]
  },
  "miRol": "participante",
  "miEstado": "aceptada"
}
```

## Estados de Invitación

- **pendiente**: La invitación fue enviada pero aún no ha sido respondida
- **aceptada**: El usuario aceptó la invitación
- **rechazada**: El usuario rechazó la invitación

## Roles de Participante

- **creador**: El usuario que creó la visita compartida
- **participante**: Usuario invitado a la visita

## Validaciones

1. **Máximo de participantes**: Entre 1 y 10 usuarios
2. **Amigos válidos**: Solo se pueden invitar amigos con amistad confirmada
3. **Acceso**: Solo los participantes pueden ver los detalles de una visita compartida
4. **Imágenes**: Máximo 5 imágenes por visita

## Flujo de Uso Típico

1. **Usuario A** crea una visita compartida e invita a **Usuario B** y **Usuario C**
2. **Usuario B** y **Usuario C** reciben invitaciones pendientes
3. **Usuario B** acepta la invitación
4. **Usuario C** rechaza la invitación
5. Todos los participantes pueden ver la visita compartida en sus listas

## Notas Importantes

- Las visitas compartidas se distinguen de las visitas normales por el campo `esCompartida: true`
- Solo los amigos con amistad confirmada pueden ser invitados
- El creador de la visita se agrega automáticamente como participante con rol "creador"
- Las invitaciones rechazadas no se eliminan, solo cambian de estado
- Los participantes pueden ver todos los detalles de la visita, incluyendo imágenes y comentarios 