# Requirements Document

## Introduction

KennaWaq Choir Website is a full-stack music ministry platform that enables the choir to share songs and videos, showcase members, announce events, tell the choir's story, and allow visitors to contact or join the choir. The platform includes a public-facing website with multiple pages, an audio/video player system, an admin panel for content management, and a daily featured worship song feature. The tech stack is React (frontend), Node.js + Express (backend), MySQL (database), and Cloudinary (media storage).

---

## Glossary

- **System**: The KennaWaq Choir Website platform (frontend + backend).
- **Visitor**: An unauthenticated user browsing the public website.
- **Admin**: An authenticated user with privileges to manage content via the Admin Panel.
- **Admin_Panel**: The protected web interface through which Admins manage songs, events, members, and gallery content.
- **Audio_Player**: The in-browser component that plays audio tracks and manages a playlist queue.
- **Song**: A music track record containing a title, audio URL, optional video URL, category, and upload date.
- **Event**: A record representing a choir concert or church program, containing a title, date, location, and description.
- **Member**: A record representing a choir member, containing a name, role (voice type or leadership position), and profile image.
- **Gallery_Item**: A photo or video highlight record associated with an album or event.
- **Daily_Worship_Song**: The single Song automatically selected and featured each calendar day.
- **Join_Form**: The submission form through which a Visitor applies to join the choir.
- **Contact_Form**: The submission form through which a Visitor sends a message to the choir.
- **Search_Service**: The backend service that indexes and queries Songs and Events by keyword.
- **Cloudinary**: The third-party cloud storage service used for images, audio, and video assets.
- **JWT**: JSON Web Token used for Admin authentication sessions.

---

## Requirements

### Requirement 1: Public Home Page

**User Story:** As a Visitor, I want to see a welcoming home page with highlights of the choir's music, members, and upcoming events, so that I can quickly understand what KennaWaq Choir is about and explore further.

#### Acceptance Criteria

1. THE System SHALL render a Home Page containing a hero section, a welcome message, a featured songs section, a featured video section, and an upcoming event highlight section.
2. WHEN the Home Page loads, THE System SHALL display the Daily_Worship_Song in the featured songs section.
3. WHEN the Home Page loads, THE System SHALL display the nearest upcoming Event in the upcoming event highlight section.
4. WHEN a Visitor clicks the play button on a featured Song, THE Audio_Player SHALL begin playback of that Song.
5. WHEN a Visitor clicks an upcoming event highlight, THE System SHALL navigate the Visitor to the Events Page filtered to that Event.

---

### Requirement 2: Songs / Music Page

**User Story:** As a Visitor, I want to browse, search, filter, and play choir songs, so that I can listen to the music I enjoy and discover new tracks.

#### Acceptance Criteria

1. THE System SHALL render a Songs Page displaying all published Songs as cards, each showing the title, category, and a play button.
2. WHEN a Visitor selects a category filter (worship, live, or album), THE System SHALL display only Songs belonging to the selected category.
3. WHEN a Visitor enters a keyword in the search field, THE Search_Service SHALL return Songs whose title or category contains the keyword, and THE System SHALL update the Songs Page to display only matching results.
4. WHEN a Visitor clicks the play button on a Song card, THE Audio_Player SHALL begin playback of that Song and add remaining visible Songs to the playlist queue.
5. WHILE a Song is playing, THE Audio_Player SHALL display the current track title, elapsed time, total duration, and playback controls (play, pause, skip forward, skip backward).
6. WHERE a Song record includes a download URL, THE System SHALL display a download button on that Song card.
7. WHEN a Visitor clicks the download button on a Song card, THE System SHALL initiate a file download of the Song's audio file.
8. IF the Search_Service returns no results for a keyword, THEN THE System SHALL display a "No songs found" message on the Songs Page.

---

### Requirement 3: Members Page

**User Story:** As a Visitor, I want to see profile cards for all choir members with their names, photos, and roles, so that I can learn who makes up the choir.

#### Acceptance Criteria

1. THE System SHALL render a Members Page displaying all active Members as profile cards, each showing the member's photo, name, and role.
2. THE System SHALL group Member cards by role category: Choir Leader, Sopranos, Altos, Tenors, and Bass.
3. IF a Member record does not include a profile image, THEN THE System SHALL display a default placeholder image on that Member's card.
4. THE System SHALL render the Members Page in a responsive grid layout that adapts to mobile, tablet, and desktop viewport widths.

---

### Requirement 4: Events Page

**User Story:** As a Visitor, I want to view upcoming and past choir events with details and photos, so that I can attend concerts and relive past programs.

#### Acceptance Criteria

1. THE System SHALL render an Events Page with two sections: Upcoming Events and Past Events.
2. THE System SHALL display Upcoming Events in ascending chronological order by event date.
3. THE System SHALL display Past Events in descending chronological order by event date.
4. WHEN a Visitor views an Event card, THE System SHALL display the event title, date, location, and description.
5. WHERE an Event record includes a registration URL, THE System SHALL display a "Register" button on that Event card.
6. WHEN a Visitor clicks the "Register" button on an Event card, THE System SHALL open the registration URL in a new browser tab.
7. THE System SHALL render a Past Events gallery section displaying Gallery_Items associated with past Events.

---

### Requirement 5: About Page

**User Story:** As a Visitor, I want to read about the choir's mission, vision, and history, so that I can understand the choir's purpose and background.

#### Acceptance Criteria

1. THE System SHALL render an About Page containing a Mission section, a Vision section, and a History Timeline section.
2. THE System SHALL display the History Timeline as a chronological list of milestones, each showing a year and a description.
3. THE System SHALL render the About Page content from structured data managed by the Admin.

---

### Requirement 6: Gallery Page

**User Story:** As a Visitor, I want to browse photos and video highlights organized into albums, so that I can relive choir performances and events.

#### Acceptance Criteria

1. THE System SHALL render a Gallery Page displaying Gallery_Items organized into named albums.
2. WHEN a Visitor selects an album, THE System SHALL display only the Gallery_Items belonging to that album.
3. WHEN a Visitor clicks a photo Gallery_Item, THE System SHALL display the image in a full-screen lightbox overlay.
4. WHEN a Visitor clicks a video Gallery_Item, THE System SHALL play the video in an inline or modal player.
5. WHEN a Visitor closes the lightbox or video modal, THE System SHALL return the Visitor to the Gallery Page without a full page reload.

---

### Requirement 7: Contact and Join Page

**User Story:** As a Visitor, I want to send a message to the choir or apply to join, so that I can get in touch or become a member.

#### Acceptance Criteria

1. THE System SHALL render a Contact/Join Page containing a Contact_Form, a "Join Choir" Join_Form, a WhatsApp button, and a displayed email address.
2. THE Contact_Form SHALL include fields for the Visitor's name, email address, and message, all of which are required.
3. WHEN a Visitor submits the Contact_Form with all required fields completed, THE System SHALL send the form data to the backend and display a success confirmation message.
4. IF a Visitor submits the Contact_Form with one or more required fields empty, THEN THE System SHALL display a field-level validation error and SHALL NOT submit the form.
5. THE Join_Form SHALL include fields for name (required), voice type (required, options: Soprano, Alto, Tenor, Bass), experience level (required), and message (optional).
6. WHEN a Visitor submits the Join_Form with all required fields completed, THE System SHALL send the application data to the backend and display a success confirmation message.
7. IF a Visitor submits the Join_Form with one or more required fields empty, THEN THE System SHALL display a field-level validation error and SHALL NOT submit the form.
8. WHEN a Visitor clicks the WhatsApp button, THE System SHALL open a WhatsApp chat link in a new browser tab.

---

### Requirement 8: Daily Worship Song

**User Story:** As a Visitor, I want to see a different featured worship song each day, so that I can discover new music and feel inspired daily.

#### Acceptance Criteria

1. THE System SHALL designate exactly one Song as the Daily_Worship_Song for each calendar day.
2. WHEN the calendar date changes, THE System SHALL automatically select a new Daily_Worship_Song without requiring manual Admin intervention.
3. THE System SHALL select the Daily_Worship_Song from Songs in the "worship" category.
4. IF no Songs exist in the "worship" category, THEN THE System SHALL select the Daily_Worship_Song from all available Songs.
5. THE System SHALL expose a public API endpoint that returns the current Daily_Worship_Song record.
6. WHEN the Home Page loads, THE System SHALL fetch and display the current Daily_Worship_Song from the Daily Worship Song API endpoint.

---

### Requirement 9: Audio Player System

**User Story:** As a Visitor, I want a persistent audio player that lets me manage a playlist and control playback without interrupting my browsing, so that I can listen to songs while exploring the site.

#### Acceptance Criteria

1. THE Audio_Player SHALL persist across page navigations without interrupting playback.
2. THE Audio_Player SHALL support a playlist queue that Visitors can add Songs to.
3. WHEN a Visitor clicks "play next" in the Audio_Player, THE Audio_Player SHALL advance to the next Song in the playlist queue.
4. WHEN a Visitor clicks "play previous" in the Audio_Player, THE Audio_Player SHALL return to the previous Song in the playlist queue.
5. WHEN the current Song ends, THE Audio_Player SHALL automatically advance to the next Song in the playlist queue.
6. WHILE a Song is playing, THE Audio_Player SHALL allow the Visitor to seek to any position within the track using a progress bar.
7. THE Audio_Player SHALL allow the Visitor to adjust the playback volume.
8. IF the Audio_Player playlist queue is empty and the current Song ends, THEN THE Audio_Player SHALL stop playback and display an idle state.

---

### Requirement 10: Admin Authentication

**User Story:** As an Admin, I want to securely log in to the Admin Panel, so that I can manage website content without unauthorized access.

#### Acceptance Criteria

1. THE System SHALL provide a login endpoint that accepts an email address and password.
2. WHEN an Admin submits valid credentials, THE System SHALL return a JWT with an expiry of 24 hours.
3. IF an Admin submits invalid credentials, THEN THE System SHALL return an HTTP 401 response and SHALL NOT issue a JWT.
4. WHILE an Admin holds a valid JWT, THE System SHALL grant access to all Admin Panel endpoints.
5. WHEN an Admin's JWT expires, THE System SHALL reject subsequent Admin Panel requests with an HTTP 401 response and require re-authentication.
6. THE System SHALL store Admin passwords as bcrypt hashes with a minimum cost factor of 12 and SHALL NOT store plaintext passwords.

---

### Requirement 11: Admin Panel — Song Management

**User Story:** As an Admin, I want to add, edit, and remove songs through the Admin Panel, so that the Songs Page always reflects the choir's current catalog.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide a form to create a new Song record with fields for title (required), audio file (required), optional video URL, and category (required: worship, live, or album).
2. WHEN an Admin submits a valid new Song form, THE System SHALL upload the audio file to Cloudinary, store the returned URL in the Song record, and persist the Song to the database.
3. THE Admin_Panel SHALL allow an Admin to edit the title, category, video URL, and download availability of an existing Song.
4. WHEN an Admin deletes a Song, THE System SHALL remove the Song record from the database and SHALL mark the associated Cloudinary asset for deletion.
5. IF an Admin submits a Song form with a required field missing, THEN THE System SHALL display a validation error and SHALL NOT persist the record.

---

### Requirement 12: Admin Panel — Event Management

**User Story:** As an Admin, I want to create, update, and delete events through the Admin Panel, so that the Events Page always shows accurate and current information.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide a form to create a new Event record with fields for title (required), date (required), location (required), description (required), and optional registration URL.
2. WHEN an Admin submits a valid new Event form, THE System SHALL persist the Event record to the database.
3. THE Admin_Panel SHALL allow an Admin to edit all fields of an existing Event.
4. WHEN an Admin deletes an Event, THE System SHALL remove the Event record and all associated Gallery_Items from the database.
5. IF an Admin submits an Event form with a required field missing, THEN THE System SHALL display a validation error and SHALL NOT persist the record.

---

### Requirement 13: Admin Panel — Member Management

**User Story:** As an Admin, I want to add, update, and remove choir member profiles through the Admin Panel, so that the Members Page accurately represents the current choir roster.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide a form to create a new Member record with fields for name (required), role (required), and profile image (required).
2. WHEN an Admin submits a valid new Member form, THE System SHALL upload the profile image to Cloudinary, store the returned URL in the Member record, and persist the Member to the database.
3. THE Admin_Panel SHALL allow an Admin to edit the name, role, and profile image of an existing Member.
4. WHEN an Admin deletes a Member, THE System SHALL remove the Member record from the database and SHALL mark the associated Cloudinary image asset for deletion.
5. IF an Admin submits a Member form with a required field missing, THEN THE System SHALL display a validation error and SHALL NOT persist the record.

---

### Requirement 14: Admin Panel — Gallery Management

**User Story:** As an Admin, I want to upload and organize photos and videos into albums through the Admin Panel, so that the Gallery Page stays up to date.

#### Acceptance Criteria

1. THE Admin_Panel SHALL provide a form to upload a new Gallery_Item with fields for media file (required), album name (required), and optional caption.
2. WHEN an Admin submits a valid Gallery_Item upload form, THE System SHALL upload the media file to Cloudinary, store the returned URL in the Gallery_Item record, and persist the record to the database.
3. THE Admin_Panel SHALL allow an Admin to create, rename, and delete gallery albums.
4. WHEN an Admin deletes a gallery album, THE System SHALL remove all Gallery_Items within that album from the database and SHALL mark the associated Cloudinary assets for deletion.
5. IF an Admin submits a Gallery_Item form with a required field missing, THEN THE System SHALL display a validation error and SHALL NOT persist the record.

---

### Requirement 15: Search System

**User Story:** As a Visitor, I want to search for songs and events by keyword, so that I can quickly find specific content without scrolling through all records.

#### Acceptance Criteria

1. THE Search_Service SHALL accept a keyword string and a content type parameter (songs, events, or all).
2. WHEN the content type is "songs", THE Search_Service SHALL return all Songs whose title or category contains the keyword (case-insensitive).
3. WHEN the content type is "events", THE Search_Service SHALL return all Events whose title, location, or description contains the keyword (case-insensitive).
4. WHEN the content type is "all", THE Search_Service SHALL return matching Songs and Events in a combined result set.
5. IF the keyword string is empty, THEN THE Search_Service SHALL return all records of the requested content type.
6. THE Search_Service SHALL return results within 500ms for datasets of up to 10,000 records.

---

### Requirement 16: Responsive Design

**User Story:** As a Visitor using a mobile device, I want the website to display correctly on my screen, so that I can browse and listen to music comfortably on any device.

#### Acceptance Criteria

1. THE System SHALL render all public pages in a responsive layout that supports viewport widths from 320px to 2560px.
2. THE System SHALL render navigation as a collapsible hamburger menu on viewport widths below 768px.
3. THE Audio_Player SHALL remain accessible and fully functional on viewport widths from 320px to 2560px.
4. THE System SHALL render card-based layouts (Songs, Members, Events, Gallery) in a single-column layout on viewport widths below 480px, a two-column layout between 480px and 768px, and a multi-column layout above 768px.

---

### Requirement 17: Multi-Language Support (Optional)

**User Story:** As a Visitor who speaks a local language, I want to view the website in my preferred language, so that I can understand the content more easily.

#### Acceptance Criteria

1. WHERE multi-language support is enabled, THE System SHALL support English and at least one configured local language.
2. WHERE multi-language support is enabled, THE System SHALL display a language selector control on all public pages.
3. WHERE multi-language support is enabled, WHEN a Visitor selects a language, THE System SHALL re-render all static UI text in the selected language without a full page reload.
4. WHERE multi-language support is enabled, THE System SHALL persist the Visitor's language preference in browser local storage and apply it on subsequent visits.

---

### Requirement 18: Media Storage and Delivery

**User Story:** As an Admin, I want all uploaded media to be stored reliably and delivered quickly to Visitors, so that the website performs well and media is always accessible.

#### Acceptance Criteria

1. THE System SHALL upload all audio, video, and image files to Cloudinary upon Admin submission.
2. THE System SHALL store only the Cloudinary-returned URL in the database and SHALL NOT store binary media files on the application server.
3. WHEN a Visitor requests a media asset, THE System SHALL serve the asset via the Cloudinary CDN URL.
4. IF a Cloudinary upload fails, THEN THE System SHALL return an error response to the Admin and SHALL NOT persist an incomplete record to the database.

---

### Requirement 19: Data Persistence and Integrity

**User Story:** As an Admin, I want all content changes to be saved reliably to the database, so that the website always reflects the most recent updates.

#### Acceptance Criteria

1. THE System SHALL persist all Song, Event, Member, and Gallery_Item records to a MySQL database.
2. THE System SHALL enforce NOT NULL constraints on all required fields in the database schema.
3. WHEN an Admin deletes a parent record (e.g., an Event), THE System SHALL cascade-delete all dependent child records (e.g., associated Gallery_Items).
4. THE System SHALL use parameterized queries for all database operations and SHALL NOT construct SQL statements through string concatenation of user-supplied input.
