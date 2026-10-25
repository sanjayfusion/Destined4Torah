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
browser Back/Forward restores the passage.
To copy Scripture, tap a verse number to select it, then tap another verse
number (or use + Next verse) to extend the selection to a range. A bar at the bottom of the page copies
the English text, the text with Hebrew or Greek, or a link to the first verse, then closes
and briefly confirms what was copied. Invalid links fall back to the
weekly reading, and unavailable verse numbers show a notice with the chapter.

## Continue studying

The app remembers the last successfully loaded chapter, selected verse, or
fixed Torah portion in browser local storage. Opening the homepage resumes it;
an explicit passage or navigation URL always takes precedence. The Continue
studying button remains available on other views. Progress stays on the device,
does not require an account, and is not sent to the newsletter service. If
browser storage is unavailable, reading and sharing still work normally.

## Read aloud

Read Hebrew aloud speaks each verse phrase by phrase, pausing at the
cantillation marks' natural breaks, with cantillation stripped so the voice
reads only the vowelled words. The word being spoken is highlighted in both
the Hebrew and the transliteration. The transliteration is shown right to left,
word for word under the Hebrew, so it can be followed in the same order. A Speed
menu (Very slow to Natural, default Slow) is remembered on the device. Most
Hebrew voices don't report word timing, so the highlight is estimated from
syllable counts and resyncs at the start of every phrase.
