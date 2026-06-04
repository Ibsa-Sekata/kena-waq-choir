# Design Document — KennaWaq Choir Website

## Overview

KennaWaq Choir Website is a full-stack music ministry platform built with React (frontend), Node.js + Express (backend), MySQL (database), and Cloudinary (media storage). The system has two distinct surfaces:

1. **Public website** — seven pages (Home, Songs, Members, Events, About, Gallery, Contact/Join) with a persistent audio player.
2. **Admin Panel** — a protected single-page application for managing songs, events, members, and gallery content.

The architecture follows a classic client–server separation: the React SPA communicates with the Express REST API over HTTPS; the API reads/writes MySQL and delegates all media uploads to Cloudinary. JWT tokens (24-hour expiry, bcrypt-hashed passwords) protect every admin endpoint.

### Key Design Goals

- **Persistence without interruption** — the audio player must survive React Router navigations.
- **Media-first** — all binary assets live in Cloudinary; the database stores only URLs.
- **Daily freshness** — a deterministic daily-worship-song algorithm requires no cron job or manual intervention.
- **Search performance** — MySQL FULLTEXT indexes on songs and events keep keyword queries under 500 ms for up to 10,000 records.
- **Responsive by default** — a mobile-first CSS approach with Framer Motion animations that degrade gracefully.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (React SPA)                       │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  Public  │  │  Admin   │  │  Audio   │  │  i18n / Lang   │  │
│  │  Pages   │  │  Panel   │  │  Player  │  │  Context       │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────────────┘  │
│       │              │              │                             │
│       └──────────────┴──────────────┘                            │
│                       │ Axios / Fetch                             │
└───────────────────────┼─────────────────────────────────────────┘
                        │ HTTPS REST
┌───────────────────────▼─────────────────────────────────────────┐
│                   Node.js + Express API                           │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │  Auth    │  │  Songs   │  │  Events  │  │  Members /     │  │
│  │  Router  │  │  Router  │  │  Router  │  │  Gallery       │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬───────────┘  │
│       │              │              │              │              │
│  ┌────▼──────────────▼──────────────▼──────────────▼──────────┐ │
│  │              Service Layer (business logic)                  │ │
│  └────┬──────────────────────────────────────────┬────────────┘ │
│       │                                            │              │
│  ┌────▼──────────┐                      ┌─────────▼────────────┐ │
│  │  MySQL (mysql2│                      │  Cloudinary SDK      │ │
│  │  + pool)      │                      │  (upload / destroy)  │ │
│  └───────────────┘                      └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Routing Strategy

- React Router v6 with `<BrowserRouter>` for the public site.
- The `<AudioPlayer>` component is rendered outside the `<Routes>` tree (in `App.jsx`) so it persists across navigations.
- Admin routes are nested under `/admin` and wrapped in an `<AuthGuard>` component that checks for a valid JWT in `localStorage`.

### State Management

- **Audio Player state** — React Context (`AudioPlayerContext`) holding the current track, playlist queue, playback status, and volume. Consumed by the player bar and any "play" button across the site.
- **Auth state** — React Context (`AuthContext`) holding the JWT and admin profile. Persisted to `localStorage`.
- **Server state** — React Query (TanStack Query) for all API data fetching, caching, and invalidation.
- **Form state** — React Hook Form for all forms (contact, join, admin CRUD).

---

## Components and Interfaces

### Frontend Component Tree (Public)

```
App
├── Navbar
├── Routes
│   ├── HomePage
│   │   ├── HeroSection
│   │   ├── DailyWorshipSongCard
│   │   ├── FeaturedVideoSection
│   │   └── UpcomingEventHighlight
│   ├── SongsPage
│   │   ├── SearchBar
│   │   ├── CategoryFilter
│   │   └── SongCard (× n)
│   ├── MembersPage
│   │   └── MemberCard (× n, grouped by role)
│   ├── EventsPage
│   │   ├── UpcomingEventsSection
│   │   │   └── EventCard (× n)
│   │   └── PastEventsSection
│   │       ├── EventCard (× n)
│   │       └── PastEventsGallery
│   ├── AboutPage
│   │   ├── MissionSection
│   │   ├── VisionSection
│   │   └── HistoryTimeline
│   ├── GalleryPage
│   │   ├── AlbumSelector
│   │   ├── GalleryGrid
│   │   ├── LightboxOverlay
│   │   └── VideoModal
│   └── ContactJoinPage
│       ├── ContactForm
│       └── JoinForm
├── AudioPlayer (persistent, outside Routes)
└── Footer
```

### Frontend Component Tree (Admin)

```
AdminApp
├── AdminNavbar
└── AdminRoutes (protected by AuthGuard)
    ├── AdminLoginPage
    ├── AdminDashboard
    ├── SongManagementPage
    │   └── SongForm (create / edit)
    ├── EventManagementPage
    │   └── EventForm (create / edit)
    ├── MemberManagementPage
    │   └── MemberForm (create / edit)
    └── GalleryManagementPage
        ├── AlbumManager
        └── GalleryItemForm (upload)
```

### REST API Endpoints

#### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | — | Returns JWT on valid credentials |

#### Songs

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/songs` | — | List all published songs (supports `?category=` and `?q=` filters) |
| GET | `/api/songs/daily-worship` | — | Returns today's Daily Worship Song |
| GET | `/api/songs/:id` | — | Single song record |
| POST | `/api/songs` | Admin | Create song (multipart: audio file + metadata) |
| PUT | `/api/songs/:id` | Admin | Update song metadata |
| DELETE | `/api/songs/:id` | Admin | Delete song + Cloudinary asset |

#### Events

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/events` | — | List all events (supports `?q=` filter) |
| GET | `/api/events/:id` | — | Single event record |
| POST | `/api/events` | Admin | Create event |
| PUT | `/api/events/:id` | Admin | Update event |
| DELETE | `/api/events/:id` | Admin | Delete event + cascade gallery items |

#### Members

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/members` | — | List all active members |
| POST | `/api/members` | Admin | Create member (multipart: image + metadata) |
| PUT | `/api/members/:id` | Admin | Update member |
| DELETE | `/api/members/:id` | Admin | Delete member + Cloudinary image |

#### Gallery

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/gallery` | — | List all gallery items (supports `?album=` filter) |
| GET | `/api/gallery/albums` | — | List all album names |
| POST | `/api/gallery` | Admin | Upload gallery item (multipart: media + metadata) |
| PUT | `/api/gallery/:id` | Admin | Update caption / album |
| DELETE | `/api/gallery/:id` | Admin | Delete item + Cloudinary asset |
| DELETE | `/api/gallery/albums/:albumName` | Admin | Delete album + all items |

#### Search

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/search?q=&type=` | — | Search songs, events, or all |

#### Contact / Join

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/contact` | — | Submit contact form |
| POST | `/api/join` | — | Submit join application |

#### About

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/about` | — | Fetch about page content |
| PUT | `/api/about` | Admin | Update about page content |

---

## Data Models

### MySQL Schema

```sql
-- Admins
CREATE TABLE admins (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email       VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Songs
CREATE TABLE songs (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  audio_url     VARCHAR(512) NOT NULL,
  cloudinary_public_id VARCHAR(255) NOT NULL,
  video_url     VARCHAR(512),
  category      ENUM('worship','live','album') NOT NULL,
  download_url  VARCHAR(512),
  is_published  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FULLTEXT INDEX ft_songs (title, category)
);

-- Events
CREATE TABLE events (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title            VARCHAR(255) NOT NULL,
  event_date       DATE NOT NULL,
  location         VARCHAR(255) NOT NULL,
  description      TEXT NOT NULL,
  registration_url VARCHAR(512),
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FULLTEXT INDEX ft_events (title, location, description)
);

-- Members
CREATE TABLE members (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name                 VARCHAR(255) NOT NULL,
  role                 VARCHAR(100) NOT NULL,
  role_category        ENUM('Choir Leader','Soprano','Alto','Tenor','Bass') NOT NULL,
  image_url            VARCHAR(512) NOT NULL,
  cloudinary_public_id VARCHAR(255) NOT NULL,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gallery Albums
CREATE TABLE albums (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Gallery Items
CREATE TABLE gallery_items (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  album_id             INT UNSIGNED NOT NULL,
  media_url            VARCHAR(512) NOT NULL,
  cloudinary_public_id VARCHAR(255) NOT NULL,
  media_type           ENUM('photo','video') NOT NULL,
  caption              VARCHAR(512),
  event_id             INT UNSIGNED,
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
);

-- About Page Content
CREATE TABLE about_content (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  mission     TEXT NOT NULL,
  vision      TEXT NOT NULL,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- History Timeline Milestones
CREATE TABLE history_milestones (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  year        YEAR NOT NULL,
  description TEXT NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0
);

-- Contact Submissions
CREATE TABLE contact_submissions (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  message    TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Join Applications
CREATE TABLE join_applications (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(255) NOT NULL,
  voice_type       ENUM('Soprano','Alto','Tenor','Bass') NOT NULL,
  experience_level VARCHAR(100) NOT NULL,
  message          TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### TypeScript / JavaScript Interfaces (Frontend)

```typescript
interface Song {
  id: number;
  title: string;
  audioUrl: string;
  videoUrl?: string;
  category: 'worship' | 'live' | 'album';
  downloadUrl?: string;
  isPublished: boolean;
  createdAt: string;
}

interface Event {
  id: number;
  title: string;
  eventDate: string;       // ISO date string
  location: string;
  description: string;
  registrationUrl?: string;
  createdAt: string;
}

interface Member {
  id: number;
  name: string;
  role: string;
  roleCategory: 'Choir Leader' | 'Soprano' | 'Alto' | 'Tenor' | 'Bass';
  imageUrl: string;
  isActive: boolean;
}

interface GalleryItem {
  id: number;
  albumId: number;
  albumName: string;
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  caption?: string;
  eventId?: number;
}

interface AudioPlayerState {
  currentTrack: Song | null;
  queue: Song[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

interface SearchResult {
  songs: Song[];
  events: Event[];
}
```

### Daily Worship Song Algorithm

The algorithm is **deterministic and stateless** — no cron job, no database flag:

```
dayIndex = floor(unixTimestampUTC / 86400)   // integer day number since epoch
worshipSongs = SELECT * FROM songs WHERE category = 'worship' AND is_published = 1 ORDER BY id ASC
if worshipSongs.length == 0:
    worshipSongs = SELECT * FROM songs WHERE is_published = 1 ORDER BY id ASC
selectedSong = worshipSongs[ dayIndex % worshipSongs.length ]
```

This guarantees:
- The same song is returned for all requests on the same UTC calendar day.
- The selection rotates automatically when the date changes.
- No manual intervention is needed.
- Adding new worship songs changes future selections but not past ones.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Daily Worship Song Determinism

*For any* set of published songs and any two UTC timestamps that fall on the same calendar day, the Daily Worship Song algorithm SHALL return the same song record for both timestamps.

**Validates: Requirements 8.1, 8.2**

### Property 2: Daily Worship Song Category Preference

*For any* non-empty set of worship-category songs, the Daily Worship Song algorithm SHALL always select a song whose category is "worship" and SHALL never select a song outside that set.

**Validates: Requirements 8.3**

### Property 3: Daily Worship Song Fallback

*For any* state where the worship-category song set is empty and the total published song set is non-empty, the Daily Worship Song algorithm SHALL select a song from the total published set and SHALL return exactly one song.

**Validates: Requirements 8.4**

### Property 4: Song Search Result Correctness

*For any* keyword string `k` and any song dataset, every song returned by `Search_Service(k, 'songs')` SHALL have a title or category containing `k` (case-insensitive), and no song whose title and category both do not contain `k` SHALL appear in the result set. The result SHALL be identical whether `k` is upper-case, lower-case, or mixed-case.

**Validates: Requirements 2.3, 15.2**

### Property 5: Event Search Result Correctness

*For any* keyword string `k` and any event dataset, every event returned by `Search_Service(k, 'events')` SHALL have a title, location, or description containing `k` (case-insensitive), and no non-matching event SHALL appear in the result set.

**Validates: Requirements 15.3**

### Property 6: Combined Search Equals Union

*For any* keyword string `k`, the result set returned by `Search_Service(k, 'all')` SHALL equal the union of `Search_Service(k, 'songs')` and `Search_Service(k, 'events')`.

**Validates: Requirements 15.4**

### Property 7: Empty Keyword Returns All Records

*For any* content type parameter and any dataset, when the keyword string is empty, the Search_Service SHALL return all published records of that content type.

**Validates: Requirements 15.5**

### Property 8: Form Validation Rejects Incomplete Submissions

*For any* visitor form submission (Contact Form or Join Form) where at least one required field is absent or composed entirely of whitespace, the system SHALL not persist the submission, SHALL not call the backend API, and SHALL display a field-level validation error for each missing field.

**Validates: Requirements 7.4, 7.7**

### Property 9: Admin Form Validation Rejects Incomplete Records

*For any* admin create or update form submission (Song, Event, Member, or Gallery Item) where at least one required field is absent or blank, the system SHALL not persist the record to the database and SHALL return a validation error identifying the missing field(s).

**Validates: Requirements 11.5, 12.5, 13.5, 14.5**

### Property 10: Cloudinary Upload Atomicity

*For any* admin media upload operation where the Cloudinary upload fails, the system SHALL not persist any database record for that media item and SHALL return an error response to the admin.

**Validates: Requirements 18.4**

### Property 11: Audio Player Queue Navigation

*For any* playlist queue of length ≥ 2 and any current track index `i`, clicking "next" SHALL advance the current track to index `i+1`, and clicking "previous" from index `i+1` SHALL return the current track to index `i`. When the current song ends naturally, the player SHALL advance to the next song in the queue identically to a manual "next" click.

**Validates: Requirements 9.3, 9.4, 9.5**

### Property 12: JWT Authentication Rejection

*For any* request to an admin-protected endpoint carrying either an invalid JWT (wrong signature, malformed) or an expired JWT, the system SHALL return HTTP 401 and SHALL NOT process the request.

**Validates: Requirements 10.3, 10.5**

### Property 13: Events Chronological Ordering

*For any* set of events, the Events Page SHALL display upcoming events in strictly ascending order by event date and past events in strictly descending order by event date.

**Validates: Requirements 4.2, 4.3**

### Property 14: Media Records Store URL Only

*For any* successful media upload (audio, video, or image), the database record SHALL contain the Cloudinary-returned URL string and SHALL NOT contain binary media data.

**Validates: Requirements 18.2**

### Property 15: Cascade Delete Removes All Children

*For any* parent record (Event or Gallery Album) that has associated child records (Gallery Items), deleting the parent SHALL remove all child records from the database such that no orphaned child records remain.

**Validates: Requirements 12.4, 14.4, 19.3**

---

## Error Handling

### API Error Response Format

All API errors return a consistent JSON envelope:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "fields": { "title": "Title is required" }
  }
}
```

### Error Categories and HTTP Status Codes

| Scenario | HTTP Status | Code |
|----------|-------------|------|
| Missing required field | 400 | `VALIDATION_ERROR` |
| Invalid credentials | 401 | `INVALID_CREDENTIALS` |
| Missing / expired JWT | 401 | `UNAUTHORIZED` |
| Resource not found | 404 | `NOT_FOUND` |
| Cloudinary upload failure | 502 | `MEDIA_UPLOAD_FAILED` |
| Database error | 500 | `DATABASE_ERROR` |
| Generic server error | 500 | `INTERNAL_ERROR` |

### Frontend Error Handling

- **React Query** — `onError` callbacks display toast notifications for API failures.
- **Form validation** — React Hook Form with Yup schemas provides field-level errors before submission.
- **Audio Player** — if a track URL is unreachable, the player skips to the next track and shows a brief error toast.
- **Cloudinary CDN failures** — `<img>` and `<audio>` elements use `onError` handlers to fall back to placeholder assets.
- **Auth expiry** — Axios response interceptor catches 401 responses, clears the JWT from `localStorage`, and redirects to `/admin/login`.

### Backend Validation Strategy

- All request bodies are validated with **express-validator** before reaching the service layer.
- Cloudinary uploads are wrapped in try/catch; on failure the upload is aborted and no DB write occurs.
- All DB queries use **mysql2** prepared statements (parameterized) — no string concatenation.

---

## Testing Strategy

### Unit Tests (Jest + React Testing Library)

Focus areas:
- **Daily Worship Song algorithm** — pure function, tested with fixed day indices and various song sets (including empty worship category).
- **Search service** — keyword matching logic, case-insensitivity, empty keyword behavior.
- **Form validation schemas** — Yup schemas for contact, join, and all admin forms.
- **Audio Player context** — queue management: add, advance, retreat, auto-advance on end, idle state.
- **API route handlers** — mocked DB and Cloudinary, testing validation rejection and success paths.
- **React components** — SongCard, MemberCard, EventCard render correctly with given props; AudioPlayer controls trigger correct context actions.

### Property-Based Tests (fast-check)

The project uses **[fast-check](https://github.com/dubzzz/fast-check)** for property-based testing. Each property test runs a minimum of **100 iterations**.

Each test is tagged with a comment in the format:
`// Feature: kennawaq-choir-website, Property N: <property text>`

| Property | Test Description | Arbitraries |
|----------|-----------------|-------------|
| P1 — Daily Worship Song Determinism | Generate random day indices and two timestamps within the same day; assert same song returned | `fc.integer()` for day offset, `fc.array(SongArb, {minLength:1})` |
| P2 — Daily Worship Song Category Preference | Generate non-empty worship song arrays; assert selection is always from worship set | `fc.array(SongArb, {minLength:1})` filtered to worship |
| P3 — Daily Worship Song Fallback | Generate empty worship set + non-empty total set; assert selection from total set | `fc.array(SongArb, {minLength:1})` |
| P4 — Song Search Result Correctness | Generate random keywords and song arrays; assert result is exactly the case-insensitive matching subset | `fc.string()`, `fc.array(SongArb)` |
| P5 — Event Search Result Correctness | Generate random keywords and event arrays; assert result is exactly the matching subset | `fc.string()`, `fc.array(EventArb)` |
| P6 — Combined Search Equals Union | Generate keywords; assert search("all") = union of search("songs") + search("events") | `fc.string()`, `fc.array(SongArb)`, `fc.array(EventArb)` |
| P7 — Empty Keyword Returns All | Generate song/event arrays; assert empty keyword returns full set | `fc.array(SongArb)`, `fc.array(EventArb)` |
| P8 — Form Validation Rejects Incomplete | Generate contact/join submissions with at least one blank required field; assert rejection and no API call | `fc.record(...)` with at least one blank field |
| P9 — Admin Form Validation Rejects Incomplete | Generate admin form payloads with missing required fields; assert rejection and no DB write | `fc.record(...)` with missing fields |
| P10 — Cloudinary Upload Atomicity | Mock Cloudinary to fail; attempt media upload; assert no DB record created | Mock Cloudinary, `fc.record(MediaArb)` |
| P11 — Audio Player Queue Navigation | Generate queues of length ≥ 2; simulate next/previous; assert correct track advancement and retreat | `fc.array(SongArb, {minLength:2})`, `fc.integer()` for index |
| P12 — JWT Authentication Rejection | Generate invalid/expired JWTs; call admin endpoints; assert 401 response | `fc.string()` for malformed tokens, expired token generation |
| P13 — Events Chronological Ordering | Generate random event arrays; assert upcoming sorted ascending, past sorted descending | `fc.array(EventArb)` with varied dates |
| P14 — Media Records Store URL Only | Generate media uploads; assert DB record contains URL string, not binary | Mock Cloudinary returning URL, `fc.record(MediaArb)` |
| P15 — Cascade Delete Removes All Children | Generate parent records with varying child counts; delete parent; assert no orphaned children | `fc.array(GalleryItemArb)` |

### Integration Tests (Supertest)

- Auth flow: login → receive JWT → access protected route → expired JWT rejected.
- Song CRUD: create → read → update → delete (with mocked Cloudinary).
- Event cascade delete: create event with gallery items → delete event → gallery items gone.
- Search endpoint: keyword returns correct subset, empty keyword returns all.

### End-to-End Tests (Playwright — optional, post-MVP)

- Visitor browses Songs page, plays a song, navigates to Members page — player continues.
- Admin logs in, creates a song, verifies it appears on public Songs page.
- Contact form submission shows success message.

### Responsive Design Testing

- Manual testing at 320px, 480px, 768px, 1024px, 1440px, 2560px breakpoints.
- Storybook stories for all card components at each breakpoint.
