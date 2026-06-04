# KennaWaq Choir Website

A full-stack music ministry platform for KennaWaq Choir, built with React, Node.js + Express, MySQL, and Cloudinary.

## Project Structure

```
kennawaq-choir-website/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── api/             # Axios instance with interceptors
│   │   ├── components/      # Shared UI components (Navbar, Footer, AudioPlayer, …)
│   │   ├── contexts/        # AudioPlayerContext, AuthContext
│   │   ├── i18n/            # i18next setup + English / Amharic translations
│   │   ├── pages/           # Public pages + Admin panel pages
│   │   └── types/           # Shared TypeScript interfaces
│   ├── index.html
│   ├── vite.config.ts       # Vite config — proxies /api → http://localhost:5000
│   └── package.json
│
├── server/                  # Node.js + Express API
│   ├── src/
│   │   ├── index.ts         # Express app entry point
│   │   ├── db.ts            # mysql2 connection pool
│   │   ├── types.ts         # Shared TypeScript interfaces
│   │   ├── middleware/
│   │   │   └── auth.ts      # authenticateJWT middleware
│   │   ├── routes/          # Route handlers (auth, songs, events, …)
│   │   └── services/        # Business logic (dailyWorship, search, cloudinary)
│   ├── tsconfig.json
│   └── package.json
│
└── README.md
```

## Design

- **Theme**: White + Gold (`#FFD700`) on Dark Navy (`#1a1a2e`)
- **Font**: Inter (body), Playfair Display (headings)
- **Animations**: Framer Motion
- **i18n**: English + Amharic (አማርኛ)

## Getting Started

### Prerequisites

- Node.js 20+
- MySQL 8+
- A [Cloudinary](https://cloudinary.com) account (free tier works)

### 1. Clone and install dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure environment variables

```bash
# Server
cp server/.env.example server/.env
# Edit server/.env with your DB credentials, JWT secret, and Cloudinary keys

# Client
cp client/.env.example client/.env
```

### 3. Set up the database

```bash
# Run the migration script (created in Task 2)
mysql -u root -p < server/src/db/schema.sql
```

### 4. Start development servers

```bash
# Terminal 1 — API server (port 5000)
cd server
npm run dev

# Terminal 2 — React dev server (port 5173)
cd client
npm run dev
```

The client dev server proxies all `/api` requests to `http://localhost:5000`, so no CORS issues during development.

### 5. Run tests

```bash
# Server tests (Jest + fast-check)
cd server
npm test

# Client tests (Vitest + fast-check)
cd client
npm test
```

## API Overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | — | Admin login → JWT |
| GET | `/api/songs` | — | List songs (`?category=`, `?q=`) |
| GET | `/api/songs/daily-worship` | — | Today's featured worship song |
| GET | `/api/events` | — | List events (`?q=`) |
| GET | `/api/members` | — | List active members |
| GET | `/api/gallery` | — | List gallery items (`?album=`) |
| GET | `/api/gallery/albums` | — | List album names |
| GET | `/api/search` | — | Search (`?q=&type=songs\|events\|all`) |
| POST | `/api/contact` | — | Submit contact form |
| POST | `/api/join` | — | Submit join application |
| GET | `/api/about` | — | Fetch about page content |

Admin endpoints (require `Authorization: Bearer <token>`):

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/songs` | Create song (multipart) |
| PUT | `/api/songs/:id` | Update song |
| DELETE | `/api/songs/:id` | Delete song + Cloudinary asset |
| POST | `/api/events` | Create event |
| PUT | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Delete event (cascades gallery items) |
| POST | `/api/members` | Create member (multipart) |
| PUT | `/api/members/:id` | Update member |
| DELETE | `/api/members/:id` | Delete member + Cloudinary image |
| POST | `/api/gallery` | Upload gallery item (multipart) |
| PUT | `/api/gallery/:id` | Update gallery item |
| DELETE | `/api/gallery/:id` | Delete gallery item + Cloudinary asset |
| DELETE | `/api/gallery/albums/:albumName` | Delete album + all items |
| PUT | `/api/about` | Update about page content |

## Architecture Notes

- **Audio Player persistence**: `<AudioPlayer>` is rendered outside `<Routes>` in `App.tsx`, so it survives React Router navigations without interrupting playback.
- **Daily Worship Song**: Deterministic algorithm — `pool[floor(nowUtcMs / 86_400_000) % pool.length]`. No cron job needed.
- **Media storage**: All binary assets (audio, images, video) are stored in Cloudinary. The database stores only the returned CDN URL.
- **Security**: All DB queries use `mysql2` parameterized statements. Admin passwords are bcrypt-hashed (cost factor ≥ 12). JWTs expire after 24 hours.
- **Search**: MySQL FULLTEXT indexes on `songs(title, category)` and `events(title, location, description)` keep queries under 500 ms for up to 10,000 records.
