import { ArrowRight, Bolt, Star, WandSparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const stats = [
  { label: 'Campaigns generated', value: '128k+' },
  { label: 'Image models', value: '2' },
  { label: 'Conversion lift', value: '2.8x' },
];

const features = [
  'Prompt enhancement tailored for food photography',
  'Base and LoRA image generation workflows',
  'Campaign copy, captions, hashtags, and ad variants',
  'Generation history, favorites, and restaurant profile management',
];

export function LandingPage() {
  return (
    <div className="shell hero">
      <div className="container">
        <div className="hero-grid">
          <div>
            <div className="panel" style={{ display: 'inline-flex', gap: 10, padding: '10px 14px', marginBottom: 18 }}>
              <Bolt size={16} />
              <span>Premium AI marketing for restaurants</span>
            </div>
            <h1 className="hero-title">Turn a dish into a complete campaign.</h1>
            <p className="hero-copy">
              FoodAds AI helps restaurants create beautiful food imagery, persuasive captions, ad copy, and social content from a single prompt.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
              <Link to="/login" className="btn btn-primary">
                Sign in <ArrowRight size={16} />
              </Link>
              <a className="btn btn-secondary" href="#features">
                View features
              </a>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginTop: 30 }}>
              {stats.map((stat) => (
                <div className="panel" key={stat.label} style={{ padding: 18 }}>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel" style={{ padding: 24 }}>
            <div className="muted" style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 12 }}>
              What it does
            </div>
            <div style={{ display: 'grid', gap: 14, marginTop: 18 }}>
              {features.map((feature) => (
                <div key={feature} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'grid', placeItems: 'center' }}>
                    <WandSparkles size={16} />
                  </div>
                  <div>{feature}</div>
                </div>
              ))}
            </div>
            <div className="panel" style={{ marginTop: 22, padding: 18, background: 'rgba(255,255,255,0.03)' }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
                Built for restaurant teams
              </div>
              <div style={{ lineHeight: 1.7 }}>
                Fast marketing workflows for launches, menu updates, seasonal specials, and social campaigns.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
                <Star size={16} />
                <span className="muted">Made for premium food brands</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
