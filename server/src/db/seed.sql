-- =============================================================================
-- KennaWaq Choir Website — Seed Data
-- =============================================================================
-- Populates the database with representative sample data for development and
-- staging environments.
--
-- Prerequisites: schema.sql must have been applied first.
--
-- IMPORTANT — Admin password:
--   The password_hash value below is a PLACEHOLDER.  Before running this
--   script in any real environment, replace it with an actual bcrypt hash
--   generated at cost factor 12 or higher, e.g.:
--
--     node -e "const b=require('bcrypt'); b.hash('YourPassword', 12).then(console.log)"
--
--   Never store a plaintext password in this column.
-- =============================================================================

USE kennawaq_choir;

-- ---------------------------------------------------------------------------
-- 1. Admin User
-- ---------------------------------------------------------------------------
-- password_hash is a placeholder — replace with a real bcrypt hash (cost ≥ 12)
-- before deploying to any non-local environment.
INSERT INTO admins (email, password_hash)
VALUES (
  'admin@kennawaq.com',
  '$2b$12$PLACEHOLDER_REPLACE_WITH_REAL_BCRYPT_HASH_BEFORE_DEPLOY'
);

-- ---------------------------------------------------------------------------
-- 2. Songs  (one per category: worship, live, album)
-- ---------------------------------------------------------------------------
INSERT INTO songs (title, audio_url, cloudinary_public_id, video_url, category, download_url, is_published)
VALUES
  -- Worship category — eligible for Daily Worship Song rotation
  (
    'Yigermal Lij',
    'https://res.cloudinary.com/kennawaq/video/upload/v1/songs/yigermal_lij.mp3',
    'songs/yigermal_lij',
    'https://res.cloudinary.com/kennawaq/video/upload/v1/songs/yigermal_lij.mp4',
    'worship',
    'https://res.cloudinary.com/kennawaq/video/upload/v1/songs/yigermal_lij.mp3',
    TRUE
  ),
  -- Live category — recorded at a live performance
  (
    'Hallelujah Live 2023',
    'https://res.cloudinary.com/kennawaq/video/upload/v1/songs/hallelujah_live_2023.mp3',
    'songs/hallelujah_live_2023',
    'https://res.cloudinary.com/kennawaq/video/upload/v1/songs/hallelujah_live_2023.mp4',
    'live',
    NULL,
    TRUE
  ),
  -- Album category — studio recording from the debut album
  (
    'Amen (Studio)',
    'https://res.cloudinary.com/kennawaq/video/upload/v1/songs/amen_studio.mp3',
    'songs/amen_studio',
    NULL,
    'album',
    'https://res.cloudinary.com/kennawaq/video/upload/v1/songs/amen_studio.mp3',
    TRUE
  );

-- ---------------------------------------------------------------------------
-- 3. Events  (one upcoming, one past)
-- ---------------------------------------------------------------------------
INSERT INTO events (title, event_date, location, description, registration_url)
VALUES
  -- Upcoming event — adjust the date to a future date as needed
  (
    'KennaWaq Annual Concert 2025',
    '2025-12-20',
    'Addis Ababa, Millennium Hall',
    'Join us for our annual Christmas concert featuring worship songs, live performances, and special guest artists. Doors open at 6:00 PM.',
    'https://tickets.kennawaq.com/annual-concert-2025'
  ),
  -- Past event — used to demonstrate the Past Events section and gallery
  (
    'Easter Celebration 2024',
    '2024-03-31',
    'Addis Ababa, Bole Medhanealem Church',
    'A joyful Easter celebration service featuring the full KennaWaq Choir performing resurrection hymns and contemporary worship songs.',
    NULL
  );

-- ---------------------------------------------------------------------------
-- 4. Members  (Choir Leader, Soprano, Tenor)
-- ---------------------------------------------------------------------------
INSERT INTO members (name, role, role_category, image_url, cloudinary_public_id, is_active)
VALUES
  (
    'Dawit Bekele',
    'Choir Director',
    'Choir Leader',
    'https://res.cloudinary.com/kennawaq/image/upload/v1/members/dawit_bekele.jpg',
    'members/dawit_bekele',
    TRUE
  ),
  (
    'Meron Tadesse',
    'Lead Soprano',
    'Soprano',
    'https://res.cloudinary.com/kennawaq/image/upload/v1/members/meron_tadesse.jpg',
    'members/meron_tadesse',
    TRUE
  ),
  (
    'Yonas Girma',
    'Tenor Section Lead',
    'Tenor',
    'https://res.cloudinary.com/kennawaq/image/upload/v1/members/yonas_girma.jpg',
    'members/yonas_girma',
    TRUE
  );

-- ---------------------------------------------------------------------------
-- 5. Album + Gallery Items
-- ---------------------------------------------------------------------------
-- Album: Easter 2024 highlights
INSERT INTO albums (name)
VALUES ('Easter 2024 Highlights');

-- Gallery items linked to the album and to the past Easter event (id = 2)
-- NOTE: event_id references the second event inserted above.
--       If you truncate and re-seed, IDs may differ — adjust accordingly.
INSERT INTO gallery_items (album_id, media_url, cloudinary_public_id, media_type, caption, event_id)
VALUES
  (
    1,  -- Easter 2024 Highlights album
    'https://res.cloudinary.com/kennawaq/image/upload/v1/gallery/easter_2024_01.jpg',
    'gallery/easter_2024_01',
    'photo',
    'The full choir on stage during the opening worship set',
    2   -- Easter Celebration 2024 event
  ),
  (
    1,
    'https://res.cloudinary.com/kennawaq/video/upload/v1/gallery/easter_2024_highlight.mp4',
    'gallery/easter_2024_highlight',
    'video',
    'Highlight reel from the Easter 2024 celebration',
    2
  );

-- ---------------------------------------------------------------------------
-- 6. About Content  (single row — the API always reads/updates row id = 1)
-- ---------------------------------------------------------------------------
INSERT INTO about_content (mission, vision)
VALUES (
  'KennaWaq Choir exists to glorify God through music, to inspire and uplift the community, and to spread the message of hope and faith through the universal language of song.',
  'To be a beacon of musical excellence and spiritual encouragement in Ethiopia and beyond, nurturing talented voices and creating transformative worship experiences that draw people closer to God.'
);

-- ---------------------------------------------------------------------------
-- 7. History Milestones  (chronological, sort_order matches display sequence)
-- ---------------------------------------------------------------------------
INSERT INTO history_milestones (year, description, sort_order)
VALUES
  (
    2015,
    'KennaWaq Choir was founded by a small group of passionate worshippers at Bole Medhanealem Church in Addis Ababa, beginning with just twelve members.',
    1
  ),
  (
    2019,
    'Released the debut studio album "Yigermal", featuring ten original worship songs that reached listeners across Ethiopia and the Ethiopian diaspora.',
    2
  );

-- =============================================================================
-- End of seed data
-- =============================================================================
