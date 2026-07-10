import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { History, Image, MessageSquareText, Sparkles, Store } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { foodAdsApi } from '../lib/api';

export function DashboardPage() {
  const [restaurants, history, favorites] = useQueries({
    queries: [
      { queryKey: ['restaurants'], queryFn: () => foodAdsApi.listRestaurants() },
      { queryKey: ['history'], queryFn: () => foodAdsApi.listHistory() },
      { queryKey: ['favorites'], queryFn: () => foodAdsApi.listFavorites() },
    ],
  });

  const recent = history.data?.slice(0, 4) ?? [];

  return (
    <div className="grid" style={{ gap: 20 }}>
      <div className="header-row">
        <div>
          <div className="muted" style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 12 }}>
            Overview
          </div>
          <h2 style={{ margin: '10px 0 0', fontSize: '2rem' }}>Your campaign cockpit</h2>
        </div>
        <Link className="btn btn-primary" to="/app/generate">
          <Sparkles size={16} />
          New generation
        </Link>
      </div>

      <div className="card-grid">
        <div className="span-4">
          <StatCard label="Restaurants" value={String(restaurants.data?.length ?? 0)} detail={restaurants.isLoading ? 'Loading' : 'Brand profiles'} />
        </div>
        <div className="span-4">
          <StatCard label="History" value={String(history.data?.length ?? 0)} detail={history.isLoading ? 'Loading' : 'Saved prompts'} />
        </div>
        <div className="span-4">
          <StatCard label="Favorites" value={String(favorites.data?.length ?? 0)} detail={favorites.isLoading ? 'Loading' : 'Saved assets'} />
        </div>
      </div>

      <div className="card-grid">
        <div className="panel span-8" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                Recent work
              </div>
              <h3 style={{ margin: '10px 0 0' }}>Latest generations</h3>
            </div>
            <History />
          </div>
          <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
            {recent.length > 0 ? (
              recent.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: 14, borderRadius: 16, background: 'rgba(255,255,255,0.04)' }}>
                  <span>{item.originalPrompt}</span>
                  <span className="muted">{item.model}</span>
                </div>
              ))
            ) : (
              <div className="muted" style={{ padding: 14 }}>
                No generations yet.
              </div>
            )}
          </div>
        </div>

        <div className="panel span-4" style={{ padding: 20 }}>
          <div className="muted" style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 12 }}>
            Studio
          </div>
          <h3 style={{ marginTop: 10 }}>Fastest path to launch</h3>
          <div style={{ display: 'grid', gap: 14, marginTop: 18 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <Image size={18} />
              <span>Generate images from food prompts</span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <MessageSquareText size={18} />
              <span>Create captions, CTA, hashtags, and ads</span>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Store size={18} />
              <span>Keep restaurant profiles ready for prompts</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
