# Taskly

A full-stack Kanban board application built for portfolio purposes. Manage projects visually with boards, columns, and draggable task cards.

**[Live Demo](#)** · **[Report Bug](https://github.com/joakol119/Taskly/issues)**

---

## Screenshot

> _Add a screenshot of the app here_

---

## Features

- 🗂️ **Boards** — Create, rename, reorder and color-code your project boards
- 📋 **Columns** — Organize tasks in customizable columns with inline renaming
- 🎯 **Drag & Drop** — Move tasks between columns and reorder boards intuitively
- 🏷️ **Labels** — Color-coded labels to categorize and prioritize tasks
- 📅 **Due Dates** — Set deadlines with visual alerts (overdue, due today, upcoming)
- 👥 **Team Collaboration** — Invite members to boards by email
- 🌙 **Dark / Light Mode** — Fully themed UI with persistent preference
- 🔐 **Authentication** — JWT-based login and registration

---

## Tech Stack

**Frontend**
- [Next.js 14](https://nextjs.org/) — React framework with App Router
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first styling
- [@hello-pangea/dnd](https://github.com/hello-pangea/dnd) — Drag and drop

**Backend**
- [Node.js](https://nodejs.org/) + [Express](https://expressjs.com/) — REST API
- [PostgreSQL](https://www.postgresql.org/) — Relational database
- [`pg`](https://node-postgres.com/) — Raw SQL queries (no ORM)
- [JWT](https://jwt.io/) — Stateless authentication

**Infrastructure**
- [Docker](https://www.docker.com/) — Local development environment
- [Vercel](https://vercel.com/) — Frontend deployment
- [Railway](https://railway.app/) — Backend + database deployment

---

## Getting Started

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/joakol119/Taskly.git
   cd Taskly
   ```

2. Create a `.env` file in the root (see `.env.example`)

3. Start the application
   ```bash
   docker compose up --build
   ```

4. Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
# Database
POSTGRES_USER=taskly
POSTGRES_PASSWORD=your_password
POSTGRES_DB=taskly

# Backend
JWT_SECRET=your_jwt_secret

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login and get JWT token |
| GET | `/boards` | Get all boards for current user |
| POST | `/boards` | Create a new board |
| PATCH | `/boards/reorder` | Reorder boards |
| GET | `/boards/:id` | Get board with columns and tasks |
| PATCH | `/boards/:id` | Rename or update board color |
| DELETE | `/boards/:id` | Delete a board |
| POST | `/boards/:id/duplicate` | Duplicate a board |
| POST | `/boards/:id/members` | Invite a member by email |
| POST | `/columns` | Create a column |
| PATCH | `/columns/:id` | Rename a column |
| DELETE | `/columns/:id` | Delete a column |
| POST | `/tasks` | Create a task |
| PATCH | `/tasks/:id` | Update task (title, description, labels, due date) |
| PATCH | `/tasks/:id/move` | Move task to another column |
| DELETE | `/tasks/:id` | Delete a task |

---

## Project Structure

```
taskly/
├── backend/
│   └── src/
│       ├── middleware/     # JWT auth middleware
│       ├── routes/         # Express route handlers
│       ├── db.js           # PostgreSQL connection
│       └── index.js        # Express app entry point
├── frontend/
│   └── src/
│       ├── app/            # Next.js App Router pages
│       │   ├── page.js         # Landing page
│       │   ├── login/          # Auth page
│       │   └── boards/         # Board pages
│       ├── components/     # Reusable components
│       └── lib/            # API client, theme utils
├── docker-compose.yml
└── README.md
```

---

## Author

**Joaquín Poblete**
- GitHub: [@joakol119](https://github.com/joakol119)
- LinkedIn: [linkedin.com/in/tu-perfil](https://linkedin.com/in/)

---

## License

This project is open source and available under the [MIT License](LICENSE).
