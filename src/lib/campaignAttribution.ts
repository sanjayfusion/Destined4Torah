const KEY = 'd4t_campaign_session'
const SOURCES = new Set(['facebook', 'instagram', 'tiktok', 'youtube'])

export type CampaignAttribution = { source: string; campaign: string }

export function parseCampaign(search: string): CampaignAttribution | null {
  const params = new URLSearchParams(search)
  const source = (params.get('utm_source') ?? '').toLowerCase()
  const campaign = params.get('utm_campaign') ?? ''
  if (!SOURCES.has(source)) return null
  return { source, campaign: /^[a-z0-9_-]{1,80}$/i.test(campaign) ? campaign : '' }
}

// Session-only campaign labels; never store contact details or full referring URLs.
export function captureCampaign(): void {
  const campaign = parseCampaign(window.location.search)
  if (!campaign) return
  try { window.sessionStorage.setItem(KEY, JSON.stringify(campaign)) } catch { /* Storage is optional. */ }
}

export function getCampaign(): CampaignAttribution | null {
  const current = parseCampaign(window.location.search)
  if (current) return current
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(KEY) ?? 'null') as CampaignAttribution | null
    if (!saved || typeof saved.source !== 'string' || typeof saved.campaign !== 'string') return null
    return parseCampaign(new URLSearchParams({ utm_source: saved.source, utm_campaign: saved.campaign }).toString())
  } catch { return null }
}
