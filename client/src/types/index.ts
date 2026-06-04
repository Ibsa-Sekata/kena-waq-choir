// ─── Domain Interfaces ────────────────────────────────────────────────────────

export interface Song {
  id: number;
  title: string;
  audioUrl: string;
  videoUrl?: string;
  category: 'worship' | 'live' | 'album';
  downloadUrl?: string;
  isPublished: boolean;
  createdAt: string;
}

export interface Event {
  id: number;
  title: string;
  eventDate: string; // ISO date string (YYYY-MM-DD)
  location: string;
  description: string;
  registrationUrl?: string;
  createdAt: string;
}

export interface Member {
  id: number;
  name: string;
  role: string;
  roleCategory: 'Choir Leader' | 'Soprano' | 'Alto' | 'Tenor' | 'Bass';
  imageUrl: string;
  isActive: boolean;
}

export interface Album {
  id: number;
  name: string;
  createdAt: string;
}

export interface GalleryItem {
  id: number;
  albumId: number;
  albumName: string;
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  caption?: string;
  eventId?: number;
}

export interface AudioPlayerState {
  currentTrack: Song | null;
  queue: Song[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

export interface SearchResult {
  songs: Song[];
  events: Event[];
}

export interface AboutContent {
  id: number;
  mission: string;
  vision: string;
  updatedAt: string;
}

export interface HistoryMilestone {
  id: number;
  year: number;
  description: string;
  sortOrder: number;
}

// ─── API Shapes ───────────────────────────────────────────────────────────────

export interface ApiError {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export interface JoinFormData {
  name: string;
  voiceType: 'Soprano' | 'Alto' | 'Tenor' | 'Bass';
  experienceLevel: string;
  message?: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AdminProfile {
  adminId: number;
  email: string;
}
