import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BookmarkPlus, Check, Copy, Download } from 'lucide-react';
import { foodAdsApi } from '../lib/api';
import type { CampaignListItem, FavoriteEntry } from '../lib/types';

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function downloadImage(campaign: CampaignListItem) {
  if (!campaign.imageBase64Data || !campaign.imageContentType) return;
  const anchor = document.createElement('a');
  anchor.href = `data:${campaign.imageContentType};base64,${campaign.imageBase64Data}`;
  anchor.download = campaign.imageFileName || `campaign-${campaign.id}.png`;
  anchor.click();
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char] || char));
}

export function HistoryPage() {
  const queryClient = useQueryClient();
  const campaignsQuery = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => foodAdsApi.listCampaigns(),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const favoritesQuery = useQuery({ queryKey: ['favorites'], queryFn: () => foodAdsApi.listFavorites() });
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const selectedCampaign = useMemo(() => {
    return campaignsQuery.data?.find((item) => item.id === selectedCampaignId) ?? campaignsQuery.data?.[0] ?? null;
  }, [campaignsQuery.data, selectedCampaignId]);

  const selectedFavorite = useMemo(() => {
    if (!selectedCampaign) return null;
    return (favoritesQuery.data ?? []).find((favorite) => favorite.campaignId === selectedCampaign.id) ?? null;
  }, [favoritesQuery.data, selectedCampaign]);

  const favoriteCampaignMutation = useMutation({
    mutationFn: (campaignId: string) => foodAdsApi.favoriteCampaign(campaignId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: (favoriteId: string) => foodAdsApi.removeFavorite(favoriteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const favoriteCampaignIds = new Set(
    (favoritesQuery.data ?? [])
      .map((favorite: FavoriteEntry) => favorite.campaignId)
      .filter((id): id is string => Boolean(id)),
  );

  function handleCopyReport(campaign: CampaignListItem) {
    const report = [
      'FOODADS AI CAMPAIGN',
      '====================',
      `Headline: ${campaign.headline}`,
      `Prompt: ${campaign.prompt}`,
      `Caption: ${campaign.caption}`,
      `CTA: ${campaign.callToAction}`,
      `Image Model: ${campaign.imageModel}`,
      `Image File: ${campaign.imageFileName || ''}`,
      `Created At: ${campaign.createdAt}`,
      `Updated At: ${campaign.updatedAt}`,
    ].join('\n');

    navigator.clipboard.writeText(report);
  }

  function handleDownloadReport(campaign: CampaignListItem) {
    const imageSrc = campaign.imageBase64Data && campaign.imageContentType
      ? `data:${campaign.imageContentType};base64,${campaign.imageBase64Data}`
      : '';

    const report = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>FoodAds AI Campaign Report</title>
  <style>
    body { font-family: Inter, Arial, sans-serif; margin: 0; padding: 32px; background: #0b1020; color: #f5f7fb; }
    .page { max-width: 980px; margin: 0 auto; }
    .hero { padding: 24px; border-radius: 24px; background: #12192e; border: 1px solid rgba(255,255,255,0.08); }
    .hero h1 { margin: 0 0 10px; font-size: 34px; }
    .hero p { margin: 6px 0; color: #a7b1c7; }
    .image { margin-top: 18px; border-radius: 20px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04); }
    .image img { width: 100%; display: block; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 16px; }
    .block { background: #12192e; border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 18px; }
    .block h2 { margin: 0 0 12px; font-size: 15px; letter-spacing: 0.08em; text-transform: uppercase; color: #ff8a4c; }
    .block pre { margin: 0; white-space: pre-wrap; word-break: break-word; font: inherit; line-height: 1.65; color: #f5f7fb; }
    .full { grid-column: 1 / -1; }
    @media (max-width: 700px) { body { padding: 16px; } .grid { grid-template-columns: 1fr; } .full { grid-column: auto; } .hero h1 { font-size: 26px; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="hero">
      <h1>${escapeHtml(campaign.headline)}</h1>
      <p><strong>Prompt:</strong> ${escapeHtml(campaign.prompt)}</p>
      <p><strong>Caption:</strong> ${escapeHtml(campaign.caption)}</p>
      <p><strong>CTA:</strong> ${escapeHtml(campaign.callToAction)}</p>
      <p><strong>Image Model:</strong> ${escapeHtml(campaign.imageModel)}</p>
      <p><strong>Created At:</strong> ${escapeHtml(campaign.createdAt)}</p>
      <p><strong>Updated At:</strong> ${escapeHtml(campaign.updatedAt)}</p>
      ${imageSrc ? `<div class="image"><img src="${imageSrc}" alt="${escapeHtml(campaign.headline)}" /></div>` : ''}
    </div>

    <div class="grid">
      ${section('Prompt', campaign.prompt)}
      ${section('Headline', campaign.headline)}
      ${section('Caption', campaign.caption)}
      ${section('CTA', campaign.callToAction)}
      ${section('Image Model', campaign.imageModel)}
      ${section('Image File', campaign.imageFileName || 'No image file saved')}
      <section class="block full">
        <h2>All Copy Fields</h2>
        <pre>${escapeHtml([
          `Google Ads Copy: ${campaign.caption}`,
          `Facebook Post: ${campaign.caption}`,
          `Instagram Post: ${campaign.caption}`,
          `TikTok Caption: ${campaign.caption}`,
          `Reel Script: ${campaign.caption}`,
          `Email Subject: ${campaign.headline}`,
          `Email Body: ${campaign.caption}`,
          `SMS Message: ${campaign.caption}`,
          `Push Notification: ${campaign.callToAction}`,
          `Menu Description: ${campaign.caption}`,
          `SEO Description: ${campaign.caption}`,
          `Promotional Offer: ${campaign.callToAction}`,
          `Content Calendar: not available in saved campaign view`,
        ].join('\n\n'))}</pre>
      </section>
    </div>
  </div>
</body>
</html>`;

    downloadTextFile(`campaign-${campaign.id}.html`, report);
  }

  function section(title: string, content: string) {
    return `
      <section class="block">
        <h2>${escapeHtml(title)}</h2>
        <pre>${escapeHtml(content)}</pre>
      </section>
    `;
  }

  return (
    <div className="grid" style={{ gap: 20 }}>
      <div className="header-row">
        <div>
          <div className="muted" style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 12 }}>
            History
          </div>
          <h2 style={{ margin: '10px 0 0', fontSize: '2rem' }}>Recent generations</h2>
        </div>
      </div>

      <div className="history-layout">
        <div className="panel history-list">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <strong>Campaigns</strong>
            <span className="muted">{campaignsQuery.data?.length ?? 0} total</span>
          </div>
          <div style={{ display: 'grid', gap: 14 }}>
            {campaignsQuery.isLoading && !campaignsQuery.data && <div className="muted">Loading campaigns...</div>}
            {campaignsQuery.isError && <div className="alert">Could not load campaigns.</div>}
            {!campaignsQuery.isLoading && (campaignsQuery.data?.length ?? 0) === 0 && <div className="muted">No campaigns yet.</div>}
            {campaignsQuery.data?.map((campaign) => {
              const isSelected = campaign.id === selectedCampaign?.id;
              const isFavorited = favoriteCampaignIds.has(campaign.id);

              return (
                <button
                  key={campaign.id}
                  type="button"
                  onClick={() => setSelectedCampaignId(campaign.id)}
                  className={`history-card ${isSelected ? 'selected' : ''}`}
                  style={{
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  <div className="history-card-top">
                    <div>
                      <strong className="history-card-title">{campaign.headline}</strong>
                      <span className="muted history-card-prompt">{campaign.prompt}</span>
                    </div>
                    <span className="history-chip">{campaign.imageModel}</span>
                  </div>
                  <div className="history-card-footer">
                    {isFavorited ? <span className="history-status"><Check size={14} /> Favorited</span> : <span className="muted">Tap to open</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="panel history-detail">
          {selectedCampaign ? (
            <div style={{ display: 'grid', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <div className="muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                    Campaign details
                  </div>
                  <h3 style={{ margin: '8px 0 0' }}>{selectedCampaign.headline}</h3>
                </div>
                <span className="muted">{selectedCampaign.imageModel}</span>
              </div>

              <div className="panel" style={{ padding: 16, background: 'rgba(255,255,255,0.04)' }}>
                <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>Prompt</div>
                <p style={{ margin: 0, lineHeight: 1.7 }}>{selectedCampaign.prompt}</p>
              </div>

              <div className="panel" style={{ padding: 16, background: 'rgba(255,255,255,0.04)' }}>
                <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>Caption</div>
                <p style={{ margin: 0, lineHeight: 1.7 }}>{selectedCampaign.caption}</p>
              </div>

              <div className="panel" style={{ padding: 16, background: 'rgba(255,255,255,0.04)' }}>
                <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>Generated image</div>
                {selectedCampaign.imageBase64Data && selectedCampaign.imageContentType ? (
                  <img
                    src={`data:${selectedCampaign.imageContentType};base64,${selectedCampaign.imageBase64Data}`}
                    alt={selectedCampaign.headline}
                    style={{ width: '100%', maxHeight: 360, objectFit: 'cover', borderRadius: 18 }}
                  />
                ) : (
                  <div className="muted">No image was saved for this campaign.</div>
                )}
              </div>

              <div className="history-metrics">
                <div className="panel history-metric">
                  <div className="muted" style={{ fontSize: 12 }}>CTA</div>
                  <strong>{selectedCampaign.callToAction}</strong>
                </div>
                <div className="panel history-metric">
                  <div className="muted" style={{ fontSize: 12 }}>Created</div>
                  <strong>{new Date(selectedCampaign.createdAt).toLocaleString()}</strong>
                </div>
                <div className="panel history-metric">
                  <div className="muted" style={{ fontSize: 12 }}>Updated</div>
                  <strong>{new Date(selectedCampaign.updatedAt).toLocaleString()}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {selectedFavorite ? (
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => removeFavoriteMutation.mutate(selectedFavorite.id)}
                    disabled={removeFavoriteMutation.isPending}
                  >
                    <BookmarkPlus size={16} />
                    Remove from favorites
                  </button>
                ) : (
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => favoriteCampaignMutation.mutate(selectedCampaign.id)}
                    disabled={favoriteCampaignMutation.isPending}
                  >
                    <BookmarkPlus size={16} />
                    Add to favorites
                  </button>
                )}
                <button className="btn btn-secondary" type="button" onClick={() => handleCopyReport(selectedCampaign)}>
                  <Copy size={16} />
                  Copy report
                </button>
                <button className="btn btn-secondary" type="button" onClick={() => handleDownloadReport(selectedCampaign)}>
                  <Download size={16} />
                  Download report
                </button>
                {selectedCampaign.imageBase64Data && selectedCampaign.imageContentType && (
                  <button className="btn btn-secondary" type="button" onClick={() => downloadImage(selectedCampaign)}>
                    <Download size={16} />
                    Download image
                  </button>
                )}
              </div>

              {(favoriteCampaignMutation.isError || removeFavoriteMutation.isError) && <div className="alert">Could not update favorites.</div>}
            </div>
          ) : (
            <div className="muted">Select a campaign to see the full details.</div>
          )}
        </div>
      </div>
    </div>
  );
}
