import {
  createContext,
  useContext,
  useReducer,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
  RefObject,
} from 'react';
import { Song, AudioPlayerState } from '../types';

// ─── Actions ──────────────────────────────────────────────────────────────────

type AudioPlayerAction =
  | { type: 'PLAY'; song: Song; queue?: Song[] }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'ADD_TO_QUEUE'; songs: Song[] }
  | { type: 'SET_CURRENT_TIME'; time: number }
  | { type: 'SET_DURATION'; duration: number }
  | { type: 'SET_VOLUME'; volume: number }
  | { type: 'TRACK_ENDED' }
  | { type: 'STOP' };

// ─── State ────────────────────────────────────────────────────────────────────

const initialState: AudioPlayerState = {
  currentTrack: null,
  queue: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

function audioPlayerReducer(
  state: AudioPlayerState,
  action: AudioPlayerAction,
): AudioPlayerState {
  switch (action.type) {
    case 'PLAY':
      return {
        ...state,
        currentTrack: action.song,
        queue: action.queue ?? state.queue,
        isPlaying: true,
        currentTime: 0,
        duration: 0,
      };

    case 'PAUSE':
      return { ...state, isPlaying: false };

    case 'RESUME':
      return { ...state, isPlaying: true };

    case 'NEXT': {
      if (state.queue.length === 0) return { ...state, isPlaying: false, currentTrack: null };
      const currentIndex = state.currentTrack
        ? state.queue.findIndex((s) => s.id === state.currentTrack!.id)
        : -1;
      const nextIndex = currentIndex + 1;
      if (nextIndex >= state.queue.length) {
        // End of queue — stop
        return { ...state, isPlaying: false, currentTrack: null };
      }
      return {
        ...state,
        currentTrack: state.queue[nextIndex],
        isPlaying: true,
        currentTime: 0,
        duration: 0,
      };
    }

    case 'PREVIOUS': {
      if (state.queue.length === 0) return state;
      const currentIndex = state.currentTrack
        ? state.queue.findIndex((s) => s.id === state.currentTrack!.id)
        : -1;
      const prevIndex = currentIndex - 1;
      if (prevIndex < 0) {
        // Already at the start — restart current track
        return { ...state, currentTime: 0 };
      }
      return {
        ...state,
        currentTrack: state.queue[prevIndex],
        isPlaying: true,
        currentTime: 0,
        duration: 0,
      };
    }

    case 'ADD_TO_QUEUE':
      return { ...state, queue: [...state.queue, ...action.songs] };

    case 'SET_CURRENT_TIME':
      return { ...state, currentTime: action.time };

    case 'SET_DURATION':
      return { ...state, duration: action.duration };

    case 'SET_VOLUME':
      return { ...state, volume: Math.max(0, Math.min(1, action.volume)) };

    case 'TRACK_ENDED': {
      // Same logic as NEXT
      if (state.queue.length === 0) return { ...state, isPlaying: false, currentTrack: null };
      const currentIndex = state.currentTrack
        ? state.queue.findIndex((s) => s.id === state.currentTrack!.id)
        : -1;
      const nextIndex = currentIndex + 1;
      if (nextIndex >= state.queue.length) {
        return { ...state, isPlaying: false, currentTrack: null };
      }
      return {
        ...state,
        currentTrack: state.queue[nextIndex],
        isPlaying: true,
        currentTime: 0,
        duration: 0,
      };
    }

    case 'STOP':
      return { ...initialState, volume: state.volume };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AudioPlayerContextValue {
  state: AudioPlayerState;
  play: (song: Song, queue?: Song[]) => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  addToQueue: (songs: Song[]) => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  stop: () => void;
  audioRef: RefObject<HTMLAudioElement>;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(audioPlayerReducer, initialState);
  const audioRef = useRef<HTMLAudioElement>(new Audio());

  // Sync audio element with state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (state.currentTrack) {
      if (audio.src !== state.currentTrack.audioUrl) {
        audio.src = state.currentTrack.audioUrl;
        audio.load();
      }
      if (state.isPlaying) {
        audio.play().catch((err) => console.warn('Audio play failed:', err));
      } else {
        audio.pause();
      }
    } else {
      audio.pause();
      audio.src = '';
    }
  }, [state.currentTrack, state.isPlaying]);

  // Sync volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.volume;
    }
  }, [state.volume]);

  // Wire audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () =>
      dispatch({ type: 'SET_CURRENT_TIME', time: audio.currentTime });
    const handleDurationChange = () =>
      dispatch({ type: 'SET_DURATION', duration: audio.duration || 0 });
    const handleEnded = () => dispatch({ type: 'TRACK_ENDED' });

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const play = useCallback((song: Song, queue?: Song[]) => {
    dispatch({ type: 'PLAY', song, queue });
  }, []);

  const pause = useCallback(() => dispatch({ type: 'PAUSE' }), []);
  const resume = useCallback(() => dispatch({ type: 'RESUME' }), []);
  const next = useCallback(() => dispatch({ type: 'NEXT' }), []);
  const previous = useCallback(() => dispatch({ type: 'PREVIOUS' }), []);

  const addToQueue = useCallback((songs: Song[]) => {
    dispatch({ type: 'ADD_TO_QUEUE', songs });
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      dispatch({ type: 'SET_CURRENT_TIME', time });
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    dispatch({ type: 'SET_VOLUME', volume });
  }, []);

  const stop = useCallback(() => dispatch({ type: 'STOP' }), []);

  return (
    <AudioPlayerContext.Provider
      value={{ state, play, pause, resume, next, previous, addToQueue, seek, setVolume, stop, audioRef }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAudioPlayer(): AudioPlayerContextValue {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return ctx;
}

export default AudioPlayerContext;
