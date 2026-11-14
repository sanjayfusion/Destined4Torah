# Social signup attribution

Prepared on branch `codex/social-attribution-2026-11-14`; not deployed.

Tagged links use `utm_source` (facebook, instagram, tiktok, youtube), `utm_medium=organic_social` and a stable `utm_campaign`. The app remembers only allowed source/campaign labels for the browser tab session, including after navigation to Subscribe. Blocked or corrupt storage does not prevent signups. No visitor ID, full referring URL, or contact information is stored in session storage.

For a new subscriber, the newsletter backend validates the labels and appends them to the existing `source_name`, for example `After-reading prompt / instagram / daily_aliyah_vayetzei`. Existing list membership, double opt-in, suppression behavior and confirmed subscriber records remain unchanged. The admin’s existing Source filter and CSV export expose the new source labels after deployment. Count confirmed records by source to measure confirmed signups, not just form submissions. Existing subscriber attribution is not overwritten.

This does not measure page visits, profile-link clicks or sales, and cannot backfill historical conversions. Full visitor-to-signup rates require a separate site-analytics source. Direct `/join` fallback and QR signups retain their existing attribution; cross-device and browser changes break session attribution.

Deployment order after approval: deploy the worker validator, then the frontend. No database migration or paid analytics service is required. Rollback: restore the previous frontend and worker releases; existing source labels remain readable. Do not deploy or merge without Sanjay’s explicit approval.

Validation: frontend production build and worker TypeScript check passed; focused checks passed for accepted/unknown sources, invalid campaign strings, navigation preservation, malformed/blocked session storage and backend sanitization. Lint reports one existing warning in tests/commentary.tsx. No live signup was submitted and no confirmation email was sent.
