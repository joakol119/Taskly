# Taskly

Gestor de tareas colaborativo estilo Trello. Creá tableros, columnas y tareas, y reorganizalas con drag & drop.

## Stack

- **Backend**: Node.js + Express + Prisma ORM
- **Frontend**: Next.js 14 (App Router)
- **Base de datos**: PostgreSQL
- **Auth**: JWT
- **Entorno**: Docker Compose

## Levantar el proyecto

```bash
git clone <repo-url>
cd taskly
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## Funcionalidades

- ✅ Registro e inicio de sesión con JWT
- ✅ Crear, listar y eliminar tableros
- ✅ Crear y eliminar columnas
- ✅ Crear, mover y eliminar tareas
- ✅ Drag & drop para reorganizar tareas entre columnas

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/register` | Registro de usuario |
| POST | `/auth/login` | Login |
| GET | `/boards` | Listar tableros |
| POST | `/boards` | Crear tablero |
| GET | `/boards/:id` | Detalle de tablero |
| DELETE | `/boards/:id` | Eliminar tablero |
| POST | `/columns` | Crear columna |
| DELETE | `/columns/:id` | Eliminar columna |
| POST | `/tasks` | Crear tarea |
| PATCH | `/tasks/:id/move` | Mover tarea |
| DELETE | `/tasks/:id` | Eliminar tarea |
