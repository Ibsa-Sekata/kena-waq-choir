-- =============================================================================
-- KennaWaq Choir Website — MySQL Schema Migration
-- =============================================================================
-- Run this script once against a fresh MySQL instance to bootstrap the
-- database.  All statements are idempotent (IF NOT EXISTS) so the script
-- can be re-run safely without data loss.
--
-- Requirements: MySQL 8.0+ (utf8mb4, FULLTEXT on InnoDB, YEAR type)
-- Charset:      utf8mb4 / utf8mb4_unicode_ci  (full Unicode + emoji support)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Database
-- ---------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS kennawaq_choir
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kennawaq_choir;

-- ---------------------------------------------------------------------------
-- 2. Admins
--    Stores admin user credentials.  Passwords MUST be bcrypt-hashed before
--    insertion (cost factor ≥ 12 per Requirement 10.6).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS admins (
  id             INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  email          VARCHAR(255)     NOT NULL,
  password_hash  VARCHAR(255)     NOT NULL,
  created_at     TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_admins_email (email)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 3. Songs
--    Published audio tracks.  FULLTEXT index enables fast keyword search
--    across title and category (Requirement 15.2, 15.6).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS songs (
  id                    INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  title                 VARCHAR(255)     NOT NULL,
  audio_url             VARCHAR(512)     NOT NULL,
  cloudinary_public_id  VARCHAR(255)     NOT NULL,
  video_url             VARCHAR(512)         NULL DEFAULT NULL,
  category              ENUM('worship','live','album') NOT NULL,
  download_url          VARCHAR(512)         NULL DEFAULT NULL,
  is_published          BOOLEAN          NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  FULLTEXT INDEX ft_songs (title)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 4. Events
--    Choir concerts and church programs.  FULLTEXT index covers title,
--    location, and description (Requirement 15.3, 15.6).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id                INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  title             VARCHAR(255)     NOT NULL,
  event_date        DATE             NOT NULL,
  location          VARCHAR(255)     NOT NULL,
  description       TEXT             NOT NULL,
  registration_url  VARCHAR(512)         NULL DEFAULT NULL,
  created_at        TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  FULLTEXT INDEX ft_events (title, location, description)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 5. Members
--    Active choir member profiles.  Images are stored as Cloudinary URLs
--    (Requirement 18.2).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS members (
  id                    INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  name                  VARCHAR(255)     NOT NULL,
  role                  VARCHAR(100)     NOT NULL,
  role_category         ENUM('Choir Leader','Soprano','Alto','Tenor','Bass') NOT NULL,
  image_url             VARCHAR(512)     NOT NULL,
  cloudinary_public_id  VARCHAR(255)     NOT NULL,
  is_active             BOOLEAN          NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 6. Albums
--    Named gallery albums that group Gallery_Items.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS albums (
  id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  name        VARCHAR(255)     NOT NULL,
  created_at  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_albums_name (name)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 7. Gallery Items
--    Photos and videos linked to an album and optionally to an event.
--
--    Foreign key behaviour (Requirement 12.4, 14.4, 19.3):
--      album_id → albums(id)  ON DELETE CASCADE   — deleting an album removes
--                                                    all its items.
--      event_id → events(id)  ON DELETE SET NULL  — deleting an event orphans
--                                                    the item in its album
--                                                    rather than removing it.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gallery_items (
  id                    INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  album_id              INT UNSIGNED     NOT NULL,
  media_url             VARCHAR(512)     NOT NULL,
  cloudinary_public_id  VARCHAR(255)     NOT NULL,
  media_type            ENUM('photo','video') NOT NULL,
  caption               VARCHAR(512)         NULL DEFAULT NULL,
  event_id              INT UNSIGNED         NULL DEFAULT NULL,
  created_at            TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_gallery_album
    FOREIGN KEY (album_id) REFERENCES albums(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_gallery_event
    FOREIGN KEY (event_id) REFERENCES events(id)
    ON DELETE SET NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 8. About Content
--    Single-row table holding the choir's mission and vision text.
--    updated_at is refreshed automatically on every UPDATE.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS about_content (
  id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  mission     TEXT             NOT NULL,
  vision      TEXT             NOT NULL,
  updated_at  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 9. History Milestones
--    Ordered list of timeline entries displayed on the About Page.
--    sort_order controls display sequence independent of insertion order.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS history_milestones (
  id           INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  year         YEAR             NOT NULL,
  description  TEXT             NOT NULL,
  sort_order   INT              NOT NULL DEFAULT 0,

  PRIMARY KEY (id),
  KEY idx_milestones_sort (sort_order, year)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 10. Contact Submissions
--     Stores messages sent via the public Contact Form (Requirement 7.2–7.4).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contact_submissions (
  id          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  name        VARCHAR(255)     NOT NULL,
  email       VARCHAR(255)     NOT NULL,
  message     TEXT             NOT NULL,
  created_at  TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_contact_created (created_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 11. Join Applications
--     Stores choir membership applications submitted via the Join Form
--     (Requirement 7.5–7.7).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS join_applications (
  id                INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  name              VARCHAR(255)     NOT NULL,
  voice_type        ENUM('Soprano','Alto','Tenor','Bass') NOT NULL,
  experience_level  VARCHAR(100)     NOT NULL,
  message           TEXT                 NULL DEFAULT NULL,
  created_at        TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_join_created (created_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- End of schema migration
-- =============================================================================
