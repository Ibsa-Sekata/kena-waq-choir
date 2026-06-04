import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import apiClient from '../api/axios';

const contactSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  message: yup.string().required('Message is required'),
});

const joinSchema = yup.object({
  name: yup.string().required('Name is required'),
  voiceType: yup.string().oneOf(['Soprano', 'Alto', 'Tenor', 'Bass']).required('Voice type is required'),
  experienceLevel: yup.string().required('Experience level is required'),
  message: yup.string().optional(),
});

type ContactData = yup.InferType<typeof contactSchema>;
type JoinData = yup.InferType<typeof joinSchema>;

function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContactData>({
    resolver: yupResolver(contactSchema),
  });

  const onSubmit = async (data: ContactData) => {
    setStatus('loading');
    try {
      await apiClient.post('/contact', data);
      setStatus('success');
      reset();
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="card" style={{ padding: '2rem' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.5rem' }}>
        Send Us a Message
      </h3>
      <p style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
        We'd love to hear from you. Fill out the form and we'll get back to you soon.
      </p>

      {status === 'success' && (
        <div className="alert alert-success">✅ Your message has been sent! We'll get back to you soon.</div>
      )}
      {status === 'error' && (
        <div className="alert alert-error">❌ Something went wrong. Please try again.</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-group">
          <label className="form-label">Your Name *</label>
          <input className="form-input" placeholder="John Doe" {...register('name')} />
          {errors.name && <span className="form-error">{errors.name.message}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Email Address *</label>
          <input className="form-input" type="email" placeholder="john@example.com" {...register('email')} />
          {errors.email && <span className="form-error">{errors.email.message}</span>}
        </div>
        <div className="form-group">
          <label className="form-label">Message *</label>
          <textarea className="form-textarea" placeholder="Write your message here..." {...register('message')} />
          {errors.message && <span className="form-error">{errors.message.message}</span>}
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={status === 'loading'}
          style={{ width: '100%' }}
        >
          {status === 'loading' ? 'Sending…' : '✉️ Send Message'}
        </button>
      </form>

      <div style={{ marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-gray-200)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <a
          href="https://wa.me/251900000000"
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
          style={{ textAlign: 'center', background: 'rgba(37,211,102,0.08)', borderColor: '#25d366', color: '#128c7e' }}
        >
          💬 Chat on WhatsApp
        </a>
        <a
          href="mailto:info@kennawaqchoir.com"
          className="btn btn-ghost"
          style={{ textAlign: 'center', color: 'var(--color-gray-600)' }}
        >
          📧 info@kennawaqchoir.com
        </a>
      </div>
    </div>
  );
}

function JoinForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const { register, handleSubmit, reset, formState: { errors } } = useForm<JoinData>({
    resolver: yupResolver(joinSchema),
  });

  const onSubmit = async (data: JoinData) => {
    setStatus('loading');
    try {
      await apiClient.post('/join', data);
      setStatus('success');
      reset();
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="card" style={{ padding: '2rem', background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-light) 100%)', border: '1px solid rgba(212,168,67,0.2)' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-gold)', marginBottom: '0.5rem' }}>
        Join the Choir
      </h3>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', marginBottom: '1.75rem' }}>
        We welcome all voices. Apply to become part of the KennaWaq family.
      </p>

      {status === 'success' && (
        <div className="alert alert-success">🎉 Application submitted! We'll be in touch soon.</div>
      )}
      {status === 'error' && (
        <div className="alert alert-error">❌ Something went wrong. Please try again.</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-group">
          <label className="form-label" style={{ color: 'rgba(255,255,255,0.85)' }}>Full Name *</label>
          <input className="form-input" placeholder="Your full name" {...register('name')}
            style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.15)', color: 'white' }} />
          {errors.name && <span className="form-error">{errors.name.message}</span>}
        </div>
        <div className="form-group">
          <label className="form-label" style={{ color: 'rgba(255,255,255,0.85)' }}>Voice Type *</label>
          <select className="form-select" {...register('voiceType')}
            style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.15)', color: 'white' }}>
            <option value="">Select voice type</option>
            <option value="Soprano">Soprano</option>
            <option value="Alto">Alto</option>
            <option value="Tenor">Tenor</option>
            <option value="Bass">Bass</option>
          </select>
          {errors.voiceType && <span className="form-error">{errors.voiceType.message}</span>}
        </div>
        <div className="form-group">
          <label className="form-label" style={{ color: 'rgba(255,255,255,0.85)' }}>Experience Level *</label>
          <select className="form-select" {...register('experienceLevel')}
            style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.15)', color: 'white' }}>
            <option value="">Select experience level</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="Professional">Professional</option>
          </select>
          {errors.experienceLevel && <span className="form-error">{errors.experienceLevel.message}</span>}
        </div>
        <div className="form-group">
          <label className="form-label" style={{ color: 'rgba(255,255,255,0.85)' }}>Additional Message (optional)</label>
          <textarea className="form-textarea" placeholder="Tell us about yourself..." {...register('message')}
            style={{ background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.15)', color: 'white' }} />
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={status === 'loading'}
          style={{ width: '100%' }}
        >
          {status === 'loading' ? 'Submitting…' : '🎵 Apply to Join'}
        </button>
      </form>
    </div>
  );
}

export default function ContactJoinPage() {
  return (
    <div>
      <div className="page-hero">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="page-hero-title">Contact & Join</h1>
            <p className="page-hero-subtitle">Get in touch or become part of our choir family</p>
          </motion.div>
        </div>
      </div>

      <div className="container" style={{ padding: '3rem 1.25rem' }}>
        <div className="grid-2" style={{ gap: '2rem' }}>
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <ContactForm />
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <JoinForm />
          </motion.div>
        </div>

        {/* Info cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '3rem' }}>
          {[
            { icon: '📍', title: 'Location', desc: 'Addis Ababa, Ethiopia' },
            { icon: '📞', title: 'Phone', desc: '+251 900 000 000' },
            { icon: '🕐', title: 'Rehearsals', desc: 'Every Saturday, 9AM–12PM' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{icon}</div>
              <h4 style={{ fontWeight: 700, color: 'var(--color-navy)', marginBottom: '0.25rem' }}>{title}</h4>
              <p style={{ color: 'var(--color-gray-500)', fontSize: '0.875rem' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
