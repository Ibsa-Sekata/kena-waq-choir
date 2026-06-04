import { useAudioPlayer } from '../contexts/AudioPlayerContext';

export default function AudioPlayer() {
  const { state, pause, resume, next, previous, seek, setVolume } = useAudioPlayer();
  const { currentTrack, isPlaying, currentTime, duration, volume } = state;

  const formatTime = (s: number) => {
    if (!isFinite(s) || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      role="region"
      aria-label="Audio player"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--player-height)',
        background: 'linear-gradient(180deg, rgba(13,27,42,0.97) 0%, rgba(13,27,42,1) 100%)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(212,168,67,0.2)',
        zIndex: 400,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '0 1.25rem',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.4)',
      }}
    >
      {!currentTrack ? (
        <div style={{ width: '100%', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
          🎵 Select a song to start playing
        </div>
      ) : (
        <>
          {/* Track info */}
          <div style={{ flex: '1 1 160px', minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                flexShrink: 0,
                animation: isPlaying ? 'pulse 2s infinite' : 'none',
              }}
            >
              🎵
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--color-gold)', marginBottom: '0.1rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Now Playing
              </p>
              <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentTrack.title}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>
                {currentTrack.category}
              </p>
            </div>
          </div>

          {/* Controls + Progress */}
          <div style={{ flex: '2 1 300px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem', minWidth: 0 }}>
            {/* Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <button
                onClick={previous}
                aria-label="Previous"
                style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', transition: 'color 0.2s', padding: '0.25rem' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
              >
                ⏮
              </button>
              <button
                onClick={isPlaying ? pause : resume}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))',
                  color: 'var(--color-navy)',
                  fontSize: '1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-gold)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button
                onClick={next}
                aria-label="Next"
                style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', transition: 'color 0.2s', padding: '0.25rem' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'white')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
              >
                ⏭
              </button>
            </div>

            {/* Progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', flexShrink: 0, minWidth: 32, textAlign: 'right' }}>
                {formatTime(currentTime)}
              </span>
              <div
                style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.12)', borderRadius: 2, cursor: 'pointer', position: 'relative' }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = (e.clientX - rect.left) / rect.width;
                  seek(ratio * duration);
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, var(--color-gold), var(--color-gold-light))',
                    borderRadius: 2,
                    transition: 'width 0.1s linear',
                  }}
                />
              </div>
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', flexShrink: 0, minWidth: 32 }}>
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume */}
          <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>
              {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              aria-label="Volume"
              style={{ width: 72, accentColor: 'var(--color-gold)', cursor: 'pointer' }}
            />
          </div>
        </>
      )}
    </div>
  );
}
