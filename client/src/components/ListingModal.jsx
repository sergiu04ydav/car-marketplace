import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ListingModal({ listing, onClose }) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const images = listing.images?.length ? listing.images : [listing.mainImage].filter(Boolean);
  const hasMultiple = images.length > 1;

  const prev = (e) => { e.stopPropagation(); setCurrentIndex((i) => (i - 1 + images.length) % images.length); };
  const next = (e) => { e.stopPropagation(); setCurrentIndex((i) => (i + 1) % images.length); };

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const isSold = listing.status === 'sold';

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.82)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px', backdropFilter: 'blur(4px)',
      animation: 'fadeIn 0.18s ease',
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        .modal-card { animation: slideUp 0.22s ease; }
        .img-btn:hover { background: rgba(0,0,0,0.7) !important; }
        .thumb:hover { opacity: 1 !important; transform: scale(1.04) !important; }
        .feature-tag { background: rgba(230,48,48,0.08); color: #e63030; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 700; }
        .spec-row { display: flex; justify-content: space-between; align-items: center; padding: 11px 0; border-bottom: 1px solid #f2f2f2; }
        .spec-row:last-child { border-bottom: none; }
        @media (max-width: 640px) {
          .modal-inner { flex-direction: column !important; height: auto !important; max-height: 92vh !important; }
          .modal-gallery { width: 100% !important; height: 240px !important; flex-shrink: 0 !important; }
          .modal-details { max-height: 55vh !important; }
        }
      `}</style>

      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{
        background: '#fff', borderRadius: '14px', overflow: 'hidden',
        width: '100%', maxWidth: '900px', maxHeight: '92vh',
        display: 'flex', flexDirection: 'row',
        boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
        fontFamily: "'Montserrat','Segoe UI',sans-serif",
        position: 'relative',
      }}>
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: '14px', right: '14px', zIndex: 20,
          width: '34px', height: '34px', borderRadius: '50%',
          background: 'rgba(0,0,0,0.55)', border: 'none',
          color: '#fff', fontSize: '18px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.85)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.55)'}
        >×</button>

        {/* LEFT: Gallery */}
        <div className="modal-gallery" style={{ width: '50%', flexShrink: 0, background: '#111', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {images.length > 0 ? (
              <img src={images[currentIndex]} alt={listing.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.18s' }} />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                Nicio imagine disponibilă
              </div>
            )}
            {isSold && (
              <div style={{ position: 'absolute', top: '16px', left: '16px', background: '#e63030', color: '#fff', padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 800, letterSpacing: '0.08em' }}>VÂNDUT</div>
            )}
            {hasMultiple && (
              <>
                <button className="img-btn" onClick={prev} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
                <button className="img-btn" onClick={next} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '38px', height: '38px', borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
                <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                  {currentIndex + 1} / {images.length}
                </div>
              </>
            )}
          </div>
          {hasMultiple && (
            <div style={{ display: 'flex', gap: '6px', padding: '10px 12px', background: '#000', overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'thin' }}>
              {images.map((src, i) => (
                <button key={i} className="thumb" onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }} style={{
                  width: '52px', height: '36px', borderRadius: '4px', flexShrink: 0, overflow: 'hidden',
                  border: i === currentIndex ? '2px solid #e63030' : '2px solid rgba(255,255,255,0.3)',
                  opacity: i === currentIndex ? 1 : 0.6, cursor: 'pointer', padding: 0, background: '#000',
                }}>
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Details */}
        <div className="modal-details" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px 28px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', gap: '12px' }}>
            <div>
              <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 900, color: '#1a1a1a', lineHeight: 1.2, paddingRight: '36px' }}>
                {listing.title}
              </h2>
              <div style={{ color: '#888', fontSize: '13px' }}>
                {listing.location?.city || 'N/A'}{listing.location?.country ? `, ${listing.location.country}` : ''}
              </div>
              {listing.owner && (
                <div onClick={() => { onClose(); navigate(`/profile/${listing.owner?.id || listing.owner?._id || listing.owner}`); }}
                  style={{ marginTop: '6px', fontSize: '13px', color: '#6366f1', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#e63030', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: 900, overflow: 'hidden', flexShrink: 0 }}>
                    {listing.owner?.avatar && listing.owner.avatar.startsWith('http')
                      ? <img src={listing.owner.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (listing.owner?.username?.[0] || '?').toUpperCase()}
                  </div>
                  {listing.owner?.username || 'Vezi profil'}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#e63030', lineHeight: 1 }}>{listing.price?.toLocaleString()}</div>
              <div style={{ fontSize: '13px', color: '#888', fontWeight: 600 }}>{listing.currency}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
            {[listing.fuelType, listing.transmission, listing.color].filter(Boolean).map(tag => (
              <span key={tag} className="feature-tag">{tag}</span>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px', marginBottom: '20px' }}>
            {[
              { label: 'Marcă', value: listing.brand },
              { label: 'Model', value: listing.model },
              { label: 'An fabricație', value: listing.year },
              { label: 'Kilometraj', value: listing.mileage ? `${listing.mileage.toLocaleString()} km` : '—' },
              { label: 'Motor', value: listing.engineSize ? `${listing.engineSize}L` : '—' },
              { label: 'Putere', value: listing.power ? `${listing.power} CP` : '—' },
            ].map(({ label, value }) => (
              <div key={label} className="spec-row">
                <span style={{ color: '#888', fontSize: '13px' }}>{label}</span>
                <span style={{ color: '#1a1a1a', fontWeight: 700, fontSize: '13px' }}>{value || '—'}</span>
              </div>
            ))}
          </div>

          {listing.description && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Descriere</div>
              <p style={{ color: '#555', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>{listing.description}</p>
            </div>
          )}

          {listing.features?.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>Dotări</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {listing.features.map((f, i) => <span key={i} className="feature-tag">{f}</span>)}
              </div>
            </div>
          )}

          {/* Contact — număr telefon, fără buton "Sună acum" */}
          {listing.phone && (
            <div style={{ marginTop: 'auto', padding: '16px 20px', background: '#f9f9f9', borderRadius: '10px' }}>
              <div style={{ fontSize: '12px', color: '#888', fontWeight: 600, marginBottom: '6px' }}>Contact vânzător</div>
              <div style={{ fontSize: '18px', fontWeight: 900, color: '#1a1a1a' }}>{listing.phone}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}