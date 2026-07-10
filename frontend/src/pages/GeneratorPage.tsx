import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, LoaderCircle, Sparkles, Copy, Share2, Download, Image as ImageIcon, MessageSquareText, Type } from 'lucide-react';
import { foodAdsApi } from '../lib/api';
import type { CampaignResponse, GenerateImageResponse, ImageModel, Restaurant } from '../lib/types';

const schema = z.object({
  prompt: z.string().trim().min(8, 'Add a little more detail'),
  restaurantName: z.string().optional(),
  cuisineType: z.string().optional(),
  model: z.enum(['base', 'lora', 'custom']),
  device: z.enum(['cpu', 'cuda']).optional(),
});

type FormValues = z.infer<typeof schema>;

type PreviewChannel = 'instagram' | 'google' | 'email' | 'push' | 'calendar';

export function GeneratorPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageResult, setImageResult] = useState<GenerateImageResponse | null>(null);
  const [campaignResult, setCampaignResult] = useState<CampaignResponse | null>(null);
  const [enhancedTextPrompt, setEnhancedTextPrompt] = useState<string | null>(null);
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [activeChannel, setActiveChannel] = useState<PreviewChannel>('instagram');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      prompt: '',
      restaurantName: '',
      cuisineType: '',
      model: 'lora',
      device: undefined,
    },
  });

  const model = form.watch('model') as ImageModel;
  const previewPrompt = form.watch('prompt');
  const watchRestaurantName = form.watch('restaurantName') || 'Restaurant';
  const promptError = form.formState.errors.prompt?.message;

  useEffect(() => {
    foodAdsApi.listRestaurants()
      .then(res => setRestaurants(res))
      .catch(err => console.error('Failed to load restaurants', err));
  }, []);

  function handleSelectRestaurant(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    if (!id) return;
    const selected = restaurants.find(r => r.id === id);
    if (selected) {
      form.setValue('restaurantName', selected.name);
      form.setValue('cuisineType', selected.cuisineType);
    }
  }

  function showToast(message: string) {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 2500);
  }

  function handleCopyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label} to clipboard!`);
  }

  function downloadFile(filename: string, content: string, mimeType: string) {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function handleDownloadImage() {
    const image = imageResult?.images?.[0];
    if (!image) return;

    const anchor = document.createElement('a');
    anchor.href = `data:${image.contentType};base64,${image.base64Data}`;
    anchor.download = image.fileName || 'generated-image.png';
    anchor.click();
    showToast('Downloaded generated image!');
  }

  function handleDownloadReport() {
    if (!campaignResult && !imageResult) return;

    const imageSrc = imageResult?.images?.[0]
      ? `data:${imageResult.images[0].contentType};base64,${imageResult.images[0].base64Data}`
      : '';

    const section = (title: string, content: string) => `
      <section class="block">
        <h2>${title}</h2>
        <pre>${content.replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[char] || char))}</pre>
      </section>
    `;

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
      <h1>FoodAds AI Campaign Report</h1>
      <p><strong>Restaurant:</strong> ${watchRestaurantName}</p>
      <p><strong>Raw Prompt:</strong> ${previewPrompt || ''}</p>
      <p><strong>Enhanced Prompt:</strong> ${enhancedTextPrompt || imageResult?.enhancedPrompt || ''}</p>
      <p><strong>Image Model:</strong> ${imageResult?.model || model}</p>
      <p><strong>Negative Prompt:</strong> ${imageResult?.negativePrompt || ''}</p>
      ${imageSrc ? `<div class="image"><img src="${imageSrc}" alt="Generated campaign image" /></div>` : ''}
    </div>

    <div class="grid">
      ${section('Headline', campaignResult?.headline || '')}
      ${section('Caption', campaignResult?.caption || '')}
      ${section('CTA', campaignResult?.cta || '')}
      ${section('Hashtags', campaignResult?.hashtags.join(' ') || '')}
      ${section('Google Ads Copy', campaignResult?.googleAdsCopy || '')}
      ${section('Facebook Post', campaignResult?.facebookPost || '')}
      ${section('Instagram Post', campaignResult?.instagramPost || '')}
      ${section('TikTok Caption', campaignResult?.tiktokCaption || '')}
      ${section('Reel Script', campaignResult?.reelScript || '')}
      ${section('Email Subject', campaignResult?.emailSubject || '')}
      ${section('Email Body', campaignResult?.emailBody || '')}
      ${section('SMS Message', campaignResult?.smsMessage || '')}
      ${section('Push Notification', campaignResult?.pushNotification || '')}
      ${section('Menu Description', campaignResult?.menuDescription || '')}
      ${section('SEO Description', campaignResult?.seoDescription || '')}
      ${section('Promotional Offer', campaignResult?.promotionalOffer || '')}
      ${section('Content Calendar', campaignResult?.contentCalendar?.map((item, index) => `Day ${index + 1}: ${item}`).join('\n') || 'No content calendar generated yet.')}
      ${section('Image File', imageResult?.images?.[0] ? `${imageResult.images[0].fileName}\n${imageResult.images[0].contentType}` : 'No image generated yet.')}
    </div>
  </div>
</body>
</html>`;

    downloadFile(
      `foodads-ai-report-${watchRestaurantName.toLowerCase().replace(/\s+/g, '-') || 'campaign'}.html`,
      report,
      'text/html',
    );
    showToast('Downloaded full campaign report!');
  }

  function handleCopyCampaignBrief() {
    if (!campaignResult) return;
    const brief = `CAMPAIGN BRIEF: ${watchRestaurantName}
---------------------------------------------
PROMPT: ${previewPrompt}
ENHANCED PROMPT: ${enhancedTextPrompt || imageResult?.enhancedPrompt || ''}
HEADLINE: ${campaignResult.headline}
CAPTION: ${campaignResult.caption}
CTA: ${campaignResult.cta}
HASHTAGS: ${campaignResult.hashtags.join(' ')}
GOOGLE ADS: ${campaignResult.googleAdsCopy}
FACEBOOK: ${campaignResult.facebookPost}
INSTAGRAM: ${campaignResult.instagramPost}
TIKTOK: ${campaignResult.tiktokCaption}
REEL SCRIPT: ${campaignResult.reelScript}
EMAIL: ${campaignResult.emailSubject} - ${campaignResult.emailBody}
SMS: ${campaignResult.smsMessage}`;

    navigator.clipboard.writeText(brief);
    showToast("Copied full campaign brief!");
  }

  async function handleGenerate(values: FormValues) {
    setLoading(true);
    setError(null);
    try {
      const metadata = {
        tone: 'premium',
        restaurantName: values.restaurantName,
        cuisineType: values.cuisineType,
      };

      const promptPreview = await foodAdsApi.enhancePrompt(
        values.prompt,
        values.restaurantName,
        values.cuisineType,
      );

      const image = await foodAdsApi.generateImage(
        promptPreview.enhancedPrompt,
        values.model,
        values.restaurantName,
        values.cuisineType,
        metadata,
        values.device,
      );
      const campaignImage = image.images?.[0];
      const campaign = await foodAdsApi.generateCampaign(
        values.prompt,
        values.restaurantName,
        values.cuisineType,
        campaignImage
          ? {
              fileName: campaignImage.fileName,
              contentType: campaignImage.contentType,
              base64Data: campaignImage.base64Data,
            }
          : undefined,
      );
      setEnhancedTextPrompt(promptPreview.enhancedPrompt);
      setImageResult(image);
      setCampaignResult(campaign);
      showToast("Campaign & visual generated successfully!");
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Generation failed. Check that the backend and Python AI service are running.';
      setError(errorMessage);
      console.error('Generation error:', error);
    } finally {
      setLoading(false);
    }
  }

  const generatedImageSrc = imageResult?.images?.[0]
    ? `data:${imageResult.images[0].contentType};base64,${imageResult.images[0].base64Data}`
    : null;
  const outputsReady = Boolean(imageResult && campaignResult && enhancedTextPrompt);

  return (
    <div className="grid" style={{ gap: 20 }}>
      {toastMessage && <div className="copy-toast">{toastMessage}</div>}

      <div className="header-row">
        <div>
          <div className="muted" style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: 12 }}>
            Generation studio
          </div>
          <h2 style={{ margin: '10px 0 0', fontSize: '2rem' }}>Create the campaign in one pass</h2>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {campaignResult && (
            <button className="btn btn-secondary" type="button" onClick={handleCopyCampaignBrief}>
              <Share2 size={16} />
              Copy Campaign Brief
            </button>
          )}
          {imageResult && (
            <button className="btn btn-secondary" type="button" onClick={handleDownloadImage}>
              <Download size={16} />
              Download Image
            </button>
          )}
          {(campaignResult || imageResult) && (
            <button className="btn btn-secondary" type="button" onClick={handleDownloadReport}>
              <Download size={16} />
              Download Report
            </button>
          )}
        </div>
      </div>

      <div className="card-grid">
        <form className="panel span-6" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }} onSubmit={form.handleSubmit(handleGenerate)}>
          {restaurants.length > 0 && (
            <div className="field">
              <label>Prefill from Brand Profile</label>
              <select className="select" onChange={handleSelectRestaurant} defaultValue="">
                <option value="">-- Select a Restaurant --</option>
                {restaurants.map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.cuisineType})</option>
                ))}
              </select>
            </div>
          )}

          <div className="field">
            <label>Prompt</label>
            <textarea className="textarea" style={{ minHeight: 90 }} {...form.register('prompt')} />
            {promptError && <div className="muted" style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>{promptError}</div>}
            <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>
              This is the raw user prompt. It will be enhanced before sending to the image model.
            </div>
          </div>
          
          <div className="field">
            <label>Restaurant name</label>
            <input className="input" {...form.register('restaurantName')} />
          </div>
          <div className="field">
            <label>Cuisine type</label>
            <input className="input" {...form.register('cuisineType')} />
          </div>

          <div className="field">
            <label>Image model</label>
            <select className="select" {...form.register('model')}>
              <option value="base">Base SD Model</option>
              <option value="lora">LoRA Fine-tuned</option>
            </select>
          </div>
          <div className="field">
            <label>Hardware Acceleration</label>
            <select className="select" {...form.register('device')}>
              <option value="cuda">GPU (CUDA)</option>
              <option value="cpu">CPU (Slow)</option>
            </select>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} type="submit" disabled={loading}>
            {loading ? 'Generating campaign text and image...' : 'Generate campaign text + image'}
          </button>
          {error && <div className="alert" style={{ background: 'rgba(255, 107, 107, 0.1)', color: 'var(--danger)', padding: 12, borderRadius: 12, fontSize: 13 }}>{error}</div>}
        </form>

        <div className="panel span-6" style={{ padding: 24 }}>
          <div className="preview-tabs">
            <button className={`preview-tab-btn ${activeChannel === 'instagram' ? 'active' : ''}`} type="button" onClick={() => setActiveChannel('instagram')}>Instagram Feed</button>
            <button className={`preview-tab-btn ${activeChannel === 'google' ? 'active' : ''}`} type="button" onClick={() => setActiveChannel('google')}>Google Search</button>
            <button className={`preview-tab-btn ${activeChannel === 'email' ? 'active' : ''}`} type="button" onClick={() => setActiveChannel('email')}>Email Newsletter</button>
            <button className={`preview-tab-btn ${activeChannel === 'push' ? 'active' : ''}`} type="button" onClick={() => setActiveChannel('push')}>Mobile Preview</button>
            <button className={`preview-tab-btn ${activeChannel === 'calendar' ? 'active' : ''}`} type="button" onClick={() => setActiveChannel('calendar')}>Content Calendar</button>
          </div>

          <div style={{ minHeight: 400, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {activeChannel === 'instagram' && (
              <div className="mock-instagram-card">
                <div className="mock-insta-header">
                  <div className="mock-insta-avatar">{watchRestaurantName.substring(0,2).toUpperCase()}</div>
                  <div>
                    <div className="mock-insta-username">{watchRestaurantName}</div>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>Sponsored</div>
                  </div>
                </div>
                <div className="mock-insta-image-wrapper">
                  {generatedImageSrc ? (
                    <img src={generatedImageSrc} alt="Generated Campaign Visual" />
                  ) : (
                    <div style={{ minHeight: 290, display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,0.5)', fontSize: 14, background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.04))' }}>
                      Your generated image will appear here
                    </div>
                  )}
                </div>
                <div className="mock-insta-actions">
                  <span style={{ fontSize: 13, fontWeight: 600 }}>♥ 1,248 likes</span>
                </div>
                <div className="mock-insta-body">
                  <div className="copy-wrapper">
                    <p style={{ margin: 0, paddingRight: 32 }}>
                      <strong>{watchRestaurantName}</strong> {campaignResult?.caption || 'A premium culinary experience crafted to showcase the best ingredients.'} <span style={{ color: '#3897f0' }}>{campaignResult?.hashtags.join(' ') || '#gourmet #foodie'}</span>
                    </p>
                    {campaignResult && (
                      <button className="copy-btn-floating" type="button" title="Copy Instagram Caption" onClick={() => handleCopyToClipboard(campaignResult.caption + ' ' + campaignResult.hashtags.join(' '), 'Instagram post')}>
                        <Copy size={14} />
                      </button>
                    )}
                  </div>
                  <div style={{ marginTop: 8, color: 'var(--accent)', fontWeight: 600, fontSize: 13, textTransform: 'uppercase', cursor: 'pointer' }}>
                    {campaignResult?.cta || 'Learn More'} ›
                  </div>
                </div>
              </div>
            )}

            {activeChannel === 'google' && (
              <div className="mock-google-card">
                <div className="mock-google-domain">Ad · https://www.foodads.ai/{watchRestaurantName.toLowerCase().replace(/\s+/g, '')}</div>
                <div className="copy-wrapper">
                  <h4 className="mock-google-title">{campaignResult?.headline || `Taste the Best at ${watchRestaurantName}`}</h4>
                  {campaignResult && (
                    <button className="copy-btn-floating" type="button" title="Copy Headline" onClick={() => handleCopyToClipboard(campaignResult.headline, 'Google Ad Headline')}>
                      <Copy size={14} />
                    </button>
                  )}
                </div>
                <div className="copy-wrapper" style={{ marginTop: 6 }}>
                  <p className="mock-google-desc">{campaignResult?.googleAdsCopy || 'Experience mouth-watering recipes and premium flavor combinations. Order online now for exclusive launch offers.'}</p>
                  {campaignResult && (
                    <button className="copy-btn-floating" type="button" title="Copy Description" onClick={() => handleCopyToClipboard(campaignResult.googleAdsCopy, 'Google Ad Description')}>
                      <Copy size={14} />
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeChannel === 'email' && (
              <div className="mock-email-card">
                <div className="copy-wrapper mock-email-subject">
                  <span><strong>Subject:</strong> {campaignResult?.emailSubject || `An exclusive invite from ${watchRestaurantName}`}</span>
                  {campaignResult && (
                    <button className="copy-btn-floating" type="button" title="Copy Subject Line" onClick={() => handleCopyToClipboard(campaignResult.emailSubject, 'Email Subject')}>
                      <Copy size={14} />
                    </button>
                  )}
                </div>
                <div className="mock-email-body-content">
                  <h3 style={{ margin: '0 0 12px 0', color: '#1a202c' }}>{campaignResult?.headline || 'New Season Specials'}</h3>
                  {generatedImageSrc ? (
                    <img src={generatedImageSrc} className="mock-email-img" alt="Newsletter Visual" />
                  ) : (
                    <div className="mock-email-img" style={{ display: 'grid', placeItems: 'center', color: '#666' }}>
                      Your generated image will appear here
                    </div>
                  )}
                  <div className="copy-wrapper">
                    <p style={{ margin: 0, paddingRight: 32, whiteSpace: 'pre-line' }}>{campaignResult?.emailBody || `Hello Foodie,\n\nWe are excited to share our latest special creations. Crafted with fine details and local ingredients. Check out our menu and claim your discount now.`}</p>
                    {campaignResult && (
                      <button className="copy-btn-floating" type="button" title="Copy Email Body" onClick={() => handleCopyToClipboard(campaignResult.emailBody, 'Email Body')}>
                        <Copy size={14} />
                      </button>
                    )}
                  </div>
                  <div style={{ marginTop: 20, textAlign: 'center' }}>
                    <a href="#cta" style={{ background: '#d85b2e', color: 'white', padding: '10px 24px', borderRadius: 8, fontWeight: 'bold', display: 'inline-block', fontSize: 14 }}>
                      {campaignResult?.cta || 'Book a Table'}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {activeChannel === 'push' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="mock-sms-card">
                  <div className="mock-sms-header">
                    <span>💬 SMS Message</span>
                    <span>now</span>
                  </div>
                  <div className="copy-wrapper mock-sms-bubble">
                    <span style={{ paddingRight: 24 }}>{campaignResult?.smsMessage || `Special offer from ${watchRestaurantName}: Get 20% off your next order. Limited time only!`}</span>
                    {campaignResult && (
                      <button className="copy-btn-floating" type="button" title="Copy SMS" onClick={() => handleCopyToClipboard(campaignResult.smsMessage, 'SMS text')}>
                        <Copy size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mock-sms-card">
                  <div className="mock-sms-header">
                    <span>🔔 Push Notification</span>
                    <span>now</span>
                  </div>
                  <div className="copy-wrapper mock-sms-bubble">
                    <span style={{ paddingRight: 24 }}>
                      <strong>{watchRestaurantName}</strong><br />
                      {campaignResult?.pushNotification || `🔥 New Campaign Launched! Taste our signature dish today.`}
                    </span>
                    {campaignResult && (
                      <button className="copy-btn-floating" type="button" title="Copy Notification" onClick={() => handleCopyToClipboard(campaignResult.pushNotification, 'Push notification text')}>
                        <Copy size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeChannel === 'calendar' && (
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 12 }}>3-DAY SOCIAL CONTENT CALENDAR</div>
                <div className="calendar-board">
                  <div className="calendar-day-card">
                    <div className="calendar-day-title">Day 1: Teaser</div>
                    <p style={{ fontSize: 13, lineHeight: 1.4, margin: '0 0 12px 0' }}>{campaignResult?.contentCalendar?.[0] || 'Day 1: teaser post'}</p>
                    {campaignResult?.contentCalendar?.[0] && (
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 11 }} type="button" onClick={() => handleCopyToClipboard(campaignResult.contentCalendar[0], 'Day 1 post')}>
                        <Copy size={10} /> Copy
                      </button>
                    )}
                  </div>

                  <div className="calendar-day-card">
                    <div className="calendar-day-title">Day 2: Hero</div>
                    <p style={{ fontSize: 13, lineHeight: 1.4, margin: '0 0 12px 0' }}>{campaignResult?.contentCalendar?.[1] || 'Day 2: hero image'}</p>
                    {campaignResult?.contentCalendar?.[1] && (
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 11 }} type="button" onClick={() => handleCopyToClipboard(campaignResult.contentCalendar[1], 'Day 2 post')}>
                        <Copy size={10} /> Copy
                      </button>
                    )}
                  </div>

                  <div className="calendar-day-card">
                    <div className="calendar-day-title">Day 3: Offer</div>
                    <p style={{ fontSize: 13, lineHeight: 1.4, margin: '0 0 12px 0' }}>{campaignResult?.contentCalendar?.[2] || 'Day 3: offer reminder'}</p>
                    {campaignResult?.contentCalendar?.[2] && (
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 11 }} type="button" onClick={() => handleCopyToClipboard(campaignResult.contentCalendar[2], 'Day 3 post')}>
                        <Copy size={10} /> Copy
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 24, padding: 16, borderRadius: 18, background: 'rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Prompt Sent To Image Model</div>
              {(enhancedTextPrompt || imageResult?.enhancedPrompt) && (
                <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 11 }} type="button" onClick={() => handleCopyToClipboard(enhancedTextPrompt ?? imageResult?.enhancedPrompt ?? '', 'Enhanced prompt')}>
                  <Copy size={12} /> Copy
                </button>
              )}
            </div>
            <p style={{ lineHeight: 1.6, margin: 0, fontSize: 14 }}>
              {enhancedTextPrompt ?? imageResult?.enhancedPrompt ?? 'The enhanced prompt will appear here after generation.'}
            </p>
          </div>

          {outputsReady && (
            <div className="generation-summary-card">
              <div className="generation-summary-header">
                <div>
                  <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>All Outputs Ready</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                    <span className="status-check-badge" aria-hidden="true">
                      <CheckCircle2 size={18} />
                    </span>
                    <strong>Generation finished</strong>
                  </div>
                </div>
                <span className="history-status" style={{ color: 'var(--accent-2)' }}>Complete</span>
              </div>

              <div className="generation-status-grid">
                <div className="generation-status-row">
                  <span className="generation-status-label"><ImageIcon size={14} /> Image</span>
                  <span className="generation-status-value">Generated</span>
                </div>
                <div className="generation-status-row">
                  <span className="generation-status-label"><Type size={14} /> Headline</span>
                  <span className="generation-status-value">Generated</span>
                </div>
                <div className="generation-status-row">
                  <span className="generation-status-label"><Sparkles size={14} /> Caption</span>
                  <span className="generation-status-value">Generated</span>
                </div>
                <div className="generation-status-row">
                  <span className="generation-status-label"><MessageSquareText size={14} /> SMS</span>
                  <span className="generation-status-value">Generated</span>
                </div>
                <div className="generation-status-row">
                  <span className="generation-status-label"><Download size={14} /> Report</span>
                  <span className="generation-status-value">Ready</span>
                </div>
              </div>

              <div className="generation-compact-summary">
                <div className="generation-summary-image">
                  {generatedImageSrc ? (
                    <img src={generatedImageSrc} alt="Generated campaign preview" />
                  ) : (
                    <div className="generation-summary-empty">Image preview</div>
                  )}
                </div>
                <div className="generation-summary-copy">
                  <div>
                    <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Headline</div>
                    <div className="generation-summary-text">{campaignResult?.headline || 'Waiting for headline'}</div>
                  </div>
                  <div>
                    <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Caption</div>
                    <div className="generation-summary-text">{campaignResult?.caption || 'Waiting for caption'}</div>
                  </div>
                  <div>
                    <div className="muted" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>SMS</div>
                    <div className="generation-summary-text">{campaignResult?.smsMessage || 'Waiting for SMS'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
