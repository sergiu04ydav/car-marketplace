import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch, parseJson } from '../utils/api';

/* ══════════════════════════════════════════════════════════
   REJECT MODAL
══════════════════════════════════════════════════════════ */
function RejectModal({ listing, onConfirm, onCancel }) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '12px', padding: '28px',
        width: '100%', maxWidth: '480px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        fontFamily: "'Montserrat','Segoe UI',sans-serif",
      }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 900, color: '#1a1a1a' }}>Respinge anunțul</h3>
        <p style={{ margin: '0 0 20px', color: '#666', fontSize: '13px' }}>
          <strong>{listing.title}</strong> — adaugă un motiv opțional pentru utilizator.
        </p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="ex: Imaginile nu sunt clare, prețul lipsește, conținut inadecvat…"
          rows={4}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: '7px',
            border: '1.5px solid rgba(0,0,0,0.15)', fontSize: '13px',
            fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '11px', background: '#fff', border: '1.5px solid #ddd',
            borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: '13px', fontWeight: 700, color: '#555',
          }}>Anulează</button>
          <button onClick={() => onConfirm(reason || 'Anunțul nu respectă regulile platformei.')} style={{
            flex: 1, padding: '11px', background: '#e63030', border: 'none',
            borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: '13px', fontWeight: 800, color: '#fff',
          }}>✗ Respinge</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   LISTING PREVIEW MODAL (admin view)
══════════════════════════════════════════════════════════ */
function PreviewModal({ listing, onClose, onApprove, onReject }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = listing.images?.length ? listing.images : [listing.mainImage].filter(Boolean);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1500,
      background: 'rgba(0,0,0,0.75)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '20px',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: '12px', overflow: 'hidden',
        width: '100%', maxWidth: '700px', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
        fontFamily: "'Montserrat','Segoe UI',sans-serif",
      }}>
        {/* Image */}
        <div style={{ height: '300px', background: '#111', position: 'relative', flexShrink: 0 }}>
          {images.length > 0 ? (
            <img src={images[currentIndex]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>Nicio imagine</div>
          )}
          <button onClick={onClose} style={{
            position: 'absolute', top: '12px', right: '12px',
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'rgba(0,0,0,0.55)', border: 'none', color: '#fff',
            fontSize: '18px', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>×</button>
          {images.length > 1 && (
            <div style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px' }}>
              {images.map((_, i) => (
                <button key={i} onClick={() => setCurrentIndex(i)} style={{
                  width: '8px', height: '8px', borderRadius: '50%', border: 'none',
                  background: i === currentIndex ? '#e63030' : 'rgba(255,255,255,0.6)',
                  cursor: 'pointer', padding: 0,
                }} />
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 900, color: '#1a1a1a' }}>{listing.title}</h3>
              <div style={{ fontSize: '12px', color: '#888' }}>
                Proprietar: <strong>{listing.owner?.username || listing.owner}</strong> · {listing.owner?.email}
              </div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                Adăugat: {new Date(listing.createdAt).toLocaleString('ro-MD')}
              </div>
            </div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#e63030', textAlign: 'right', flexShrink: 0 }}>
              {listing.price?.toLocaleString()} {listing.currency}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', marginBottom: '16px', fontSize: '13px' }}>
            {[
              ['Marcă / Model', `${listing.brand} ${listing.model}`],
              ['An / KM', `${listing.year} · ${listing.mileage?.toLocaleString()} km`],
              ['Combustibil', listing.fuelType],
              ['Cutie viteze', listing.transmission],
              ['Motor / Putere', `${listing.engineSize ? listing.engineSize + 'L' : '—'} · ${listing.power ? listing.power + ' CP' : '—'}`],
              ['Culoare', listing.color || '—'],
              ['Telefon', listing.phone],
              ['Localitate', listing.location?.city],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f4f4f4' }}>
                <span style={{ color: '#888' }}>{k}</span>
                <span style={{ fontWeight: 700 }}>{v || '—'}</span>
              </div>
            ))}
          </div>

          {listing.description && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '6px' }}>Descriere</div>
              <p style={{ margin: 0, fontSize: '13px', color: '#555', lineHeight: 1.6 }}>{listing.description}</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {listing.status === 'pending' && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', gap: '12px', flexShrink: 0 }}>
            <button onClick={() => { onApprove(listing.id); onClose(); }} style={{
              flex: 1, padding: '12px', background: '#10b981', border: 'none',
              borderRadius: '7px', color: '#fff', fontWeight: 800, fontSize: '14px',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>✓ Aprobă</button>
            <button onClick={() => { onReject(listing); onClose(); }} style={{
              flex: 1, padding: '12px', background: '#e63030', border: 'none',
              borderRadius: '7px', color: '#fff', fontWeight: 800, fontSize: '14px',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>✗ Respinge</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ADMIN LISTING ROW
══════════════════════════════════════════════════════════ */
function ListingRow({ listing, onApprove, onReject, onDelete, onPreview }) {
  const statusConfig = {
    pending:  { label: 'Așteptare', bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
    active:   { label: 'Activ',     bg: '#d1fae5', color: '#065f46', dot: '#10b981' },
    rejected: { label: 'Respins',   bg: '#fee2e2', color: '#991b1b', dot: '#e63030' },
    sold:     { label: 'Vândut',    bg: '#f3f4f6', color: '#374151', dot: '#9ca3af' },
    archived: { label: 'Arhivat',   bg: '#f3f4f6', color: '#374151', dot: '#9ca3af' },
  };
  const s = statusConfig[listing.status] || statusConfig.pending;

  return (
    <tr style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Image + Title */}
      <td style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img
          src={listing.mainImage || listing.images?.[0] || 'https://via.placeholder.com/80x56?text=N/A'}
          alt=""
          style={{ width: '80px', height: '54px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0, cursor: 'pointer' }}
          onClick={() => onPreview(listing)}
        />
        <div>
          <div style={{ fontWeight: 800, fontSize: '13px', color: '#1a1a1a', marginBottom: '3px', cursor: 'pointer' }}
            onClick={() => onPreview(listing)}>{listing.title}</div>
          <div style={{ fontSize: '11px', color: '#888' }}>{listing.brand} {listing.model} · {listing.year}</div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
            👤 {listing.owner?.username || '—'} · {new Date(listing.createdAt).toLocaleDateString('ro-MD')}
          </div>
        </div>
      </td>

      {/* Price */}
      <td style={{ padding: '14px 12px', fontSize: '14px', fontWeight: 900, color: '#e63030', whiteSpace: 'nowrap' }}>
        {listing.price?.toLocaleString()} {listing.currency}
      </td>

      {/* Status */}
      <td style={{ padding: '14px 12px' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
          background: s.bg, color: s.color,
        }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
          {s.label}
        </span>
      </td>

      {/* Actions */}
      <td style={{ padding: '14px 12px', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => onPreview(listing)} style={btnStyle('#fff', '#1a1a1a', '1px solid #e0e0e0')}>👁</button>
          {listing.status === 'pending' && (
            <>
              <button onClick={() => onApprove(listing.id)} style={btnStyle('#10b981', '#fff')}>✓ Aprobă</button>
              <button onClick={() => onReject(listing)} style={btnStyle('#e63030', '#fff')}>✗ Respinge</button>
            </>
          )}
          {listing.status === 'rejected' && (
            <button onClick={() => onApprove(listing.id)} style={btnStyle('#10b981', '#fff')}>✓ Aprobă</button>
          )}
          <button onClick={() => onDelete(listing.id)} style={btnStyle('#fff', '#e63030', '1px solid #e63030')}>🗑</button>
        </div>
      </td>
    </tr>
  );
}

function btnStyle(bg, color, border = 'none') {
  return {
    padding: '6px 12px', background: bg, border, color,
    borderRadius: '5px', cursor: 'pointer',
    fontSize: '12px', fontWeight: 700, fontFamily: 'inherit',
    transition: 'opacity 0.15s', whiteSpace: 'nowrap',
  };
}

/* ══════════════════════════════════════════════════════════
   ADMIN PANEL MAIN
══════════════════════════════════════════════════════════ */
export default function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [toast, setToast] = useState(null); // { msg, type }
  const [rejectTarget, setRejectTarget] = useState(null); // listing to reject
  const [previewTarget, setPreviewTarget] = useState(null); // listing to preview

  // Guard: admin only
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    loadListings();
  }, [statusFilter]);

  const loadListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: 50, sort: '-createdAt' });
      if (statusFilter !== 'all') params.append('status', statusFilter);
      const res = await apiFetch(`/api/listings/admin/all?${params}`);
      const json = await parseJson(res);
      if (json.success) {
        setListings(json.data || []);
        setStats(json.stats || {});
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApprove = async (id) => {
    try {
      const res = await apiFetch(`/api/listings/admin/${id}/approve`, { method: 'PATCH' });
      const json = await parseJson(res);
      if (json.success) {
        showToast('Anunț aprobat cu succes!');
        loadListings();
      } else { showToast(json.message || 'Eroare', 'error'); }
    } catch { showToast('Eroare la aprobare', 'error'); }
  };

  const handleRejectConfirm = async (reason) => {
    if (!rejectTarget) return;
    try {
      const res = await apiFetch(`/api/listings/admin/${rejectTarget.id}/reject`, {
        method: 'PATCH',
        body: { reason },
      });
      const json = await parseJson(res);
      if (json.success) {
        showToast('Anunț respins.');
        loadListings();
      } else { showToast(json.message || 'Eroare', 'error'); }
    } catch { showToast('Eroare la respingere', 'error'); }
    finally { setRejectTarget(null); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Ești sigur că vrei să ștergi definitiv acest anunț?')) return;
    try {
      const res = await apiFetch(`/api/listings/${id}`, { method: 'DELETE' });
      const json = await parseJson(res);
      if (json.success) {
        showToast('Anunț șters.');
        loadListings();
      } else { showToast(json.message || 'Eroare', 'error'); }
    } catch { showToast('Eroare la ștergere', 'error'); }
  };

  const STAT_CARDS = [
    { key: 'pending',  label: 'În așteptare', emoji: '⏳', color: '#f59e0b', bg: '#fef3c7' },
    { key: 'active',   label: 'Active',        emoji: '✅', color: '#10b981', bg: '#d1fae5' },
    { key: 'rejected', label: 'Respinse',      emoji: '✗',  color: '#e63030', bg: '#fee2e2' },
    { key: 'sold',     label: 'Vândute',       emoji: '💰', color: '#6366f1', bg: '#ede9fe' },
  ];

  const STATUS_TABS = [
    { key: 'pending',  label: '⏳ Așteptare' },
    { key: 'active',   label: '✅ Active' },
    { key: 'rejected', label: '✗ Respinse' },
    { key: 'sold',     label: '💰 Vândute' },
    { key: 'all',      label: '📋 Toate' },
  ];

  return (
    <div style={{
      fontFamily: "'Montserrat','Segoe UI',sans-serif",
      background: '#f4f4f5', minHeight: '100vh',
    }}>
      {/* Modals */}
      {rejectTarget && (
        <RejectModal
          listing={rejectTarget}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
        />
      )}
      {previewTarget && (
        <PreviewModal
          listing={previewTarget}
          onClose={() => setPreviewTarget(null)}
          onApprove={handleApprove}
          onReject={(l) => { setPreviewTarget(null); setRejectTarget(l); }}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 3000,
          background: toast.type === 'error' ? '#e63030' : '#10b981',
          color: '#fff', padding: '14px 20px', borderRadius: '10px',
          fontWeight: 700, fontSize: '14px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          animation: 'slideInRight 0.3s ease',
        }}>
          {toast.type === 'error' ? '⚠️' : '✅'} {toast.msg}
        </div>
      )}
      <style>{`
        @keyframes slideInRight { from { opacity: 0; transform: translateX(20px) } to { opacity: 1; transform: translateX(0) } }
      `}</style>

      {/* Header */}
      <header style={{ background: '#1a1a1a', padding: '0', boxShadow: '0 2px 12px rgba(0,0,0,0.3)' }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '0 32px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button onClick={() => navigate('/dashboard')} style={{
              background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit',
              padding: '6px 0', transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
            >← Dashboard</button>
            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)' }} />
            <div style={{ color: '#fff', fontWeight: 900, fontSize: '16px' }}>
              👑 <span style={{ color: '#e63030' }}>Admin</span> Panel
            </div>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
            {user?.username} · Administrator
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '28px 32px' }}>
        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          {STAT_CARDS.map(({ key, label, emoji, color, bg }) => (
            <div key={key} onClick={() => setStatusFilter(key)} style={{
              background: '#fff', borderRadius: '10px', padding: '20px',
              boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
              cursor: 'pointer', transition: 'all 0.2s',
              border: statusFilter === key ? `2px solid ${color}` : '2px solid transparent',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{
                width: '40px', height: '40px', borderRadius: '8px',
                background: bg, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '18px', marginBottom: '12px',
              }}>{emoji}</div>
              <div style={{ fontSize: '26px', fontWeight: 900, color, lineHeight: 1 }}>
                {stats[key] || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#888', marginTop: '4px', fontWeight: 700 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs + refresh */}
        <div style={{ background: '#fff', borderRadius: '10px', marginBottom: '20px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {STATUS_TABS.map(({ key, label }) => (
                <button key={key} onClick={() => setStatusFilter(key)} style={{
                  padding: '7px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  fontSize: '12px', fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.15s',
                  background: statusFilter === key ? '#1a1a1a' : 'transparent',
                  color: statusFilter === key ? '#fff' : '#666',
                }}>{label}</button>
              ))}
            </div>
            <button onClick={loadListings} style={{
              padding: '7px 14px', background: '#f4f4f5', border: '1px solid #e0e0e0',
              borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 700,
              fontFamily: 'inherit', color: '#555',
            }}>↻ Reîncarcă</button>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#aaa', fontSize: '14px' }}>Se încarcă…</div>
          ) : listings.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
              <div style={{ color: '#888', fontSize: '14px', fontWeight: 600 }}>
                {statusFilter === 'pending' ? 'Niciun anunț în așteptare!' : 'Nu există anunțuri.'}
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                  {['Anunț', 'Preț', 'Status', 'Acțiuni'].map(h => (
                    <th key={h} style={{
                      padding: '10px 16px', textAlign: 'left',
                      fontSize: '11px', fontWeight: 800, color: '#999',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listings.map(listing => (
                  <ListingRow
                    key={listing.id}
                    listing={listing}
                    onApprove={handleApprove}
                    onReject={(l) => setRejectTarget(l)}
                    onDelete={handleDelete}
                    onPreview={(l) => setPreviewTarget(l)}
                  />
                ))}
              </tbody>
            </table>
          )}

          {!loading && listings.length > 0 && (
            <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0', fontSize: '12px', color: '#aaa', fontWeight: 600 }}>
              {listings.length} anunț{listings.length !== 1 ? 'uri' : ''} afișat{listings.length !== 1 ? 'e' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}