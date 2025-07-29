# ☕️ Cafe-Cerca — Backend

API backend para el proyecto **Cafe-Cerca**, desarrollada en Node.js con Express, Sequelize ORM y MySQL.  
Permite gestionar la base de datos del proyecto y exponer endpoints REST para el frontend.

## 🚀 Requisitos previos

✅ [Node.js](https://nodejs.org/) (LTS recomendado, mínimo v20.x)  
✅ [MySQL](https://dev.mysql.com/downloads/installer/) (8.x)  
✅ [Git](https://git-scm.com/) (opcional, para clonar el repositorio)

## 🛠 Instalación

Clonar el repositorio y entrar al directorio del backend:

```bash
git clone https://github.com/bekermanmatias/Cafe-Cerca.git
cd Cafe-Cerca/backend
```

Instalar las dependencias del proyecto:

```bash
npm install
```

## ⚙️ Configuración

### 1. Variables de entorno

Crear un archivo `.env` en la raíz del proyecto backend:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=3307
DB_NAME=cafecercadb
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña

# Servidor
PORT=3000
NODE_ENV=development

# MySQL Path (si es necesario)
MYSQL_PATH=/usr/local/mysql/bin
```

### 2. Configurar PATH de MySQL (Windows)

Si tenés problemas con MySQL, agregá la ruta a las variables de entorno:

```
C:\Program Files\MySQL\MySQL Server 8.0\bin
```

## 🗄️ Base de datos

### Crear la base de datos

Conectarse a MySQL y crear la base de datos:

```sql
CREATE DATABASE cafecercadb;
USE cafecercadb;
```

### Migraciones

El proyecto usa Sequelize CLI para manejar las migraciones. Las migraciones se ejecutan automáticamente al iniciar el servidor por primera vez o cuando hay cambios pendientes.

Si necesitas ejecutar las migraciones manualmente:

```bash
npx sequelize-cli db:migrate
```

Para revertir la última migración:
```bash
npx sequelize-cli db:migrate:undo
```

Para revertir todas las migraciones:
```bash
npx sequelize-cli db:migrate:undo:all
```

### Estructura de tablas principales:

- **Users** - Gestión de usuarios del sistema
- **Cafes** - Información de las cafeterías
- **Visitas** - Visitas y calificaciones
- **Comentarios** - Comentarios en las visitas
- **Likes** - Likes en las visitas
- **SavedCafes** - Cafeterías guardadas por usuarios

## 🔍 Probar conexión

Para verificar que la conexión a la base de datos funciona correctamente:

```bash
npm run test-db
```

O iniciar el servidor y verificar en los logs:

```bash
npm run dev
```

Deberías ver los siguientes mensajes:
- `✅ Conexión a MySQL establecida correctamente`
- `✅ Base de datos inicializada correctamente`
- `✅ Migraciones completadas exitosamente` (si había migraciones pendientes)

## 🚀 Correr el servidor

### Modo desarrollo:

```bash
npm run dev
```

### Modo producción:

```bash
npm start
```

El servidor correrá en `http://localhost:3000` por defecto.

## 🧪 Api-tester

Abrir con tu navegador predeterminado el archivo **api-tester.html** para probar las conexiones servidor-db.