import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-off-white)', textAlign: 'center',
    }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="container">
        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🎵</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--color-navy)', marginBottom: '0.75rem' }}>
          404
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--color-gray-500)', marginBottom: '2rem' }}>
          This page doesn't exist. Let's get you back to the music.
        </p>
        <Link to="/" className="btn btn-primary btn-lg">← Back to Home</Link>
      </motion.div>
    </div>
  );
}
