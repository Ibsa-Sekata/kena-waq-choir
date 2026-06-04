import { Song, Event, SearchResult } from '../types';

/**
 * In-memory search helpers (used for unit/property tests).
 * The production implementation in Task 5 uses MySQL FULLTEXT queries.
 */

export function searchSongsInMemory(songs: Song[], keyword: string): Song[] {
  if (!keyword) return songs;
  const lower = keyword.toLowerCase();
  return songs.filter(
    (s) => s.title.toLowerCase().includes(lower) || s.category.toLowerCase().includes(lower),
  );
}

export function searchEventsInMemory(events: Event[], keyword: string): Event[] {
  if (!keyword) return events;
  const lower = keyword.toLowerCase();
  return events.filter(
    (e) =>
      e.title.toLowerCase().includes(lower) ||
      e.location.toLowerCase().includes(lower) ||
      e.description.toLowerCase().includes(lower),
  );
}

export function searchInMemory(
  songs: Song[],
  events: Event[],
  keyword: string,
  type: 'songs' | 'events' | 'all',
): SearchResult {
  return {
    songs: type === 'events' ? [] : searchSongsInMemory(songs, keyword),
    events: type === 'songs' ? [] : searchEventsInMemory(events, keyword),
  };
}
