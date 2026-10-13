# Destined4Torah

A simple web app for studying the Five Books of Moses in Hebrew and English.

Browse by book and chapter; verse text is fetched live from the free
[Sefaria API](https://www.sefaria.org/developers).

## Stack

- React + TypeScript
- Vite

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Regression checks

Start the development server and open `/tests/regressions.html` in a browser.
It checks Scripture HTML cleanup, final Hebrew vowel placement, and news freshness
with deterministic feed fixtures; it does not submit forms or contact subscribers.
