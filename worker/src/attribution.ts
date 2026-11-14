/** Only accept bounded campaign labels, never arbitrary URLs or contact details. */
export function signupSourceLabel(base: string, value: unknown): string {
  if (!value || typeof value !== 'object') return base
  const { source, campaign } = value as Record<string, unknown>
  if (typeof source !== 'string' || !['facebook', 'instagram', 'tiktok', 'youtube'].includes(source)) return base
  const safeCampaign = typeof campaign === 'string' && /^[a-z0-9_-]{1,80}$/i.test(campaign) ? campaign : ''
  return `${base} / ${source}${safeCampaign ? ` / ${safeCampaign}` : ''}`
}
