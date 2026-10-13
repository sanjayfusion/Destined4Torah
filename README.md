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

## Shareable passages

Use `?ref=John+3%3A16` for a verse, `?ref=Genesis+1` for a chapter,
or `?parsha=Noach` for a fixed Torah portion. Combined portions such as
`?parsha=Vayakhel-Pekudei` are supported. Copy buttons generate these URLs;
browser Back/Forward restores the passage. Invalid links fall back to the
weekly reading, and unavailable verse numbers show a notice with the chapter.

## Continue studying

The app remembers the last successfully loaded chapter, selected verse, or
fixed Torah portion in browser local storage. Opening the homepage resumes it;
an explicit passage or navigation URL always takes precedence. The Continue
studying button remains available on other views. Progress stays on the device,
does not require an account, and is not sent to the newsletter service. If
browser storage is unavailable, reading and sharing still work normally.
