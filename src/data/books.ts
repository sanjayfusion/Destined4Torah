export interface BibleBook {
  /** Slug used to fetch this book's text (Sefaria ref for OT, bible-api.com name for NT) */
  slug: string
  english: string
  hebrew?: string
  chapters: number
  testament: 'old' | 'new'
  /** Standard 1-66 book number (Genesis=1 ... Revelation=66), used for the Greek NT source */
  bookNumber?: number
}

export const OLD_TESTAMENT_BOOKS: BibleBook[] = [
  { slug: 'Genesis', english: 'Genesis', hebrew: 'בְּרֵאשִׁית', chapters: 50, testament: 'old' },
  { slug: 'Exodus', english: 'Exodus', hebrew: 'שְׁמוֹת', chapters: 40, testament: 'old' },
  { slug: 'Leviticus', english: 'Leviticus', hebrew: 'וַיִּקְרָא', chapters: 27, testament: 'old' },
  { slug: 'Numbers', english: 'Numbers', hebrew: 'בְּמִדְבַּר', chapters: 36, testament: 'old' },
  { slug: 'Deuteronomy', english: 'Deuteronomy', hebrew: 'דְּבָרִים', chapters: 34, testament: 'old' },
  { slug: 'Joshua', english: 'Joshua', hebrew: 'יְהוֹשֻׁעַ', chapters: 24, testament: 'old' },
  { slug: 'Judges', english: 'Judges', hebrew: 'שׁוֹפְטִים', chapters: 21, testament: 'old' },
  { slug: 'Ruth', english: 'Ruth', hebrew: 'רוּת', chapters: 4, testament: 'old' },
  { slug: 'I_Samuel', english: '1 Samuel', hebrew: 'שְׁמוּאֵל א', chapters: 31, testament: 'old' },
  { slug: 'II_Samuel', english: '2 Samuel', hebrew: 'שְׁמוּאֵל ב', chapters: 24, testament: 'old' },
  { slug: 'I_Kings', english: '1 Kings', hebrew: 'מְלָכִים א', chapters: 22, testament: 'old' },
  { slug: 'II_Kings', english: '2 Kings', hebrew: 'מְלָכִים ב', chapters: 25, testament: 'old' },
  { slug: 'I_Chronicles', english: '1 Chronicles', hebrew: 'דִּבְרֵי הַיָּמִים א', chapters: 29, testament: 'old' },
  { slug: 'II_Chronicles', english: '2 Chronicles', hebrew: 'דִּבְרֵי הַיָּמִים ב', chapters: 36, testament: 'old' },
  { slug: 'Ezra', english: 'Ezra', hebrew: 'עֶזְרָא', chapters: 10, testament: 'old' },
  { slug: 'Nehemiah', english: 'Nehemiah', hebrew: 'נְחֶמְיָה', chapters: 13, testament: 'old' },
  { slug: 'Esther', english: 'Esther', hebrew: 'אֶסְתֵּר', chapters: 10, testament: 'old' },
  { slug: 'Job', english: 'Job', hebrew: 'אִיּוֹב', chapters: 42, testament: 'old' },
  { slug: 'Psalms', english: 'Psalms', hebrew: 'תְּהִלִּים', chapters: 150, testament: 'old' },
  { slug: 'Proverbs', english: 'Proverbs', hebrew: 'מִשְׁלֵי', chapters: 31, testament: 'old' },
  { slug: 'Ecclesiastes', english: 'Ecclesiastes', hebrew: 'קֹהֶלֶת', chapters: 12, testament: 'old' },
  { slug: 'Song_of_Songs', english: 'Song of Songs', hebrew: 'שִׁיר הַשִּׁירִים', chapters: 8, testament: 'old' },
  { slug: 'Isaiah', english: 'Isaiah', hebrew: 'יְשַׁעְיָהוּ', chapters: 66, testament: 'old' },
  { slug: 'Jeremiah', english: 'Jeremiah', hebrew: 'יִרְמְיָהוּ', chapters: 52, testament: 'old' },
  { slug: 'Lamentations', english: 'Lamentations', hebrew: 'אֵיכָה', chapters: 5, testament: 'old' },
  { slug: 'Ezekiel', english: 'Ezekiel', hebrew: 'יְחֶזְקֵאל', chapters: 48, testament: 'old' },
  { slug: 'Daniel', english: 'Daniel', hebrew: 'דָּנִיֵּאל', chapters: 12, testament: 'old' },
  { slug: 'Hosea', english: 'Hosea', hebrew: 'הוֹשֵׁעַ', chapters: 14, testament: 'old' },
  { slug: 'Joel', english: 'Joel', hebrew: 'יוֹאֵל', chapters: 3, testament: 'old' },
  { slug: 'Amos', english: 'Amos', hebrew: 'עָמוֹס', chapters: 9, testament: 'old' },
  { slug: 'Obadiah', english: 'Obadiah', hebrew: 'עֹבַדְיָה', chapters: 1, testament: 'old' },
  { slug: 'Jonah', english: 'Jonah', hebrew: 'יוֹנָה', chapters: 4, testament: 'old' },
  { slug: 'Micah', english: 'Micah', hebrew: 'מִיכָה', chapters: 7, testament: 'old' },
  { slug: 'Nahum', english: 'Nahum', hebrew: 'נַחוּם', chapters: 3, testament: 'old' },
  { slug: 'Habakkuk', english: 'Habakkuk', hebrew: 'חֲבַקּוּק', chapters: 3, testament: 'old' },
  { slug: 'Zephaniah', english: 'Zephaniah', hebrew: 'צְפַנְיָה', chapters: 3, testament: 'old' },
  { slug: 'Haggai', english: 'Haggai', hebrew: 'חַגַּי', chapters: 2, testament: 'old' },
  { slug: 'Zechariah', english: 'Zechariah', hebrew: 'זְכַרְיָה', chapters: 14, testament: 'old' },
  { slug: 'Malachi', english: 'Malachi', hebrew: 'מַלְאָכִי', chapters: 4, testament: 'old' },
]

export const NEW_TESTAMENT_BOOKS: BibleBook[] = [
  { slug: 'Matthew', english: 'Matthew', chapters: 28, testament: 'new', bookNumber: 40 },
  { slug: 'Mark', english: 'Mark', chapters: 16, testament: 'new', bookNumber: 41 },
  { slug: 'Luke', english: 'Luke', chapters: 24, testament: 'new', bookNumber: 42 },
  { slug: 'John', english: 'John', chapters: 21, testament: 'new', bookNumber: 43 },
  { slug: 'Acts', english: 'Acts', chapters: 28, testament: 'new', bookNumber: 44 },
  { slug: 'Romans', english: 'Romans', chapters: 16, testament: 'new', bookNumber: 45 },
  { slug: '1 Corinthians', english: '1 Corinthians', chapters: 16, testament: 'new', bookNumber: 46 },
  { slug: '2 Corinthians', english: '2 Corinthians', chapters: 13, testament: 'new', bookNumber: 47 },
  { slug: 'Galatians', english: 'Galatians', chapters: 6, testament: 'new', bookNumber: 48 },
  { slug: 'Ephesians', english: 'Ephesians', chapters: 6, testament: 'new', bookNumber: 49 },
  { slug: 'Philippians', english: 'Philippians', chapters: 4, testament: 'new', bookNumber: 50 },
  { slug: 'Colossians', english: 'Colossians', chapters: 4, testament: 'new', bookNumber: 51 },
  { slug: '1 Thessalonians', english: '1 Thessalonians', chapters: 5, testament: 'new', bookNumber: 52 },
  { slug: '2 Thessalonians', english: '2 Thessalonians', chapters: 3, testament: 'new', bookNumber: 53 },
  { slug: '1 Timothy', english: '1 Timothy', chapters: 6, testament: 'new', bookNumber: 54 },
  { slug: '2 Timothy', english: '2 Timothy', chapters: 4, testament: 'new', bookNumber: 55 },
  { slug: 'Titus', english: 'Titus', chapters: 3, testament: 'new', bookNumber: 56 },
  { slug: 'Philemon', english: 'Philemon', chapters: 1, testament: 'new', bookNumber: 57 },
  { slug: 'Hebrews', english: 'Hebrews', chapters: 13, testament: 'new', bookNumber: 58 },
  { slug: 'James', english: 'James', chapters: 5, testament: 'new', bookNumber: 59 },
  { slug: '1 Peter', english: '1 Peter', chapters: 5, testament: 'new', bookNumber: 60 },
  { slug: '2 Peter', english: '2 Peter', chapters: 3, testament: 'new', bookNumber: 61 },
  { slug: '1 John', english: '1 John', chapters: 5, testament: 'new', bookNumber: 62 },
  { slug: '2 John', english: '2 John', chapters: 1, testament: 'new', bookNumber: 63 },
  { slug: '3 John', english: '3 John', chapters: 1, testament: 'new', bookNumber: 64 },
  { slug: 'Jude', english: 'Jude', chapters: 1, testament: 'new', bookNumber: 65 },
  { slug: 'Revelation', english: 'Revelation', chapters: 22, testament: 'new', bookNumber: 66 },
]

export const ALL_BOOKS: BibleBook[] = [...OLD_TESTAMENT_BOOKS, ...NEW_TESTAMENT_BOOKS]

/** Legacy alias kept for the Torah-only chapter grid used elsewhere (parsha, etc). */
export const TORAH_BOOKS = OLD_TESTAMENT_BOOKS.slice(0, 5)
