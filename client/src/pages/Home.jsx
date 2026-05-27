import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useRef, useState } from 'react';
import { apiFetch, parseJson } from '../utils/api';

const BRANDS = ['Toyota','BMW','Audi','Mercedes','Volkswagen','Renault','Ford','Honda','Hyundai','Kia','Nissan','Mazda','Opel','Skoda','Volvo'];
const MODELS = {'Toyota':['Yaris','Camry','RAV4','Corolla'],'BMW':['X5','X3','320i','520i'],'Audi':['A4','A6','Q5','Q7'],'Mercedes':['C-Class','E-Class','GLE','A-Class'],'Volkswagen':['Golf','Passat','Tiguan','Polo'],'Renault':['Clio','Megane','Duster','Kadjar'],'Ford':['Focus','Mondeo','Kuga','Fiesta'],'Honda':['Civic','CR-V','HR-V','Accord'],'Hyundai':['Tucson','i30','Santa Fe','Elantra'],'Kia':['Sportage','Ceed','Sorento','Stinger'],'Nissan':['Qashqai','Juke','X-Trail','Leaf'],'Mazda':['CX-5','Mazda3','Mazda6','CX-30'],'Opel':['Astra','Insignia','Mokka','Corsa'],'Skoda':['Octavia','Superb','Kodiaq','Karoq'],'Volvo':['XC60','XC90','V40','S60']};

function MiniCard({ listing, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: '#fff', borderRadius: '12px', overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)', cursor: 'pointer',
      transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s',
      fontFamily: "'Montserrat','Segoe UI',sans-serif",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 14px 36px rgba(0,0,0,0.13)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'; }}
    >
      <div style={{ height: '180px', background: '#1a1a1a', overflow: 'hidden', position: 'relative' }}>
        <img
          src={listing.mainImage || listing.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
          alt={listing.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.35s' }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        />
        <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
          {listing.year}
        </div>
      </div>
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ fontWeight: 800, fontSize: '14px', color: '#111', marginBottom: '6px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>{listing.title}</div>
        <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', flexWrap: 'wrap' }}>
          {[listing.fuelType, listing.transmission].filter(Boolean).map(t => (
            <span key={t} style={{ fontSize: '10px', fontWeight: 700, color: '#e63030', background: 'rgba(230,48,48,0.08)', padding: '2px 8px', borderRadius: '4px' }}>{t}</span>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: '#aaa' }}>{listing.location?.city || 'N/A'}</div>
          <div style={{ fontSize: '20px', fontWeight: 900, color: '#e63030' }}>
            {listing.price?.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 700 }}>{listing.currency}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedBrand, setSelectedBrand] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [recentListings, setRecentListings] = useState([]);
  const [stats, setStats] = useState({ total: 0, brands: 0, cities: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const heroRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    apiFetch('/api/listings?limit=4&status=active&sort=-createdAt')
      .then(res => parseJson(res))
      .then(json => {
        if (json.success) {
          setRecentListings(json.data || []);
          setStats(s => ({ ...s, total: json.pagination?.total || 0 }));
        }
      })
      .catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  const STAT_ITEMS = [
    { value: stats.total > 0 ? `${stats.total}+` : '500+', label: 'Anunțuri active' },
    { value: '15+', label: 'Mărci disponibile' },
    { value: '2', label: 'Showroom-uri' },
    { value: '100%', label: 'Anunțuri verificate' },
  ];

  return (
    <div style={{ fontFamily: "'Montserrat', 'Segoe UI', sans-serif", background: '#f4f4f4', minHeight: '100vh' }}>
      <style>{`
        @media (max-width: 768px) {
          .home-topbar { display: none !important; }
          .home-nav { display: none !important; }
          .home-search-btn { display: none !important; }
          .home-hamburger { display: flex !important; }
          .home-hero { grid-template-columns: 1fr !important; margin-top: 60px !important; min-height: auto !important; }
          .home-hero-left { padding: 40px 24px !important; }
          .home-hero-right { display: none !important; }
          .home-hero-h1 { font-size: 32px !important; }
          .home-stats-row { gap: 16px !important; flex-wrap: wrap !important; }
          .home-stat-item { min-width: 80px !important; }
          .home-features-grid { grid-template-columns: 1fr !important; }
          .home-recent-grid { grid-template-columns: 1fr 1fr !important; }
          .home-how-grid { grid-template-columns: 1fr 1fr !important; gap: 20px !important; }
          .home-footer-grid { grid-template-columns: 1fr 1fr !important; gap: 28px !important; }
          .home-footer-brand { grid-column: 1 / -1 !important; }
          .home-section-pad { padding: 48px 20px !important; }
          .home-recent-section { padding: 0 20px 48px !important; }
          .home-cta-btns { flex-direction: column !important; align-items: center !important; }
          .home-nav-mobile { display: flex !important; }
          .home-header-inner { padding: 0 20px !important; height: 60px !important; }
          .home-logo { font-size: 18px !important; }
        }
        @media (max-width: 480px) {
          .home-recent-grid { grid-template-columns: 1fr !important; }
          .home-how-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) {
          .home-hamburger { display: none !important; }
          .home-nav-mobile { display: none !important; }
        }
      `}</style>

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? 'rgba(18,18,18,0.98)' : '#1a1a1a',
        backdropFilter: 'blur(12px)',
        boxShadow: scrolled ? '0 2px 24px rgba(0,0,0,0.45)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        {/* Top bar — hidden on mobile */}
        <div className="home-topbar" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '6px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '32px' }}>
            {['079 700 509 — sec. Rîșcani', '079 700 502 — sec. Botanica'].map(t => (
              <span key={t} style={{ color: 'rgba(255,255,255,0.45)', fontSize: '11px' }}>{t}</span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {!user ? (
              <>
                <button onClick={() => navigate('/login')} style={{ padding: '5px 18px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.7)', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.target.style.borderColor = '#e63030'; e.target.style.color = '#fff'; }}
                  onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.2)'; e.target.style.color = 'rgba(255,255,255,0.7)'; }}
                >Autentificare</button>
                <button onClick={() => navigate('/register')} style={{ padding: '5px 18px', background: '#e63030', border: '1px solid #e63030', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', fontWeight: 700 }}>
                  Înregistrare
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/dashboard')} style={{ padding: '5px 20px', background: '#e63030', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit', fontWeight: 700 }}>
                {user.username} — Dashboard
              </button>
            )}
          </div>
        </div>

        {/* Main nav */}
        <div className="home-header-inner" style={{ padding: '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '66px' }}>
          <div className="home-logo" style={{ fontSize: '22px', fontWeight: 900, color: '#e63030', letterSpacing: '0.05em', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            AUTOMARKET<span style={{ color: '#fff' }}>.MD</span>
          </div>
          <nav className="home-nav" style={{ display: 'flex', gap: '4px' }}>
            {[
              { label: 'Acasă', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
              { label: 'Anunțuri', action: () => navigate('/dashboard') },
              { label: 'Credit auto', action: null },
              { label: 'Leasing', action: null },
              { label: 'Contact', action: null },
            ].map(({ label, action }) => (
              <button key={label} onClick={action || undefined} style={{
                background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)',
                padding: '8px 16px', cursor: action ? 'pointer' : 'default', fontSize: '13px', fontWeight: 600,
                fontFamily: 'inherit', borderRadius: '4px', transition: 'all 0.2s', letterSpacing: '0.02em',
              }}
                onMouseEnter={e => { if (action) e.target.style.color = '#e63030'; }}
                onMouseLeave={e => { e.target.style.color = 'rgba(255,255,255,0.7)'; }}
              >{label}</button>
            ))}
          </nav>
          <button className="home-search-btn" onClick={() => navigate('/dashboard')} style={{
            background: 'transparent', border: '1px solid rgba(255,255,255,0.18)',
            color: 'rgba(255,255,255,0.65)', width: '40px', height: '40px',
            borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#e63030'; e.currentTarget.style.color = '#e63030'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>

          {/* Hamburger — mobile only */}
          <button className="home-hamburger" onClick={() => setMenuOpen(o => !o)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#fff', display: 'flex', flexDirection: 'column', gap: '5px', padding: '4px',
          }}>
            <span style={{ display: 'block', width: '22px', height: '2px', background: '#fff', transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
            <span style={{ display: 'block', width: '22px', height: '2px', background: '#fff', transition: 'all 0.2s', opacity: menuOpen ? 0 : 1 }} />
            <span style={{ display: 'block', width: '22px', height: '2px', background: '#fff', transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
          </button>
        </div>

        {/* Mobile menu */}
        <div className="home-nav-mobile" style={{
          display: menuOpen ? 'flex' : 'none',
          flexDirection: 'column',
          background: '#111', borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '16px 20px',
        }}>
          {[
            { label: 'Acasă', action: () => { window.scrollTo({ top: 0, behavior: 'smooth' }); setMenuOpen(false); } },
            { label: 'Anunțuri', action: () => { navigate('/dashboard'); setMenuOpen(false); } },
          ].map(({ label, action }) => (
            <button key={label} onClick={action} style={{
              background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.8)',
              padding: '12px 0', fontSize: '15px', fontWeight: 600, fontFamily: 'inherit',
              textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer',
            }}>{label}</button>
          ))}
          {!user ? (
            <div style={{ display: 'flex', gap: '10px', paddingTop: '16px' }}>
              <button onClick={() => { navigate('/login'); setMenuOpen(false); }} style={{ flex: 1, padding: '11px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '13px' }}>Autentificare</button>
              <button onClick={() => { navigate('/register'); setMenuOpen(false); }} style={{ flex: 1, padding: '11px', background: '#e63030', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '13px' }}>Înregistrare</button>
            </div>
          ) : (
            <button onClick={() => { navigate('/dashboard'); setMenuOpen(false); }} style={{ marginTop: '16px', padding: '11px', background: '#e63030', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: '13px' }}>Dashboard</button>
          )}
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section ref={heroRef} className="home-hero" style={{
        marginTop: '116px',
        background: 'linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 60%, #111 100%)',
        minHeight: '460px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <div style={{ position: 'absolute', top: '-60px', right: '38%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(230,48,48,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '20%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(230,48,48,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Left */}
        <div className="home-hero-left" style={{ padding: '60px 48px 60px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(230,48,48,0.15)', border: '1px solid rgba(230,48,48,0.3)', color: '#ff6b6b', fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '6px 16px', borderRadius: '20px', marginBottom: '24px', width: 'fit-content' }}>
            #1 Platformă Auto Moldova
          </div>
          <h1 className="home-hero-h1" style={{ color: '#ffffff', fontSize: '46px', fontWeight: 900, margin: '0 0 16px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            Găsește Mașina<br />
            <span style={{ color: '#e63030' }}>Visurilor Tale</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '15px', margin: '0 0 36px', lineHeight: 1.7, maxWidth: '380px' }}>
            Mii de anunțuri verificate de mașini second-hand din Moldova. Cumpără și vinde cu încredere.
          </p>

          <div className="home-stats-row" style={{ display: 'flex', gap: '32px', marginBottom: '40px' }}>
            {STAT_ITEMS.map(({ value, label }) => (
              <div key={label} className="home-stat-item">
                <div style={{ fontSize: '24px', fontWeight: 900, color: '#e63030' }}>{value}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </div>

          <div className="home-cta-btns" style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => navigate('/dashboard')} style={{ padding: '14px 32px', background: '#e63030', border: 'none', color: '#fff', fontWeight: 900, fontSize: '14px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.06em', boxShadow: '0 6px 24px rgba(230,48,48,0.4)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.target.style.background = '#cc2020'; e.target.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.target.style.background = '#e63030'; e.target.style.transform = 'translateY(0)'; }}
            >Caută Mașini</button>
            {!user && (
              <button onClick={() => navigate('/register')} style={{ padding: '14px 32px', background: 'transparent', border: '2px solid rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, fontSize: '14px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.target.style.borderColor = 'rgba(255,255,255,0.5)'; }}
                onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.2)'; }}
              >Publică Anunț</button>
            )}
          </div>
        </div>

        {/* Right: search card — hidden on mobile */}
        <div className="home-hero-right" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 64px 48px 32px', position: 'relative', zIndex: 2 }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '36px', width: '100%', maxWidth: '420px' }}>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff', marginBottom: '24px' }}>Caută rapid</div>
            <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'Marcă', type: 'select', options: ['– Alege marca –', ...BRANDS], onChange: e => setSelectedBrand(e.target.value === '– Alege marca –' ? '' : e.target.value) },
                { label: 'Model', type: 'select', options: selectedBrand ? ['– Alege model –', ...(MODELS[selectedBrand] || [])] : ['– Alege model –'] },
                { label: 'Preț max (€)', type: 'number', placeholder: 'Ex: 15000' },
                { label: 'An min', type: 'number', placeholder: 'Ex: 2015' },
              ].map(({ label, type, options, placeholder, onChange }) => (
                <div key={label}>
                  <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>{label}</label>
                  {type === 'select' ? (
                    <select onChange={onChange} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '13px', color: '#fff', background: 'rgba(255,255,255,0.08)', cursor: 'pointer', fontFamily: 'inherit', outline: 'none', transition: 'border-color 0.2s' }}
                      onFocus={e => e.target.style.borderColor = '#e63030'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    >
                      {options.map(o => <option key={o} style={{ background: '#1a1a1a' }}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={type} placeholder={placeholder} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '13px', color: '#fff', background: 'rgba(255,255,255,0.08)', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                      onFocus={e => e.target.style.borderColor = '#e63030'}
                      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                    />
                  )}
                </div>
              ))}
              <button type="submit" style={{ width: '100%', padding: '13px', background: '#e63030', border: 'none', color: '#fff', fontWeight: 900, fontSize: '13px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'all 0.2s', boxShadow: '0 4px 18px rgba(230,48,48,0.4)', marginTop: '4px' }}
                onMouseEnter={e => { e.target.style.background = '#cc2020'; e.target.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.target.style.background = '#e63030'; e.target.style.transform = 'translateY(0)'; }}
              >Caută Acum</button>
            </form>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section className="home-section-pad" style={{ padding: '72px 64px', maxWidth: '1300px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#e63030', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '10px' }}>De ce AutoMarket?</div>
          <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#1a1a1a', margin: 0, letterSpacing: '-0.02em' }}>Piața auto de încredere</h2>
        </div>
        <div className="home-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {[
            { title: 'Anunțuri Verificate', desc: 'Fiecare anunț este revizuit de echipa noastră înainte de publicare. Cumperi cu deplină încredere.' },
            { title: '2 Showroom-uri Chișinău', desc: 'Locații în sec. Rîșcani și Botanica. Testează mașina personal înainte să iei decizia.' },
            { title: 'Credit & Leasing', desc: 'Soluții financiare rapide și flexibile. Aprobare în maxim 24h, avans de la 10%.' },
          ].map(({ title, desc }) => (
            <div key={title} style={{ background: '#fff', borderRadius: '16px', padding: '36px 28px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', borderTop: '4px solid #e63030', transition: 'transform 0.2s, box-shadow 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(0,0,0,0.11)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.06)'; }}
            >
              <div style={{ width: '40px', height: '40px', background: 'rgba(230,48,48,0.1)', borderRadius: '8px', marginBottom: '16px' }} />
              <h3 style={{ color: '#1a1a1a', fontSize: '17px', fontWeight: 800, margin: '0 0 12px' }}>{title}</h3>
              <p style={{ color: '#777', fontSize: '14px', lineHeight: 1.75, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── RECENT LISTINGS PREVIEW ─────────────────────────── */}
      {recentListings.length > 0 && (
        <section className="home-recent-section" style={{ padding: '0 64px 72px', maxWidth: '1300px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#e63030', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '8px' }}>Cele mai noi</div>
              <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#1a1a1a', margin: 0, letterSpacing: '-0.02em' }}>Anunțuri recente</h2>
            </div>
            <button onClick={() => navigate('/dashboard')} style={{ padding: '11px 24px', background: 'transparent', border: '2px solid #e63030', color: '#e63030', fontWeight: 800, fontSize: '13px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e63030'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#e63030'; }}
            >Toate anunțurile</button>
          </div>
          <div className="home-recent-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
            {recentListings.map(l => (
              <MiniCard key={l.id} listing={l} onClick={() => navigate('/dashboard')} />
            ))}
          </div>
        </section>
      )}

      {/* ── HOW IT WORKS ────────────────────────────────────── */}
      <section style={{ background: '#1a1a1a', padding: '72px 24px' }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#e63030', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '10px' }}>Simplu și rapid</div>
          <h2 style={{ fontSize: '32px', fontWeight: 900, color: '#fff', margin: '0 0 48px', letterSpacing: '-0.02em' }}>Cum funcționează?</h2>
          <div className="home-how-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px' }}>
            {[
              { step: '01', title: 'Creezi cont', desc: 'Înregistrare gratuită în 30 de secunde cu email sau Google.' },
              { step: '02', title: 'Postezi anunțul', desc: 'Completezi detaliile mașinii și încarci poze. Simplu și rapid.' },
              { step: '03', title: 'Adminul verifică', desc: 'Echipa noastră aprobă anunțul în câteva ore.' },
              { step: '04', title: 'Vinzi mașina', desc: 'Cumpărătorii te contactează direct. Tu alegi oferta.' },
            ].map(({ step, title, desc }) => (
              <div key={step} style={{ textAlign: 'center', position: 'relative' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(230,48,48,0.15)', border: '1px solid rgba(230,48,48,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <span style={{ fontSize: '22px', fontWeight: 900, color: '#e63030' }}>{step}</span>
                </div>
                <div style={{ fontSize: '10px', fontWeight: 900, color: '#e63030', letterSpacing: '0.15em', marginBottom: '8px' }}>PASUL {step}</div>
                <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 800, margin: '0 0 10px' }}>{title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', lineHeight: 1.7, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      {!user && (
        <section style={{ background: '#e63030', padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ color: '#fff', fontSize: '32px', fontWeight: 900, margin: '0 0 14px', letterSpacing: '-0.02em' }}>
              Vrei să vinzi mașina?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0 0 36px', fontSize: '15px', lineHeight: 1.6 }}>
              Publicare gratuită. Audiență de mii de cumpărători. Fără comision.
            </p>
            <div className="home-cta-btns" style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => navigate('/register')} style={{ padding: '14px 40px', background: '#fff', border: 'none', color: '#e63030', fontWeight: 900, fontSize: '14px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 24px rgba(0,0,0,0.25)'; }}
                onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}
              >Înregistrare Gratuită</button>
              <button onClick={() => navigate('/login')} style={{ padding: '14px 40px', background: 'transparent', border: '2px solid rgba(255,255,255,0.4)', color: '#fff', fontWeight: 700, fontSize: '14px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'all 0.2s' }}>
                Autentificare
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ background: '#111', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '56px 24px 32px' }}>
          <div className="home-footer-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '48px', marginBottom: '48px' }}>
            <div className="home-footer-brand">
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#e63030', letterSpacing: '0.05em', marginBottom: '14px' }}>
                AUTOMARKET<span style={{ color: 'rgba(255,255,255,0.3)' }}>.MD</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', lineHeight: 1.75, margin: '0 0 24px', maxWidth: '240px' }}>
                Cea mai mare platformă de anunțuri auto din Moldova. Cumpără și vinde cu încredere.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  '079 700 509 — sec. Rîșcani',
                  '079 700 502 — sec. Botanica',
                  'contact@automarket.md',
                  'Luni–Sâmbătă: 09:00–18:00',
                ].map(t => (
                  <span key={t} style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px' }}>{t}</span>
                ))}
              </div>
            </div>

            <div>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '20px' }}>Navigare</div>
              {['Acasă', 'Anunțuri auto', 'Publică anunț', 'Contul meu'].map(item => (
                <div key={item} style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', marginBottom: '12px', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#e63030'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                >{item}</div>
              ))}
            </div>

            <div>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '20px' }}>Servicii</div>
              {['Credit auto', 'Leasing', 'Asigurare RCA', 'Inspecție ITP', 'Evaluare mașină'].map(item => (
                <div key={item} style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', marginBottom: '12px', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#e63030'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                >{item}</div>
              ))}
            </div>

            <div>
              <div style={{ color: '#fff', fontWeight: 900, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '20px' }}>Informații</div>
              {['Termeni și condiții', 'Politica de confidențialitate', 'Politica cookies', 'GDPR', 'Contact'].map(item => (
                <div key={item} style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px', marginBottom: '12px', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#e63030'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.35)'}
                >{item}</div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>
              © {new Date().getFullYear()} AutoMarket MD SRL. Toate drepturile rezervate.
            </div>
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }}>
              Moldova
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}