import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/axios';
import AdminLayout from './AdminLayout';

type AboutContent = { id: number; mission: string; vision: string; updatedAt: string };
type Milestone = { id: number; year: number; description: string; sortOrder: number };

export default function AboutManagementPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ content: AboutContent | null; milestones: Milestone[] }>({
    queryKey: ['about'],
    queryFn: () => apiClient.get('/about').then(r => r.data),
  });

  // ── About content form state ──────────────────────────────────────────────
  const [mission, setMission] = useState('');
  const [vision, setVision] = useState('');
  const [savingContent, setSavingContent] = useState(false);
  const [contentMsg, setContentMsg] = useState('');

  useEffect(() => {
    if (data?.content) {
      setMission(data.content.mission);
      setVision(data.content.vision);
    }
  }, [data]);

  const saveContent = async () => {
    setSavingContent(true); setContentMsg('');
    try {
      await apiClient.put('/about', { mission, vision });
      qc.invalidateQueries({ queryKey: ['about'] });
      setContentMsg('✅ Saved successfully!');
    } catch { setContentMsg('❌ Failed to save. Try again.'); }
    finally { setSavingContent(false); }
  };

  // ── Milestone form state ──────────────────────────────────────────────────
  const [newYear, setNewYear] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [addingMilestone, setAddingMilestone] = useState(false);

  const addMilestone = async () => {
    if (!newYear || !newDesc.trim()) return;
    setAddingMilestone(true);
    try {
      await apiClient.put('/about', {
        milestones: [{ year: parseInt(newYear), description: newDesc.trim(), sortOrder: (data?.milestones?.length ?? 0) + 1 }],
      });
      qc.invalidateQueries({ queryKey: ['about'] });
      setNewYear(''); setNewDesc('');
    } catch { alert('Failed to add milestone.'); }
    finally { setAddingMilestone(false); }
  };

  const deleteMilestone = async (id: number) => {
    if (!window.confirm('Delete this milestone?')) return;
    try {
      await apiClient.delete(`/about/milestones/${id}`);
      qc.invalidateQueries({ queryKey: ['about'] });
    } catch { alert('Failed to delete milestone.'); }
  };

  return (
    <AdminLayout title="About Page Management">
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {[...Array(2)].map((_, i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-lg)' }} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* Mission & Vision */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-navy)', fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🎯 Mission & Vision
            </h2>

            <div className="form-group">
              <label className="form-label">Mission Statement *</label>
              <textarea
                className="form-textarea"
                value={mission}
                onChange={e => setMission(e.target.value)}
                placeholder="Our mission is..."
                style={{ minHeight: 120 }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Vision Statement *</label>
              <textarea
                className="form-textarea"
                value={vision}
                onChange={e => setVision(e.target.value)}
                placeholder="Our vision is..."
                style={{ minHeight: 120 }}
              />
            </div>

            {contentMsg && (
              <div className={`alert ${contentMsg.startsWith('✅') ? 'alert-success' : 'alert-error'}`}>
                {contentMsg}
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={saveContent}
              disabled={savingContent || !mission.trim() || !vision.trim()}
            >
              {savingContent ? 'Saving…' : '💾 Save Content'}
            </button>
          </div>

          {/* History Milestones */}
          <div style={{ background: 'white', borderRadius: 'var(--radius-lg)', padding: '1.75rem', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--color-navy)', fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📅 History Timeline
            </h2>

            {/* Add milestone form */}
            <div style={{ background: 'var(--color-gray-100)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
              <h4 style={{ fontWeight: 600, color: 'var(--color-navy)', marginBottom: '1rem', fontSize: '0.9rem' }}>Add New Milestone</h4>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <input
                  className="form-input"
                  type="number"
                  placeholder="Year (e.g. 2018)"
                  value={newYear}
                  onChange={e => setNewYear(e.target.value)}
                  style={{ width: 140 }}
                  min={1900} max={2100}
                />
                <input
                  className="form-input"
                  placeholder="Description of what happened..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  style={{ flex: 1, minWidth: 200 }}
                />
                <button
                  className="btn btn-primary"
                  onClick={addMilestone}
                  disabled={addingMilestone || !newYear || !newDesc.trim()}
                  style={{ flexShrink: 0 }}
                >
                  {addingMilestone ? 'Adding…' : '+ Add'}
                </button>
              </div>
            </div>

            {/* Milestones list */}
            {(data?.milestones ?? []).length === 0 ? (
              <p style={{ color: 'var(--color-gray-400)', textAlign: 'center', padding: '1.5rem' }}>
                No milestones yet. Add your choir's history above.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(data?.milestones ?? []).map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1rem', background: 'var(--color-gray-100)', borderRadius: 'var(--radius-md)', borderLeft: '3px solid var(--color-gold)' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-gold-dark)', fontSize: '1rem', minWidth: 48, flexShrink: 0 }}>
                      {m.year}
                    </span>
                    <p style={{ flex: 1, color: 'var(--color-gray-700)', fontSize: '0.9rem' }}>{m.description}</p>
                    <button
                      onClick={() => deleteMilestone(m.id)}
                      style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '0.25rem 0.6rem', fontSize: '0.75rem', cursor: 'pointer', flexShrink: 0 }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
