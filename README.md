# Café Cerca
**Trabajo Final - Aplicaciones Móviles UTN FRLP**

Una aplicación móvil para descubrir y explorar las mejores cafeterías cercanas. Desarrollada con React Native, Node.js y MySQL.

Ejemplo de Café Cerca funcionado https://youtu.be/Lvv-yJC69rc 

##  Integrantes del Proyecto 

- Borda Lucio
- Borda Patricio
- Rau Bekerman Matias

---

##  Características Principales

- **Ubicaciones cercanas**: Encuentra cafeterías cerca de tu ubicación
- **Reseñas auténticas**: Lee y escribe reseñas de otros usuarios
- **Guarda tus favoritos**: Marca tus cafeterías preferidas
- **Visitas compartidas**: Organiza visitas con amigos
- **Interfaz intuitiva**: Diseño moderno y fácil de usar
- **Autenticación segura**: Sistema de login y registro

---

## Tecnologías Utilizadas

### Frontend
- **React Native** - Framework móvil
- **Expo** - Plataforma de desarrollo
- **TypeScript** - Tipado estático
- **React Navigation** - Navegación
- **AsyncStorage** - Almacenamiento local

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **Sequelize** - ORM para MySQL
- **JWT** - Autenticación
- **Multer** - Manejo de archivos
- **Cloudinary** - Almacenamiento de imágenes

### Base de Datos
- **MySQL** - Base de datos principal
- **Railway** - Hosting de base de datos

---

## Prerrequisitos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior)
- **npm** o **yarn**
- **Expo CLI**: `npm install -g @expo/cli`
- **Docker** (opcional, para base de datos local)
- **Git**

---

## Configuración del Proyecto

### 1. Clonar el Repositorio

```bash
git clone https://github.com/bekermanmatias/Cafe-Cerca.git
cd Cafe-Cerca
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la carpeta `backend/` con el siguiente contenido:

```env
# Configuración del servidor
PORT=3000
NODE_ENV=development

# Configuración de la base de datos local (docker)
DB_HOST=localhost
DB_PORT=3307
DB_USER=cafecercauser
DB_PASSWORD=cafepass
DB_NAME=cafecercadb

# Configuración de Railway, poner true o false, false requiere la conexion a docker en local
USE_RAILWAY=true
MYSQL_DATABASE=railway
MYSQL_ROOT_PASSWORD=viYUJFkHnWYkLiwVxMjQFVyvIkJDQOfR
MYSQLUSER=root

# URL del frontend (ajusta según tu configuración)
FRONTEND_URL=http://localhost:8081

# Cloudinary
CLOUDINARY_CLOUD_NAME=dpzhs3vyi
CLOUDINARY_API_KEY=628493794579291
CLOUDINARY_API_SECRET=JNuL24WyMslhIHYq-IKHwlFUqnE

# JWT para autenticación
JWT_SECRET=tu_secreto_jwt_super_seguro
```

### 3. Instalar Dependencias

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

---

## Configuración de la Base de Datos

### Opción 1: Usar Railway (Recomendado)

1. La aplicación está configurada para usar Railway por defecto
2. Asegúrate de que `USE_RAILWAY=true` en el archivo `.env`
3. Las credenciales de Railway ya están configuradas

### Opción 2: Base de Datos Local con Docker

1. Cambia `USE_RAILWAY=false` en el archivo `.env`
2. Ejecuta el contenedor de MySQL:

```bash
cd backend
docker-compose up -d
```

3. Ejecuta las migraciones:

```bash
npm run migrate
```

---

## Ejecutar la Aplicación

### 1. Iniciar el Backend

```bash
cd backend
npm run dev
```

El servidor se ejecutará en `http://localhost:3000`

### 2. Iniciar el Frontend

```bash
cd frontend
npx expo start
```

Esto abrirá Expo DevTools en tu navegador. Puedes:
- Escanear el código QR con la app Expo Go en tu dispositivo móvil
- Presionar `w` para abrir en web

---

## Estructura del Proyecto

```
Cafe-Cerca/
├── backend/                 # Servidor Node.js
│   ├── src/
│   │   ├── controllers/     # Controladores de la API
│   │   ├── models/         # Modelos de Sequelize
│   │   ├── routes/         # Rutas de la API
│   │   ├── middleware/     # Middlewares
│   │   └── config/         # Configuración
│   ├── migrations/         # Migraciones de la base de datos
│   └── uploads/           # Archivos subidos
├── frontend/               # Aplicación React Native
│   ├── app/               # Pantallas de la aplicación
│   ├── components/        # Componentes reutilizables
│   ├── services/          # Servicios de API
│   ├── context/           # Contexto de React
│   └── utils/             # Utilidades
└── README.md
```

---

## Scripts Disponibles

### Backend
```bash
npm run dev          # Ejecutar en modo desarrollo
npm run start        # Ejecutar en modo producción
npm run migrate      # Ejecutar migraciones
npm run migrate:undo # Deshacer última migración
npm run migrate:undo:all # Deshacer todas las migraciones
```

### Frontend
```bash
npm start            # Iniciar Expo
npm run android      # Ejecutar en Android
npm run ios          # Ejecutar en iOS
npm run web          # Ejecutar en web
```

---

## Endpoints de la API

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `PUT /api/auth/profile-image` - Actualizar imagen de perfil

### Cafeterías
- `GET /api/cafes` - Obtener todas las cafeterías (con filtros opcionales)
- `GET /api/cafes/:id` - Obtener cafetería específica
- `POST /api/cafes` - Crear nueva cafetería
- `PUT /api/cafes/:id` - Actualizar cafetería
- `DELETE /api/cafes/:id` - Eliminar cafetería
- `GET /api/cafes/nearby` - Obtener cafeterías cercanas
- `POST /api/cafes/:id/etiquetas` - Asignar etiquetas a cafetería
- `PUT /api/cafes/:id/etiquetas` - Agregar etiquetas a cafetería
- `DELETE /api/cafes/:id/etiquetas/:etiquetaId` - Quitar etiqueta de cafetería

### Visitas
- `GET /api/visitas` - Obtener todas las visitas
- `GET /api/visitas/:id` - Obtener visita específica
- `POST /api/visitas` - Crear nueva visita (individual o compartida)
- `PUT /api/visitas/:id` - Actualizar visita
- `DELETE /api/visitas/:id` - Eliminar visita
- `GET /api/visitas/user/:userId` - Obtener visitas de un usuario
- `GET /api/visitas/diary/:userId` - Obtener diario de visitas del usuario

### Likes
- `POST /api/likes/toggle/:visitaId` - Toggle like en visita
- `GET /api/likes/status/:visitaId` - Obtener estado de like
- `GET /api/likes` - Obtener visitas con like del usuario

### Cafeterías Guardadas
- `POST /api/saved-cafes/toggle/:cafeId` - Toggle guardar cafetería
- `GET /api/saved-cafes/status/:cafeId` - Obtener estado de guardado
- `GET /api/saved-cafes` - Obtener cafeterías guardadas del usuario

### Reseñas
- `POST /api/resenas` - Crear reseña para visita
- `GET /api/resenas/visita/:visitaId` - Obtener reseñas de una visita
- `GET /api/resenas/user/:usuarioId` - Obtener reseñas de un usuario
- `PUT /api/resenas/:resenaId` - Actualizar reseña
- `DELETE /api/resenas/:resenaId` - Eliminar reseña

### Comentarios
- `GET /api/comentarios/visita/:visitaId` - Obtener comentarios de visita
- `POST /api/comentarios/visita/:visitaId` - Crear comentario
- `PUT /api/comentarios/:id` - Actualizar comentario
- `DELETE /api/comentarios/:id` - Eliminar comentario

### Amigos
- `POST /api/amigos/solicitud` - Enviar solicitud de amistad
- `PUT /api/amigos/solicitud/:solicitudId` - Responder solicitud (aceptar/rechazar)
- `DELETE /api/amigos/amistad` - Eliminar amistad
- `GET /api/amigos` - Obtener lista de amigos
- `GET /api/amigos/solicitudes/recibidas` - Obtener solicitudes recibidas
- `GET /api/amigos/solicitudes/enviadas` - Obtener solicitudes enviadas
- `DELETE /api/amigos/solicitud/:solicitudId/cancelar` - Cancelar solicitud enviada

### Etiquetas
- `GET /api/etiquetas` - Obtener todas las etiquetas activas
- `GET /api/etiquetas/:id` - Obtener etiqueta específica
- `POST /api/etiquetas` - Crear nueva etiqueta
- `PUT /api/etiquetas/:id` - Actualizar etiqueta
- `DELETE /api/etiquetas/:id` - Eliminar/desactivar etiqueta
- `PUT /api/etiquetas/:id/restaurar` - Reactivar etiqueta

### Usuarios
- `GET /api/users/search` - Buscar usuarios
- `GET /api/users/:id` - Obtener usuario específico
- `PUT /api/users/:id` - Actualizar perfil de usuario
- `PUT /api/users/:id/password` - Cambiar contraseña
- `DELETE /api/users/:id` - Eliminar cuenta

### Participantes de Visitas
- `POST /api/visita-participantes/:visitaId/invitar` - Invitar usuarios a visita
- `PUT /api/visita-participantes/:visitaId/responder` - Responder invitación
- `POST /api/visita-participantes/:visitaId/aceptar-con-resena` - Aceptar invitación con reseña
- `GET /api/visita-participantes/invitaciones` - Obtener invitaciones pendientes
- `GET /api/visita-participantes/:visitaId/participantes` - Obtener participantes de visita
- `DELETE /api/visita-participantes/:visitaId/participantes/:usuarioId` - Remover participante

### Estadísticas
- `GET /api/estadisticas/usuario/:usuarioId` - Obtener estadísticas del usuario

---

## Solución de Problemas

### Error de Conexión a la Base de Datos
1. Verifica que `USE_RAILWAY=true` en el `.env`
2. Asegúrate de que las credenciales de Railway sean correctas
3. Si usas base de datos local, verifica que Docker esté ejecutándose

### Error en el Frontend
1. Verifica que el backend esté ejecutándose en el puerto 3000
2. Revisa la configuración de `API_URL` en `frontend/constants/Config.ts`
3. Asegúrate de que todas las dependencias estén instaladas

### Error de Migraciones
```bash
cd backend
npm run migrate:undo:all
npm run migrate
```

---

## Notas de Desarrollo

- La aplicación usa **Railway** como base de datos principal
- Las imágenes se almacenan en **Cloudinary**
- La autenticación se maneja con **JWT**
- El frontend está optimizado para **React Native** con **Expo**

---

## Mejoras Futuras

### Funcionalidades Pendientes

#### Gestión de Imágenes
- **Múltiples formatos de imagen**: Actualmente solo se aceptan imágenes 1:1 (cuadradas). Se podría implementar soporte para diferentes proporciones (16:9, 4:3, etc.)
- **Compresión inteligente**: Optimizar automáticamente las imágenes antes de subirlas para mejorar el rendimiento
- Múltiples imágenes por cafetería
- **Filtros y edición**: Agregar herramientas básicas de edición de fotos

#### Sistema de Comentarios
- **Respuestas anidadas**: Implementar sistema de respuestas a comentarios (threading)
- **Notificaciones de comentarios**: Alertas cuando alguien comenta en tus visitas
- **Moderación de comentarios**: Sistema de reportes y moderación automática
- **Reacciones**: Emojis y reacciones a comentarios

#### Experiencia de Usuario
- **Modo offline**: Funcionalidad básica sin conexión a internet
- **Temas personalizables**: Múltiples temas de color (oscuro, claro, automático)
- **Animaciones mejoradas**: Transiciones más fluidas y micro-interacciones

#### Funcionalidades Técnicas
- **Push notifications**: Notificaciones push para invitarte a cafeterias o si estas sobre una, invitarte a subir tu Visita
- **Filtos**: Filtrado avanzado de cafeterias, para encontrar la ideal

#### Seguridad
- **Verificación de dos factores**: Autenticación adicional
- **Privacidad granular**: Control detallado sobre qué información compartir
- **Backup automático**: Respaldo automático de datos importantes

#### Integraciones Externas
- **Redes sociales**: Compartir visitas en Instagram, Facebook, etc.

---

### Muchas Gracias!
