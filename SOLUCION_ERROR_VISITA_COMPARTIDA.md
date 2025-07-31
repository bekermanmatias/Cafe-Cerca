# Solución al Error "Error al crear la visita compartida"

## Problema Identificado

El error "Error al crear la visita compartida" puede tener varias causas. He implementado mejoras en el código para identificar y resolver estos problemas.

## Cambios Realizados

### 1. Frontend (`frontend/app/add-visit.tsx`)

**Mejoras en el manejo de errores:**
- Agregado logging detallado para debugging
- Mejor manejo de errores específicos (conexión, autenticación, validación)
- Validación mejorada de campos antes de enviar la petición

**Mejoras en la creación del FormData:**
- Verificación de que las imágenes existan antes de agregarlas
- Mejor estructuración de los datos enviados

### 2. Servicio de API (`frontend/services/api.ts`)

**Mejoras en `crearVisitaCompartida`:**
- Logging detallado de la petición y respuesta
- Mejor manejo de errores de red y servidor
- Verificación del contenido del FormData antes del envío

### 3. Backend (`backend/src/controllers/visitaCompartida.controller.js`)

**Mejoras en validación:**
- Validación de campos requeridos (cafeteriaId, comentario, calificacion)
- Logging detallado en cada paso del proceso
- Mejor manejo de transacciones con rollback seguro

**Mejoras en el manejo de errores:**
- Logging del stack trace completo
- Información de debugging en modo desarrollo
- Manejo seguro de rollback de transacciones

### 4. Middleware de Autenticación (`backend/src/middleware/auth.middleware.js`)

**Mejoras en verificación de tokens:**
- Logging de headers recibidos
- Verificación detallada del proceso de autenticación

## Posibles Causas del Error

### 1. Problemas de Autenticación
- Token expirado o inválido
- Headers de autorización mal formados

### 2. Problemas de Validación
- Campos requeridos faltantes
- Valores fuera de rango (calificación, maxParticipantes)
- IDs de amigos inválidos o no confirmados

### 3. Problemas de Base de Datos
- Cafetería no encontrada
- Relaciones de amistad no confirmadas
- Errores en transacciones

### 4. Problemas de Red
- Conexión al servidor interrumpida
- Timeout en la petición

## Cómo Debuggear

### 1. Verificar Logs del Backend
```bash
# En el directorio backend
npm start
# Observar los logs en la consola cuando se intente crear una visita compartida
```

### 2. Verificar Logs del Frontend
- Abrir las herramientas de desarrollador en el navegador
- Ir a la pestaña Console
- Intentar crear una visita compartida y observar los logs

### 3. Usar el Script de Prueba
```bash
# En el directorio backend
node test-visita-compartida.js
```

## Pasos para Resolver

### 1. Verificar que el Backend esté Corriendo
```bash
cd backend
npm start
```

### 2. Verificar Variables de Entorno
Asegúrate de que el archivo `.env` en el backend tenga:
- `JWT_SECRET`
- Variables de Cloudinary (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)
- Variables de base de datos

### 3. Verificar Base de Datos
- Asegúrate de que las tablas estén creadas correctamente
- Verifica que existan cafeterías y usuarios en la base de datos
- Verifica que las relaciones de amistad estén confirmadas

### 4. Verificar Conexión Frontend-Backend
- Asegúrate de que la URL de la API en `frontend/constants/Config.ts` sea correcta
- Verifica que no haya problemas de CORS

## Comandos Útiles

### Reiniciar el Backend
```bash
cd backend
npm start
```

### Verificar Estado de la Base de Datos
```bash
cd backend
npm run db:status
```

### Ejecutar Migraciones
```bash
cd backend
npm run db:migrate
```

## Contacto

Si el problema persiste después de aplicar estas soluciones, revisa los logs detallados que ahora se generan para identificar la causa específica del error. 