import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { motion } from 'framer-motion';
import apiClient from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

const schema = yup.object({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().required('Password is required'),
});
type FormData = yup.InferType<typeof schema>;

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/auth/login', data);
      login(res.data.token, { adminId: 0, email: data.email });
      navigate('/admin');
    } catch {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--color-navy) 0%, #0a1628 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(212,168,67,0.2)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          width: '100%',
          maxWidth: 420,
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.75rem', margin: '0 auto 1rem',
          }}>🎵</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-gold)', marginBottom: '0.25rem' }}>
            Admin Panel
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.875rem' }}>
            KennaWaq Choir Management
          </p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>{error}</div>}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="form-group">
            <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Email Address</label>
            <input
              className="form-input"
              type="email"
              placeholder="admin@kennawaqchoir.com"
              {...register('email')}
              style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.15)', color: 'white' }}
            />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: 'rgba(255,255,255,0.8)' }}>Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.15)', color: 'white' }}
            />
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}
          >
            {loading ? 'Signing in…' : '🔐 Sign In'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
