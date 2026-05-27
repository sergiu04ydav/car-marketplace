import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiFetch, parseJson } from '../utils/api';
import { useImageUpload } from '../hooks/useImageUpload';

const PAGE_SIZE = 20;

/* ══════════════════════════════════════════════════════════
   LISTING DETAIL MODAL
══════════════════════════════════════════════════════════ */
function ListingModal({ listing, onClose, isFavorited, onToggleFavorite, user }) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favLoading, setFavLoading] = useState(false);
  const images = listing.images?.length ? listing.images : [listing.mainImage].filter(Boolean);
  const hasMultiple = images.length > 1;

  const prev = (e) => { e.stopPropagation(); setCurrentIndex((i) => (i - 1 + images.length) % images.length); };
  const next = (e) => { e.stopPropagation(); setCurrentIndex((i) => (i + 1) % images.length); };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setCurrentIndex(i => (i - 1 + images.length) % images.length);
      if (e.key === 'ArrowRight') setCurrentIndex(i => (i + 1) % images.length);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, images.length]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleFav = async (e) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    setFavLoading(true);
    await onToggleFavorite(listing.id);
    setFavLoading(false);
  };

  const isSold = listing.status === 'sold';

  const specs = [
    { label: 'Marcă', value: listing.brand },
    { label: 'Model', value: listing.model },
    { label: 'An', value: listing.year },
    { label: 'Kilometraj', value: listing.mileage ? `${listing.mileage.toLocaleString()} km` : null },
    { label: 'Motor', value: listing.engineSize ? `${listing.engineSize}L` : null },
    { label: 'Putere', value: listing.power ? `${listing.power} CP` : null },
    { label: 'Combustibil', value: listing.fuelType },
    { label: 'Cutie viteze', value: listing.transmission },
    { label: 'Culoare', value: listing.color },
    { label: 'Locație', value: listing.location?.city },
  ].filter(s => s.value);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', backdropFilter: 'blur(8px)',
    }}>
      <style>{`
        @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(12px) } to { opacity:1; transform:scale(1) translateY(0) } }
        .modal-main { animation: modalIn 0.24s cubic-bezier(0.34,1.56,0.64,1); }
        .img-nav:hover { background: rgba(255,255,255,0.22) !important; }
        .thumb-btn { transition: all 0.15s; }
        .thumb-btn:hover { opacity: 1 !important; transform: scale(1.06) !important; }
        .fav-btn { transition: all 0.2s; }
        .fav-btn:hover { transform: scale(1.12); }
        .spec-item:hover { background: #f8f8f8 !important; }
        @keyframes fadeImg { from { opacity:0.6 } to { opacity:1 } }
        @media (max-width: 640px) {
          .modal-main { flex-direction: column !important; max-width: 100% !important; }
          .modal-gallery-col { width: 100% !important; height: 220px !important; }
          .modal-detail-col { max-height: 60vh !important; }
        }
      `}</style>

      <div className="modal-main" onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: '20px', overflow: 'hidden',
        width: '100%', maxWidth: '980px',
        maxHeight: '92vh',
        display: 'flex', flexDirection: 'row',
        boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
        fontFamily: "'Montserrat','Segoe UI',sans-serif",
        position: 'relative',
      }}>
        {/* CLOSE */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px', zIndex: 30,
          width: '36px', height: '36px', borderRadius: '50%',
          background: 'rgba(0,0,0,0.6)', border: 'none',
          color: '#fff', fontSize: '20px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)', transition: 'background 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.9)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
        >×</button>

        {/* FAVORITE */}
        <button onClick={handleFav} disabled={favLoading} className="fav-btn" style={{
          position: 'absolute', top: '16px', right: '60px', zIndex: 30,
          width: '36px', height: '36px', borderRadius: '50%',
          background: isFavorited ? '#e63030' : 'rgba(0,0,0,0.5)',
          border: isFavorited ? 'none' : '2px solid rgba(255,255,255,0.3)',
          color: '#fff', fontSize: '16px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }}>
          {isFavorited ? '♥' : '♡'}
        </button>

        {/* LEFT: GALLERY */}
        <div className="modal-gallery-col" style={{ width: '52%', flexShrink: 0, background: '#0d0d0d', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
            {images.length > 0 ? (
              <img key={currentIndex} src={images[currentIndex]} alt={listing.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', animation: 'fadeImg 0.2s ease' }} />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '13px' }}>Fără imagini</div>
              </div>
            )}
            {isSold && (
              <div style={{ position: 'absolute', top: '16px', left: '16px', background: 'linear-gradient(135deg,#e63030,#ff6b6b)', color: '#fff', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', boxShadow: '0 4px 14px rgba(230,48,48,0.5)' }}>
                VÂNDUT
              </div>
            )}
            {hasMultiple && (
              <>
                <button className="img-nav" onClick={prev} style={{
                  position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff', fontSize: '22px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(6px)',
                }}>‹</button>
                <button className="img-nav" onClick={next} style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff', fontSize: '22px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(6px)',
                }}>›</button>
                <div style={{
                  position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.6)', color: '#fff',
                  padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                  backdropFilter: 'blur(4px)',
                }}>
                  {currentIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>

          {hasMultiple && (
            <div style={{ display: 'flex', gap: '4px', padding: '8px 10px', background: '#111', overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'thin', scrollbarColor: '#333 #111' }}>
              {images.map((src, i) => (
                <button key={i} className="thumb-btn" onClick={e => { e.stopPropagation(); setCurrentIndex(i); }} style={{
                  width: '56px', height: '40px', borderRadius: '6px', flexShrink: 0,
                  overflow: 'hidden', padding: 0, background: '#000', cursor: 'pointer',
                  border: i === currentIndex ? '2px solid #e63030' : '2px solid transparent',
                  opacity: i === currentIndex ? 1 : 0.5,
                }}>
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: DETAILS */}
        <div className="modal-detail-col" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ padding: '28px 28px 20px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ margin: '0 0 6px', fontSize: '19px', fontWeight: 900, color: '#111', lineHeight: 1.25, paddingRight: '80px' }}>
                  {listing.title}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', color: '#888' }}>{listing.location?.city || 'N/A'}{listing.location?.country ? `, ${listing.location.country}` : ''}</span>
                  {listing.views > 0 && <span style={{ fontSize: '12px', color: '#bbb' }}>— {listing.views} vizualizări</span>}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '28px', fontWeight: 900, color: '#e63030', lineHeight: 1 }}>
                  {listing.price?.toLocaleString()}
                </div>
                <div style={{ fontSize: '12px', color: '#999', fontWeight: 700 }}>{listing.currency}</div>
              </div>
            </div>

            {listing.owner && (
              <div onClick={() => { onClose(); navigate(`/profile/${listing.owner?.id || listing.owner?._id || listing.owner}`); }}
                style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '6px 12px', borderRadius: '8px', background: '#f8f8f8', border: '1px solid #eee', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.borderColor = '#e63030'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f8f8f8'; e.currentTarget.style.borderColor = '#eee'; }}
              >
                <div style={{ width: '26px', height: '26px', borderRadius: '50%', overflow: 'hidden', background: '#e63030', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: 900, flexShrink: 0 }}>
                  {listing.owner?.avatar && listing.owner.avatar.startsWith('http')
                    ? <img src={listing.owner.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (listing.owner?.username?.[0] || '?').toUpperCase()}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#333' }}>{listing.owner?.username || 'Vânzător'}</span>
                <span style={{ fontSize: '11px', color: '#e63030', fontWeight: 700 }}>Profil</span>
              </div>
            )}
          </div>

          {/* Specs grid */}
          <div style={{ padding: '20px 28px', borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ fontSize: '11px', fontWeight: 900, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Specificații tehnice</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
              {specs.map(({ label, value }) => (
                <div key={label} className="spec-item" style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 10px', borderRadius: '8px',
                  transition: 'background 0.15s',
                }}>
                  <div>
                    <div style={{ fontSize: '10px', color: '#bbb', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#1a1a1a' }}>{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {listing.description && (
            <div style={{ padding: '20px 28px', borderBottom: listing.features?.length > 0 ? '1px solid #f0f0f0' : 'none' }}>
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Descriere</div>
              <p style={{ color: '#555', fontSize: '14px', lineHeight: 1.75, margin: 0 }}>{listing.description}</p>
            </div>
          )}

          {listing.features?.length > 0 && (
            <div style={{ padding: '20px 28px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>Dotări</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {listing.features.map((f, i) => (
                  <span key={i} style={{ background: 'rgba(230,48,48,0.07)', color: '#c02020', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, border: '1px solid rgba(230,48,48,0.15)' }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Contact — număr fără buton sună */}
          {listing.phone && (
            <div style={{ padding: '20px 28px', marginTop: 'auto' }}>
              <div style={{ background: '#1a1a1a', borderRadius: '14px', padding: '20px 22px' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
                  Contact vânzător
                </div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#fff', letterSpacing: '0.03em' }}>
                  {listing.phone}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   LISTING CARD
══════════════════════════════════════════════════════════ */
function ListingCard({ listing, showActions, onDelete, onMarkSold, onEdit, onClick, isFavorited, onToggleFavorite, user }) {
  const navigate = useNavigate();
  const isSold = listing.status === 'sold';
  const isPending = listing.status === 'pending';
  const isRejected = listing.status === 'rejected';
  const [favLoading, setFavLoading] = useState(false);

  const statusBadge = isPending
    ? { label: 'AȘTEPTARE', bg: '#f59e0b' }
    : isRejected
    ? { label: 'RESPINS', bg: '#6b7280' }
    : isSold
    ? { label: 'VÂNDUT', bg: '#e63030' }
    : null;

  const handleFav = async (e) => {
    e.stopPropagation();
    if (!user) { navigate('/login'); return; }
    setFavLoading(true);
    await onToggleFavorite(listing.id);
    setFavLoading(false);
  };

  return (
    <div onClick={onClick} style={{
      background: '#fff', borderRadius: '12px',
      overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s',
      opacity: (isPending || isRejected) ? 0.85 : 1,
      position: 'relative', cursor: 'pointer',
      fontFamily: "'Montserrat','Segoe UI',sans-serif",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.13)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'; }}
    >
      {statusBadge && (
        <div style={{ position: 'absolute', top: '10px', left: '10px', background: statusBadge.bg, color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 900, zIndex: 10, letterSpacing: '0.08em' }}>
          {statusBadge.label}
        </div>
      )}

      {!showActions && onToggleFavorite && (
        <button onClick={handleFav} disabled={favLoading} style={{
          position: 'absolute', top: '10px', right: '10px', zIndex: 10,
          width: '34px', height: '34px', borderRadius: '50%',
          background: isFavorited ? '#e63030' : 'rgba(255,255,255,0.9)',
          border: isFavorited ? 'none' : '1px solid rgba(0,0,0,0.1)',
          color: isFavorited ? '#fff' : '#999',
          fontSize: '16px', cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => { if (!isFavorited) { e.currentTarget.style.color = '#e63030'; e.currentTarget.style.borderColor = '#e63030'; } }}
          onMouseLeave={e => { if (!isFavorited) { e.currentTarget.style.color = '#999'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; } }}
        >
          {isFavorited ? '♥' : '♡'}
        </button>
      )}

      <div style={{ height: '196px', overflow: 'hidden', background: '#f2f2f2', position: 'relative' }}>
        <img
          src={listing.mainImage || listing.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
          alt={listing.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.35s ease' }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        />
        {listing.images?.length > 1 && (
          <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.6)', color: '#fff', padding: '2px 9px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>
            {listing.images.length} foto
          </div>
        )}
        {isSold && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#e63030', color: '#fff', padding: '8px 20px', borderRadius: '20px', fontSize: '13px', fontWeight: 900, letterSpacing: '0.08em', transform: 'rotate(-4deg)' }}>VÂNDUT</div>
          </div>
        )}
      </div>

      <div style={{ padding: '14px 16px 16px' }}>
        <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 800, color: '#111', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {listing.title}
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
          {[listing.fuelType, listing.transmission].filter(Boolean).map(t => (
            <span key={t} style={{ fontSize: '11px', fontWeight: 700, color: '#e63030', background: 'rgba(230,48,48,0.08)', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(230,48,48,0.12)' }}>{t}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
          {[`${listing.brand} ${listing.model}`, `${listing.year}`, listing.mileage ? `${listing.mileage.toLocaleString()} km` : null].filter(Boolean).map(t => (
            <span key={t} style={{ fontSize: '12px', color: '#777', background: '#f5f5f5', padding: '2px 8px', borderRadius: '4px' }}>{t}</span>
          ))}
        </div>
        {isRejected && listing.rejectionReason && (
          <div style={{ fontSize: '12px', color: '#e63030', background: 'rgba(230,48,48,0.06)', padding: '6px 10px', borderRadius: '6px', marginBottom: '8px', fontWeight: 600 }}>
            {listing.rejectionReason}
          </div>
        )}
        <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '10px' }}>{listing.location?.city || 'N/A'}</div>
        <div style={{ fontSize: '22px', fontWeight: 900, color: '#e63030', marginBottom: showActions ? '12px' : 0 }}>
          {listing.price?.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: 700 }}>{listing.currency}</span>
        </div>
        {showActions && (
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: '6px', paddingTop: '12px', borderTop: '1px solid #f0f0f0', flexWrap: 'wrap' }}>
            <button onClick={() => onEdit(listing)} style={{ flex: 1, padding: '8px', background: '#fff', border: '1px solid #3b82f6', color: '#3b82f6', fontWeight: 700, fontSize: '12px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', minWidth: '60px' }}
              onMouseEnter={e => { e.target.style.background = '#3b82f6'; e.target.style.color = '#fff'; }}
              onMouseLeave={e => { e.target.style.background = '#fff'; e.target.style.color = '#3b82f6'; }}
            >Editează</button>
            {!isSold && listing.status === 'active' && (
              <button onClick={() => onMarkSold(listing.id)} style={{ flex: 1, padding: '8px', background: '#10b981', border: 'none', color: '#fff', fontWeight: 700, fontSize: '12px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', minWidth: '60px' }}
                onMouseEnter={e => e.target.style.background = '#059669'}
                onMouseLeave={e => e.target.style.background = '#10b981'}
              >Vândut</button>
            )}
            <button onClick={() => onDelete(listing.id)} style={{ flex: 1, padding: '8px', background: '#fff', border: '1px solid #e63030', color: '#e63030', fontWeight: 700, fontSize: '12px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s', minWidth: '60px' }}
              onMouseEnter={e => { e.target.style.background = '#e63030'; e.target.style.color = '#fff'; }}
              onMouseLeave={e => { e.target.style.background = '#fff'; e.target.style.color = '#e63030'; }}
            >Șterge</button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PAGINATION
══════════════════════════════════════════════════════════ */
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '36px', paddingBottom: '8px', flexWrap: 'wrap' }}>
      <button onClick={() => onChange(page - 1)} disabled={page === 1} style={{
        padding: '8px 14px', background: page === 1 ? '#f5f5f5' : '#fff',
        border: '1.5px solid #e8e8e8', borderRadius: '8px', cursor: page === 1 ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, color: page === 1 ? '#ccc' : '#333',
        transition: 'all 0.2s',
      }}>Înapoi</button>

      {pages.map((p, i) => (
        p === '...' ? (
          <span key={`dot-${i}`} style={{ color: '#ccc', fontSize: '14px', padding: '0 4px' }}>…</span>
        ) : (
          <button key={p} onClick={() => onChange(p)} style={{
            width: '38px', height: '38px', borderRadius: '8px',
            background: p === page ? '#e63030' : '#fff',
            border: p === page ? '1.5px solid #e63030' : '1.5px solid #e8e8e8',
            color: p === page ? '#fff' : '#333',
            fontWeight: 800, fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.2s',
          }}>{p}</button>
        )
      ))}

      <button onClick={() => onChange(page + 1)} disabled={page === totalPages} style={{
        padding: '8px 14px', background: page === totalPages ? '#f5f5f5' : '#fff',
        border: '1.5px solid #e8e8e8', borderRadius: '8px', cursor: page === totalPages ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit', fontSize: '13px', fontWeight: 700, color: page === totalPages ? '#ccc' : '#333',
        transition: 'all 0.2s',
      }}>Următor</button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer style={{
      background: '#111',
      marginTop: '64px',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      fontFamily: "'Montserrat','Segoe UI',sans-serif",
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '48px 20px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '32px', marginBottom: '40px' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#e63030', letterSpacing: '0.05em', marginBottom: '12px' }}>
              AUTOMARKET<span style={{ color: 'rgba(255,255,255,0.35)' }}>.MD</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', lineHeight: 1.7, margin: '0 0 20px', maxWidth: '260px' }}>
              Cea mai mare platformă de anunțuri auto din Moldova.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {['079 700 509 — sec. Rîșcani', '079 700 502 — sec. Botanica', 'contact@automarket.md'].map(t => (
                <span key={t} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{t}</span>
              ))}
            </div>
          </div>

          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Navigare</div>
            {['Acasă', 'Anunțuri', 'Adaugă anunț', 'Contul meu'].map(item => (
              <div key={item} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '10px', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#e63030'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
              >{item}</div>
            ))}
          </div>

          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Servicii</div>
            {['Credit auto', 'Leasing', 'Asigurare', 'Inspecție tehnică'].map(item => (
              <div key={item} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '10px', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#e63030'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
              >{item}</div>
            ))}
          </div>

          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Legal</div>
            {['Termeni și condiții', 'Confidențialitate', 'Cookies', 'Contact'].map(item => (
              <div key={item} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '10px', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#e63030'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
              >{item}</div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>
            © {new Date().getFullYear()} AutoMarket MD. Toate drepturile rezervate.
          </div>
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>Moldova</div>
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
function LoadingGrid() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          <div style={{ height: '196px', background: 'linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
          <div style={{ padding: '16px' }}>
            {[80, 60, 45].map(w => <div key={w} style={{ height: '11px', background: '#f0f0f0', borderRadius: '4px', marginBottom: '10px', width: `${w}%` }} />)}
          </div>
        </div>
      ))}
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </div>
  );
}

function EmptyState({ msg, onAction, actionLabel, icon = '—' }) {
  return (
    <div style={{ textAlign: 'center', padding: '72px 32px', background: '#fff', borderRadius: '16px', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px', color: '#ddd', fontWeight: 900 }}>{icon}</div>
      <p style={{ color: '#888', fontSize: '15px', margin: '0 0 24px' }}>{msg}</p>
      {onAction && <button onClick={onAction} style={{ padding: '11px 32px', background: '#e63030', border: 'none', color: '#fff', fontWeight: 800, fontSize: '14px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(230,48,48,0.3)' }}>{actionLabel}</button>}
    </div>
  );
}

function HeaderAvatar({ user }) {
  const [imgError, setImgError] = useState(false);
  const initial = user?.username?.[0]?.toUpperCase() || '?';
  const valid = user?.avatar && user.avatar.startsWith('http') && !imgError;
  return valid
    ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgError(true)} />
    : <div style={{ width: '100%', height: '100%', background: '#e63030', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '16px' }}>{initial}</div>;
}

/* ══════════════════════════════════════════════════════════
   IMAGE UPLOAD ZONE
══════════════════════════════════════════════════════════ */
function ImageUploadZone({ images, setImages, uploading, uploadError, isDragging, getRootProps, getInputProps, removeImage, moveImage }) {
  return (
    <div>
      <div {...getRootProps()} style={{
        border: `2px dashed ${isDragging ? '#e63030' : 'rgba(0,0,0,0.15)'}`,
        borderRadius: '10px', padding: '32px 20px', textAlign: 'center',
        background: isDragging ? 'rgba(230,48,48,0.04)' : '#fafafa',
        transition: 'all 0.2s', cursor: 'pointer', marginBottom: '16px',
      }}>
        <input {...getInputProps()} />
        <div style={{ fontSize: '32px', marginBottom: '8px', color: '#ccc' }}>↑</div>
        <div style={{ fontWeight: 700, color: '#1a1a1a', fontSize: '14px', marginBottom: '4px' }}>
          {uploading ? 'Se încarcă…' : 'Trage imaginile aici sau apasă pentru a le selecta'}
        </div>
        <div style={{ color: '#999', fontSize: '12px' }}>JPG, PNG, WebP — Max 10MB — Max 10 imagini</div>
        {uploading && <div style={{ marginTop: '12px', height: '3px', background: '#f0f0f0', borderRadius: '2px', overflow: 'hidden' }}><div style={{ height: '100%', background: '#e63030', width: '60%', animation: 'shimmer 1.5s infinite' }} /></div>}
      </div>
      {uploadError && <div style={{ color: '#e63030', fontSize: '13px', marginBottom: '12px', fontWeight: 600 }}>{uploadError}</div>}
      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
          {images.map((url, i) => (
            <div key={url} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '4/3', background: '#f0f0f0', border: i === 0 ? '2px solid #e63030' : '2px solid transparent' }}>
              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {i === 0 && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(230,48,48,0.85)', color: '#fff', fontSize: '9px', fontWeight: 800, textAlign: 'center', padding: '2px' }}>PRINCIPALĂ</div>}
              <button onClick={() => removeImage(i)} style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   LISTING FORM
══════════════════════════════════════════════════════════ */
function ListingForm({ initialData, onSubmit, loading, uploading, images, setImages, uploadError, isDragging, getRootProps, getInputProps, removeImage, moveImage, submitLabel, error, success }) {
  const defaultForm = {
    title: '', description: '', brand: '', model: '',
    year: new Date().getFullYear(), mileage: '', price: '', currency: 'EUR',
    fuelType: 'Benzină', transmission: 'Manuală',
    engineSize: '', power: '', color: '', city: 'Chișinău', country: 'Moldova', phone: '', features: '',
  };
  const [formData, setFormData] = useState(initialData || defaultForm);

  useEffect(() => { if (initialData) setFormData(initialData); }, [initialData]);

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value }));
  };

  const handleSubmit = e => { e.preventDefault(); onSubmit(formData); };

  const inp = { padding: '11px 14px', border: '1.5px solid #e8e8e8', borderRadius: '8px', fontSize: '14px', color: '#333', background: '#fff', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', width: '100%' };
  const lbl = { fontSize: '11px', fontWeight: 800, color: '#999', textTransform: 'uppercase', letterSpacing: '0.07em', display: 'block', marginBottom: '6px' };
  const grp = { display: 'flex', flexDirection: 'column', gap: '4px' };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {error && <div style={{ background: '#e63030', color: '#fff', padding: '12px 20px', borderRadius: '8px', fontWeight: 700, fontSize: '14px' }}>{error}</div>}
      {success && <div style={{ background: '#10b981', color: '#fff', padding: '12px 20px', borderRadius: '8px', fontWeight: 700, fontSize: '14px' }}>{success}</div>}

      <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '12px', fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Informații de bază</div>
        <div style={{ display: 'grid', gap: '14px' }}>
          <div style={grp}><label style={lbl}>Titlu anunț *</label><input name="title" value={formData.title} onChange={handleInputChange} required placeholder="ex: BMW 320d xDrive 2020, stare perfectă" style={inp} onFocus={e => e.target.style.borderColor = '#e63030'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} /></div>
          <div style={grp}><label style={lbl}>Descriere *</label><textarea name="description" value={formData.description} onChange={handleInputChange} required rows={4} placeholder="Descrieți mașina: dotări, stare, istoricul, motive vânzare…" style={{ ...inp, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = '#e63030'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={grp}><label style={lbl}>Marcă *</label><input name="brand" value={formData.brand} onChange={handleInputChange} required placeholder="BMW" style={inp} onFocus={e => e.target.style.borderColor = '#e63030'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} /></div>
            <div style={grp}><label style={lbl}>Model *</label><input name="model" value={formData.model} onChange={handleInputChange} required placeholder="320d" style={inp} onFocus={e => e.target.style.borderColor = '#e63030'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} /></div>
          </div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '12px', fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Detalii tehnice</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '14px' }}>
          {[{ name: 'year', label: 'An fabricație *', type: 'number' }, { name: 'mileage', label: 'Kilometraj (km) *', type: 'number' }, { name: 'engineSize', label: 'Motor (L)', type: 'number', step: '0.1' }, { name: 'power', label: 'Putere (CP)', type: 'number' }, { name: 'color', label: 'Culoare' }].map(f => (
            <div key={f.name} style={grp}><label style={lbl}>{f.label}</label><input {...f} value={formData[f.name]} onChange={handleInputChange} required={f.label.includes('*')} style={inp} onFocus={e => e.target.style.borderColor = '#e63030'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} /></div>
          ))}
          <div style={grp}><label style={lbl}>Combustibil *</label><select name="fuelType" value={formData.fuelType} onChange={handleInputChange} style={inp}>{['Benzină', 'Diesel', 'Electric', 'Hibrid', 'GPL', 'Gaz'].map(v => <option key={v}>{v}</option>)}</select></div>
          <div style={grp}><label style={lbl}>Cutie viteze *</label><select name="transmission" value={formData.transmission} onChange={handleInputChange} style={inp}>{['Manuală', 'Automată', 'Robotizată', 'CVT'].map(v => <option key={v}>{v}</option>)}</select></div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '12px', fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Preț & Contact</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '14px' }}>
          <div style={grp}><label style={lbl}>Preț *</label><input name="price" type="number" value={formData.price} onChange={handleInputChange} required placeholder="12500" style={inp} onFocus={e => e.target.style.borderColor = '#e63030'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} /></div>
          <div style={grp}><label style={lbl}>Monedă</label><select name="currency" value={formData.currency} onChange={handleInputChange} style={inp}>{['EUR', 'USD', 'MDL', 'RON'].map(v => <option key={v}>{v}</option>)}</select></div>
          <div style={grp}><label style={lbl}>Oraș *</label><input name="city" value={formData.city} onChange={handleInputChange} required style={inp} onFocus={e => e.target.style.borderColor = '#e63030'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} /></div>
          <div style={grp}><label style={lbl}>Telefon *</label><input name="phone" value={formData.phone} onChange={handleInputChange} required placeholder="+373 69 000 000" style={inp} onFocus={e => e.target.style.borderColor = '#e63030'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} /></div>
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '12px', fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Imagini ({images.length}/10)</div>
        <ImageUploadZone images={images} setImages={setImages} uploading={uploading} uploadError={uploadError} isDragging={isDragging} getRootProps={getRootProps} getInputProps={getInputProps} removeImage={removeImage} moveImage={moveImage} />
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: '12px', fontWeight: 900, color: '#111', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '16px' }}>Dotări opționale</div>
        <textarea name="features" value={formData.features} onChange={handleInputChange} rows={3} placeholder="Climatronic, Navigație, Senzori parcare, Camera marșarier…" style={{ ...inp, resize: 'vertical' }} onFocus={e => e.target.style.borderColor = '#e63030'} onBlur={e => e.target.style.borderColor = '#e8e8e8'} />
        <div style={{ fontSize: '12px', color: '#bbb', marginTop: '6px' }}>Separați dotările cu virgulă</div>
      </div>

      <button type="submit" disabled={loading || uploading} style={{
        width: '100%', padding: '15px', background: loading ? '#9b1c1c' : '#e63030',
        border: 'none', color: '#fff', fontWeight: 900, fontSize: '15px',
        borderRadius: '10px', cursor: loading || uploading ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.06em',
        boxShadow: '0 4px 16px rgba(230,48,48,0.35)',
        opacity: loading || uploading ? 0.7 : 1, transition: 'all 0.2s',
      }}>
        {uploading ? 'Se încarcă imaginile…' : loading ? 'Se procesează…' : submitLabel}
      </button>
    </form>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('browse');
  const [listings, setListings] = useState([]);
  const [allListings, setAllListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);
  const [editingListing, setEditingListing] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [favoriteListings, setFavoriteListings] = useState([]);

  const [filters, setFilters] = useState({ brand: '', minPrice: '', maxPrice: '', fuelType: '', transmission: '' });

  const { images, setImages, uploading, uploadError, isDragging, getRootProps, getInputProps, removeImage, moveImage } = useImageUpload({ maxImages: 10 });
  const { images: editImages, setImages: setEditImages, uploading: editUploading, uploadError: editUploadError, isDragging: editIsDragging, getRootProps: editGetRootProps, getInputProps: editGetInputProps, removeImage: editRemoveImage, moveImage: editMoveImage } = useImageUpload({ maxImages: 10 });

  useEffect(() => {
    if (user) loadFavoriteIds();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'my-listings') loadMyListings();
    else if (activeTab === 'browse') loadAllListings();
    else if (activeTab === 'favorites') loadFavorites();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'browse') loadAllListings();
  }, [page]);

  const loadFavoriteIds = async () => {
    try {
      const res = await apiFetch('/api/favorites/ids');
      const json = await parseJson(res);
      if (json.success) setFavoriteIds(new Set(json.ids));
    } catch { }
  };

  const loadFavorites = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/favorites');
      const json = await parseJson(res);
      if (json.success) setFavoriteListings(json.data || []);
    } catch { }
    finally { setLoading(false); }
  };

  const handleToggleFavorite = async (listingId) => {
    if (!user) { navigate('/login'); return; }
    try {
      const res = await apiFetch(`/api/favorites/toggle/${listingId}`, { method: 'POST' });
      const json = await parseJson(res);
      if (json.success) {
        setFavoriteIds(prev => {
          const next = new Set(prev);
          if (json.favorited) next.add(listingId);
          else next.delete(listingId);
          return next;
        });
        if (activeTab === 'favorites') loadFavorites();
      }
    } catch { }
  };

  const loadMyListings = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/listings/user/my-listings');
      const json = await parseJson(res);
      if (json.success) setListings(json.data || []);
    } catch { }
    finally { setLoading(false); }
  };

  const loadAllListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: PAGE_SIZE, page, status: 'active' });
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.fuelType) params.append('fuelType', filters.fuelType);
      if (filters.transmission) params.append('transmission', filters.transmission);
      const res = await apiFetch(`/api/listings?${params}`);
      const json = await parseJson(res);
      if (json.success) {
        setAllListings(json.data || []);
        setTotalCount(json.pagination?.total || 0);
        setTotalPages(json.pagination?.pages || 1);
      }
    } catch { }
    finally { setLoading(false); }
  };

  const handleSearch = () => { setPage(1); loadAllListings(); };

  const handleAddSubmit = async (formData) => {
    setError(''); setSuccess(''); setLoading(true);
    try {
      const dataToSend = { ...formData, year: Number(formData.year), mileage: Number(formData.mileage), price: Number(formData.price), engineSize: formData.engineSize ? Number(formData.engineSize) : undefined, power: formData.power ? Number(formData.power) : undefined, location: { city: formData.city, country: formData.country }, features: formData.features ? formData.features.split(',').map(f => f.trim()).filter(Boolean) : [], images: images.length ? images : ['https://via.placeholder.com/800x600?text=No+Image'], mainImage: images[0] || null };
      const res = await apiFetch('/api/listings', { method: 'POST', body: dataToSend });
      const json = await parseJson(res);
      if (json.success) { setSuccess('Anunțul a fost trimis spre aprobare!'); setImages([]); setTimeout(() => { setActiveTab('my-listings'); setSuccess(''); }, 2500); }
      else { setError(json.message || 'Eroare la adăugare'); }
    } catch { setError('Eroare la trimitere'); }
    finally { setLoading(false); }
  };

  const handleEditSubmit = async (formData) => {
    if (!editingListing) return;
    setError(''); setSuccess(''); setLoading(true);
    try {
      const dataToSend = { ...formData, year: Number(formData.year), mileage: Number(formData.mileage), price: Number(formData.price), engineSize: formData.engineSize ? Number(formData.engineSize) : undefined, power: formData.power ? Number(formData.power) : undefined, location: { city: formData.city, country: formData.country }, features: formData.features ? formData.features.split(',').map(f => f.trim()).filter(Boolean) : [], images: editImages.length ? editImages : editingListing.images || [], mainImage: editImages[0] || editingListing.mainImage || null };
      const res = await apiFetch(`/api/listings/${editingListing.id}`, { method: 'PUT', body: dataToSend });
      const json = await parseJson(res);
      if (json.success) { setSuccess('Actualizat și trimis spre re-aprobare!'); setEditingListing(null); loadMyListings(); setTimeout(() => setSuccess(''), 3000); }
      else { setError(json.message || 'Eroare la actualizare'); }
    } catch { setError('Eroare la trimitere'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Ștergi acest anunț?')) return;
    const res = await apiFetch(`/api/listings/${id}`, { method: 'DELETE' });
    const json = await parseJson(res);
    if (json.success) { setListings(p => p.filter(l => l.id !== id)); setSuccess('Anunț șters!'); setTimeout(() => setSuccess(''), 3000); }
  };

  const handleMarkSold = async (id) => {
    const res = await apiFetch(`/api/listings/${id}/mark-sold`, { method: 'PATCH' });
    const json = await parseJson(res);
    if (json.success) { loadMyListings(); setSuccess('Marcat ca vândut!'); setTimeout(() => setSuccess(''), 3000); }
  };

  const handleStartEdit = (listing) => {
    const initialData = { id: listing.id, title: listing.title || '', description: listing.description || '', brand: listing.brand || '', model: listing.model || '', year: listing.year || new Date().getFullYear(), mileage: listing.mileage || '', price: listing.price || '', currency: listing.currency || 'EUR', fuelType: listing.fuelType || 'Benzină', transmission: listing.transmission || 'Manuală', engineSize: listing.engineSize || '', power: listing.power || '', color: listing.color || '', city: listing.location?.city || 'Chișinău', country: listing.location?.country || 'Moldova', phone: listing.phone || '', features: Array.isArray(listing.features) ? listing.features.join(', ') : '' };
    setEditingListing(initialData);
    setEditImages(listing.images || []);
    setActiveTab('edit-listing');
    setError(''); setSuccess('');
  };

  const handleLogout = async () => { await signOut(); navigate('/', { replace: true }); };

  const NAV_TABS = [
    { id: 'browse', label: 'Caută' },
    ...(user ? [
      { id: 'favorites', label: `Favorite${favoriteIds.size > 0 ? ` (${favoriteIds.size})` : ''}` },
      { id: 'my-listings', label: 'Anunțurile Mele' },
      { id: 'add-listing', label: '+ Adaugă' },
    ] : []),
    ...(user?.role === 'admin' ? [{ id: 'admin', label: 'Admin' }] : []),
  ];

  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', border: '1.5px solid rgba(0,0,0,0.1)', background: '#fafafa', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' };

  return (
    <div style={{ fontFamily: "'Montserrat','Segoe UI',sans-serif", background: '#f0f0f0', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @media (max-width: 768px) {
          .dash-nav { display: none !important; }
          .dash-hamburger { display: flex !important; }
          .dash-mobile-menu { display: flex !important; }
          .dash-header-inner { padding: 0 16px !important; }
          .dash-main { padding: 16px !important; }
          .dash-filter-grid { grid-template-columns: 1fr 1fr !important; }
          .dash-listings-grid { grid-template-columns: 1fr 1fr !important; }
          .dash-form-2col { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .dash-listings-grid { grid-template-columns: 1fr !important; }
          .dash-filter-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) {
          .dash-hamburger { display: none !important; }
          .dash-mobile-menu { display: none !important; }
        }
      `}</style>

      {selectedListing && (
        <ListingModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          isFavorited={favoriteIds.has(selectedListing.id)}
          onToggleFavorite={handleToggleFavorite}
          user={user}
        />
      )}

      {/* HEADER */}
      <header style={{ background: '#1a1a1a', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 20px rgba(0,0,0,0.35)' }}>
        <div className="dash-header-inner" style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', gap: '12px' }}>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#e63030', letterSpacing: '0.05em', cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate('/')}>
            AUTOMARKET<span style={{ color: 'rgba(255,255,255,0.35)' }}>.MD</span>
          </div>

          {/* Desktop nav */}
          <nav className="dash-nav" style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', overflow: 'hidden' }}>
            {NAV_TABS.map(tab => (
              <button key={tab.id} onClick={() => {
                if (tab.id === 'admin') { navigate('/admin'); return; }
                setActiveTab(tab.id); setError(''); setSuccess(''); setMobileMenuOpen(false);
              }} style={{
                background: activeTab === tab.id ? '#e63030' : 'transparent',
                border: activeTab === tab.id ? '1px solid #e63030' : '1px solid rgba(255,255,255,0.1)',
                color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.6)',
                padding: '7px 14px', borderRadius: '7px', cursor: 'pointer',
                fontSize: '12px', fontWeight: 700, fontFamily: 'inherit', transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}>{tab.label}</button>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            {user ? (
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #e63030', cursor: 'pointer', flexShrink: 0 }} onClick={() => navigate('/profile')}>
                <HeaderAvatar user={user} />
              </div>
            ) : (
              <button onClick={() => navigate('/login')} style={{ padding: '8px 20px', background: '#e63030', border: 'none', color: '#fff', fontWeight: 800, fontSize: '13px', borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                Autentifică-te
              </button>
            )}

            {/* Hamburger */}
            <button className="dash-hamburger" onClick={() => setMobileMenuOpen(o => !o)} style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#fff', display: 'flex', flexDirection: 'column', gap: '5px', padding: '4px',
            }}>
              <span style={{ display: 'block', width: '22px', height: '2px', background: '#fff' }} />
              <span style={{ display: 'block', width: '22px', height: '2px', background: '#fff', opacity: mobileMenuOpen ? 0 : 1 }} />
              <span style={{ display: 'block', width: '22px', height: '2px', background: '#fff' }} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className="dash-mobile-menu" style={{
          display: mobileMenuOpen ? 'flex' : 'none',
          flexDirection: 'column',
          background: '#111', borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '12px 16px',
        }}>
          {NAV_TABS.map(tab => (
            <button key={tab.id} onClick={() => {
              if (tab.id === 'admin') { navigate('/admin'); return; }
              setActiveTab(tab.id); setError(''); setSuccess(''); setMobileMenuOpen(false);
            }} style={{
              background: activeTab === tab.id ? 'rgba(230,48,48,0.15)' : 'transparent',
              border: 'none', color: activeTab === tab.id ? '#e63030' : 'rgba(255,255,255,0.7)',
              padding: '12px 0', fontSize: '14px', fontWeight: 700, fontFamily: 'inherit',
              textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer',
            }}>{tab.label}</button>
          ))}
        </div>
      </header>

      {/* MAIN */}
      <main className="dash-main" style={{ flex: 1, maxWidth: '1400px', margin: '0 auto', padding: '32px', width: '100%', boxSizing: 'border-box' }}>
        {success && <div style={{ background: '#10b981', color: '#fff', padding: '12px 20px', borderRadius: '8px', marginBottom: '20px', fontWeight: 700, fontSize: '14px' }}>{success}</div>}
        {error && !['add-listing', 'edit-listing'].includes(activeTab) && (
          <div style={{ background: '#e63030', color: '#fff', padding: '12px 20px', borderRadius: '8px', marginBottom: '20px', fontWeight: 700, fontSize: '14px' }}>{error}</div>
        )}

        {/* ── BROWSE ── */}
        {activeTab === 'browse' && (
          <div>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '20px 24px', marginBottom: '28px', boxShadow: '0 1px 8px rgba(0,0,0,0.07)' }}>
              <div className="dash-filter-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', alignItems: 'end' }}>
                {[{ name: 'brand', placeholder: 'Marcă (ex: BMW)' }, { name: 'minPrice', placeholder: 'Preț min (EUR)' }, { name: 'maxPrice', placeholder: 'Preț max (EUR)' }].map(f => (
                  <input key={f.name} placeholder={f.placeholder} value={filters[f.name]}
                    onChange={e => setFilters(p => ({ ...p, [f.name]: e.target.value }))}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#e63030'}
                    onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}
                  />
                ))}
                <select value={filters.fuelType} onChange={e => setFilters(p => ({ ...p, fuelType: e.target.value }))} style={inputStyle}>
                  <option value="">Combustibil</option>
                  {['Benzină', 'Diesel', 'Electric', 'Hibrid', 'GPL', 'Gaz'].map(v => <option key={v}>{v}</option>)}
                </select>
                <select value={filters.transmission} onChange={e => setFilters(p => ({ ...p, transmission: e.target.value }))} style={inputStyle}>
                  <option value="">Cutie viteze</option>
                  {['Manuală', 'Automată', 'Robotizată', 'CVT'].map(v => <option key={v}>{v}</option>)}
                </select>
                <button onClick={handleSearch} style={{ padding: '10px 20px', background: '#e63030', border: 'none', color: '#fff', fontWeight: 800, fontSize: '13px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 12px rgba(230,48,48,0.3)', transition: 'all 0.2s' }}
                  onMouseEnter={e => e.target.style.background = '#cc2020'}
                  onMouseLeave={e => e.target.style.background = '#e63030'}
                >
                  Caută
                </button>
              </div>
            </div>

            {!loading && totalCount > 0 && (
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '20px', fontWeight: 600 }}>
                {totalCount} anunțuri — Pagina {page} din {totalPages}
              </div>
            )}

            {loading ? <LoadingGrid /> : allListings.length === 0 ? (
              <EmptyState msg="Nu am găsit niciun anunț activ." onAction={() => setActiveTab('add-listing')} actionLabel="Adaugă primul anunț" />
            ) : (
              <>
                <div className="dash-listings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  {allListings.map(l => (
                    <ListingCard key={l.id} listing={l} showActions={false}
                      onClick={() => setSelectedListing(l)}
                      isFavorited={favoriteIds.has(l.id)}
                      onToggleFavorite={handleToggleFavorite}
                      user={user}
                    />
                  ))}
                </div>
                <Pagination page={page} totalPages={totalPages} onChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
              </>
            )}
          </div>
        )}

        {/* ── FAVORITES ── */}
        {activeTab === 'favorites' && (
          <div>
            <h2 style={{ margin: '0 0 24px', fontSize: '22px', fontWeight: 900, color: '#1a1a1a' }}>Anunțuri Favorite</h2>
            {loading ? <LoadingGrid /> : favoriteListings.length === 0 ? (
              <EmptyState icon="♡" msg="Nu ai niciun anunț salvat la favorite." onAction={() => setActiveTab('browse')} actionLabel="Caută anunțuri" />
            ) : (
              <div className="dash-listings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {favoriteListings.map(l => (
                  <ListingCard key={l.id} listing={l} showActions={false}
                    onClick={() => setSelectedListing(l)}
                    isFavorited={true}
                    onToggleFavorite={handleToggleFavorite}
                    user={user}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MY LISTINGS ── */}
        {activeTab === 'my-listings' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#1a1a1a' }}>Anunțurile mele</h2>
              <button onClick={() => setActiveTab('add-listing')} style={{ padding: '10px 22px', background: '#e63030', border: 'none', color: '#fff', fontWeight: 800, fontSize: '13px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 3px 12px rgba(230,48,48,0.3)' }}>
                + Adaugă anunț
              </button>
            </div>
            {listings.some(l => l.status === 'pending') && (
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#92400e', fontWeight: 600 }}>
                Anunțurile în așteptare sunt verificate de administrator.
              </div>
            )}
            {loading ? <LoadingGrid /> : listings.length === 0 ? (
              <EmptyState msg="Nu ai niciun anunț publicat." onAction={() => setActiveTab('add-listing')} actionLabel="Adaugă primul tău anunț" />
            ) : (
              <div className="dash-listings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {listings.map(l => (
                  <ListingCard key={l.id} listing={l} showActions={true}
                    onDelete={handleDelete} onMarkSold={handleMarkSold} onEdit={handleStartEdit}
                    onClick={() => setSelectedListing(l)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ADD LISTING ── */}
        {activeTab === 'add-listing' && (
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            <h2 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 900, color: '#1a1a1a' }}>Adaugă anunț nou</h2>
            <p style={{ margin: '0 0 24px', color: '#888', fontSize: '13px' }}>Anunțul va fi trimis spre aprobare înainte de publicare.</p>
            <ListingForm initialData={null} onSubmit={handleAddSubmit} loading={loading} uploading={uploading} images={images} setImages={setImages} uploadError={uploadError} isDragging={isDragging} getRootProps={getRootProps} getInputProps={getInputProps} removeImage={removeImage} moveImage={moveImage} submitLabel="Trimite spre aprobare" error={activeTab === 'add-listing' ? error : ''} success={activeTab === 'add-listing' ? success : ''} />
          </div>
        )}

        {/* ── EDIT LISTING ── */}
        {activeTab === 'edit-listing' && editingListing && (
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <button onClick={() => { setActiveTab('my-listings'); setEditingListing(null); setError(''); }} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', fontWeight: 700 }}>Înapoi</button>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 900, color: '#1a1a1a' }}>Editează anunțul</h2>
            </div>
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', fontSize: '13px', color: '#92400e', fontWeight: 600 }}>
              După editare, anunțul va fi trimis spre re-aprobare.
            </div>
            <ListingForm initialData={editingListing} onSubmit={handleEditSubmit} loading={loading} uploading={editUploading} images={editImages} setImages={setEditImages} uploadError={editUploadError} isDragging={editIsDragging} getRootProps={editGetRootProps} getInputProps={editGetInputProps} removeImage={editRemoveImage} moveImage={editMoveImage} submitLabel="Salvează și trimite spre re-aprobare" error={activeTab === 'edit-listing' ? error : ''} success={activeTab === 'edit-listing' ? success : ''} />
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}