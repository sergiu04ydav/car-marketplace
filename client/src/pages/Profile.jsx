import { useNavigate, useParams } from 'react-router-dom';
import ListingModal from '../components/ListingModal';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import { apiFetch, parseJson } from '../utils/api';

/* ── Avatar ───────────────────────────────────────────────── */
function AvatarWithFallback({ avatar, initials, size = 88, fontSize = 30 }) {
  const [imgError, setImgError] = useState(false);
  const valid = avatar && avatar.startsWith('http') && !imgError;

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      overflow: 'hidden', border: '4px solid #fff',
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
      background: '#e63030',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      {valid ? (
        <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setImgError(true)} />
      ) : (
        <span style={{ color: '#fff', fontWeight: 900, fontSize }}>{initials}</span>
      )}
    </div>
  );
}

/* ── Listing Card ─────────────────────────────────────────── */
function ListingCard({ listing, isOwner, onClick }) {
  const statusConfig = {
    active:   { label: 'Activ',       color: '#059669', bg: 'rgba(16,185,129,0.1)' },
    pending:  { label: 'În așteptare', color: '#d97706', bg: 'rgba(245,158,11,0.1)' },
    sold:     { label: 'Vândut',      color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
    rejected: { label: 'Respins',     color: '#e63030', bg: 'rgba(230,48,48,0.1)' },
    archived: { label: 'Arhivat',     color: '#888',    bg: '#f5f5f5' },
  };
  const s = statusConfig[listing.status] || statusConfig.active;
  const img = listing.mainImage || listing.images?.[0];

  return (
    <div onClick={onClick} style={{
      background: '#fff', borderRadius: '12px',
      overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.07)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 8px rgba(0,0,0,0.07)'; }}
    >
      {/* Image */}
      <div style={{ height: '160px', background: '#f2f2f2', position: 'relative', overflow: 'hidden' }}>
        {img ? (
          <img src={img} alt={listing.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '13px' }}>
            Fără imagine
          </div>
        )}
        {/* Status badge — show only to owner for non-active */}
        {isOwner && listing.status !== 'active' && (
          <span style={{
            position: 'absolute', top: '10px', left: '10px',
            padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
            background: s.bg, color: s.color,
            backdropFilter: 'blur(4px)',
          }}>{s.label}</span>
        )}
        {listing.status === 'sold' && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontWeight: 900, fontSize: '18px', letterSpacing: '0.06em' }}>VÂNDUT</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontWeight: 800, fontSize: '14px', color: '#1a1a1a', marginBottom: '6px',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {listing.title}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: '#888' }}>
            {listing.year} · {listing.mileage?.toLocaleString()} km
          </span>
          <span style={{ fontSize: '16px', fontWeight: 900, color: '#e63030' }}>
            {listing.price?.toLocaleString()} {listing.currency}
          </span>
        </div>
        <div style={{ fontSize: '12px', color: '#bbb', marginTop: '6px' }}>
          {listing.location?.city}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PROFILE PAGE — /profile (propriu) sau /profile/:userId (public)
══════════════════════════════════════════════════════════ */
export default function Profile() {
  const { user: currentUser, signOut } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams(); // dacă e /profile/:userId

  const isOwnProfile = !userId || userId === currentUser?.id;

  const [profileUser, setProfileUser] = useState(isOwnProfile ? currentUser : null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState(null);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isOwnProfile) {
        // Anunțurile proprii (toate statusurile)
        const res = await apiFetch('/api/listings/user/my-listings');
        const json = await parseJson(res);
        if (json.success) setListings(json.data || []);
        setProfileUser(currentUser);
      } else {
        // Anunțurile unui alt user — fetch public listings filtrate după owner
        const res = await apiFetch(`/api/listings?limit=50&status=active`);
        const json = await parseJson(res);
        if (json.success) {
          const userListings = (json.data || []).filter(l =>
            l.owner === userId || l.owner?._id === userId || l.owner?.id === userId
          );
          setListings(userListings);
          // Ia info despre user din primul anunț
          if (userListings.length > 0) {
            const owner = userListings[0].owner;
            if (typeof owner === 'object') {
              setProfileUser({ username: owner.username, email: owner.email, avatar: owner.avatar });
            }
          }
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const initials = profileUser?.username
    ? profileUser.username.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const joinedDate = currentUser?.createdAt && isOwnProfile
    ? new Date(currentUser.createdAt).toLocaleDateString('ro-MD', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const activeListings = listings.filter(l => l.status === 'active' || !isOwnProfile);

  return (
    <div style={{ fontFamily: "'Montserrat','Segoe UI',sans-serif", background: '#f2f2f2', minHeight: '100vh' }}>
      {selectedListing && (
        <ListingModal listing={selectedListing} onClose={() => setSelectedListing(null)} />
      )}

      {/* Header */}
      <header style={{ background: '#1a1a1a', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 16px rgba(0,0,0,0.3)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button onClick={() => navigate(-1)} style={{
              background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit', padding: '6px 0',
            }}
              onMouseEnter={e => e.target.style.color = '#fff'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
            >← Înapoi</button>
            <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)' }} />
            <span style={{ color: '#fff', fontWeight: 800, fontSize: '15px', cursor: 'pointer' }}
              onClick={() => navigate('/dashboard')}>
              AUTOMARKET<span style={{ color: 'rgba(255,255,255,0.35)' }}>.MD</span>
            </span>
          </div>
          {isOwnProfile && (
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>Profilul meu</span>
          )}
        </div>
      </header>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px 60px' }}>

        {/* ── Profile card ── */}
        <div style={{ background: '#fff', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', marginBottom: '28px' }}>
          <div style={{ background: '#1a1a1a', height: '100px' }} />
          <div style={{ padding: '0 32px 28px', marginTop: '-50px', display: 'flex', alignItems: 'flex-end', gap: '20px', flexWrap: 'wrap' }}>
            <AvatarWithFallback avatar={profileUser?.avatar} initials={initials} size={100} fontSize={34} />
            <div style={{ paddingBottom: '4px', flex: 1 }}>
              <h1 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 900, color: '#1a1a1a' }}>
                {profileUser?.username || '—'}
              </h1>
              {isOwnProfile && (
                <p style={{ margin: '0 0 10px', color: '#888', fontSize: '14px' }}>{currentUser?.email}</p>
              )}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {isOwnProfile && currentUser?.role === 'admin' && (
                  <span style={{ padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, background: '#1a1a1a', color: '#fff' }}>
                    Administrator
                  </span>
                )}
                {isOwnProfile && (
                  <span style={{
                    padding: '3px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                    background: currentUser?.isEmailVerified ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                    color: currentUser?.isEmailVerified ? '#059669' : '#d97706',
                    border: `1px solid ${currentUser?.isEmailVerified ? 'rgba(16,185,129,0.25)' : 'rgba(245,158,11,0.25)'}`,
                  }}>
                    {currentUser?.isEmailVerified ? 'Email verificat' : 'Email neverificat'}
                  </span>
                )}
                {joinedDate && (
                  <span style={{ fontSize: '13px', color: '#aaa' }}>Membru din {joinedDate}</span>
                )}
              </div>
            </div>

            {/* Butoane acțiuni — doar pe profilul propriu */}
            {isOwnProfile && (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {currentUser?.role === 'admin' && (
                  <button onClick={() => navigate('/admin')} style={{
                    padding: '10px 18px', background: '#1a1a1a', border: 'none',
                    borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
                    fontSize: '13px', fontWeight: 700, color: '#fff',
                  }}>Panou Admin</button>
                )}
                <button onClick={handleLogout} style={{
                  padding: '10px 18px', background: '#fff2f2',
                  border: '1px solid rgba(230,48,48,0.25)',
                  borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: '13px', fontWeight: 700, color: '#e63030',
                }}>Ieșire din cont</button>
              </div>
            )}
          </div>
        </div>

        {/* ── Stats (doar pentru profilul propriu) ── */}
        {isOwnProfile && !loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
            {[
              { label: 'Total', value: listings.length, color: '#1a1a1a' },
              { label: 'Active', value: listings.filter(l => l.status === 'active').length, color: '#059669' },
              { label: 'Așteptare', value: listings.filter(l => l.status === 'pending').length, color: '#d97706' },
              { label: 'Vândute', value: listings.filter(l => l.status === 'sold').length, color: '#6366f1' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: '#fff', borderRadius: '12px', padding: '20px 16px', textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '28px', fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '12px', color: '#999', fontWeight: 600, marginTop: '6px' }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Anunțuri ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1a1a1a' }}>
              {isOwnProfile ? 'Anunțurile mele' : `Anunțuri de la ${profileUser?.username || 'vânzător'}`}
            </h2>
            {isOwnProfile && (
              <button onClick={() => navigate('/dashboard')} style={{
                padding: '8px 16px', background: '#e63030', border: 'none',
                borderRadius: '7px', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: '13px', fontWeight: 700, color: '#fff',
              }}>+ Adaugă anunț</button>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ background: '#fff', borderRadius: '12px', height: '240px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }} />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div style={{ background: '#fff', borderRadius: '12px', padding: '48px', textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
              <p style={{ color: '#aaa', margin: 0, fontSize: '15px' }}>
                {isOwnProfile ? 'Nu ai niciun anunț publicat.' : 'Niciun anunț activ.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
              {listings.map(l => (
                <ListingCard key={l.id || l._id} listing={l} isOwner={isOwnProfile} onClick={() => setSelectedListing(l)} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}