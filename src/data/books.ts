export type NeviimSubcategory = 'former-prophets' | 'latter-prophets' | 'trei-asar'
export type KetuvimSubcategory = 'sifrei-emet' | 'megillot' | 'other-writings'

export interface BibleBook {
  /** Slug used to fetch this book's text (Sefaria ref for OT, bible-api.com name for NT) */
  slug: string
  english: string
  hebrew?: string
  /** English transliteration of the Hebrew name, e.g. "Tehillim" for Psalms. */
  transliteration?: string
  chapters: number
  testament: 'old' | 'new'
  /** Tanakh division this book belongs to (Old Testament books only). */
  division?: 'torah' | 'neviim' | 'ketuvim'
  /** Traditional sub-grouping within Nevi'im or Ketuvim. */
  subcategory?: NeviimSubcategory | KetuvimSubcategory
  /** Standard 1-66 book number (Genesis=1 ... Revelation=66), used for the Greek NT source */
  bookNumber?: number
}

// Ordered per the traditional Tanakh (Torah, Nevi'im, Ketuvim), not the
// Christian Old Testament ordering.
export const OLD_TESTAMENT_BOOKS: BibleBook[] = [
  // Torah
  { slug: 'Genesis', english: 'Genesis', hebrew: 'בְּרֵאשִׁית', transliteration: 'Bereshit', chapters: 50, testament: 'old', division: 'torah' },
  { slug: 'Exodus', english: 'Exodus', hebrew: 'שְׁמוֹת', transliteration: 'Shemot', chapters: 40, testament: 'old', division: 'torah' },
  { slug: 'Leviticus', english: 'Leviticus', hebrew: 'וַיִּקְרָא', transliteration: 'Vayikra', chapters: 27, testament: 'old', division: 'torah' },
  { slug: 'Numbers', english: 'Numbers', hebrew: 'בְּמִדְבַּר', transliteration: 'Bamidbar', chapters: 36, testament: 'old', division: 'torah' },
  { slug: 'Deuteronomy', english: 'Deuteronomy', hebrew: 'דְּבָרִים', transliteration: 'Devarim', chapters: 34, testament: 'old', division: 'torah' },

  // Nevi'im — Former Prophets (נביאים ראשונים)
  { slug: 'Joshua', english: 'Joshua', hebrew: 'יְהוֹשֻׁעַ', transliteration: 'Yehoshua', chapters: 24, testament: 'old', division: 'neviim', subcategory: 'former-prophets' },
  { slug: 'Judges', english: 'Judges', hebrew: 'שׁוֹפְטִים', transliteration: 'Shoftim', chapters: 21, testament: 'old', division: 'neviim', subcategory: 'former-prophets' },
  { slug: 'I_Samuel', english: '1 Samuel', hebrew: 'שְׁמוּאֵל א', transliteration: 'Shmuel Alef', chapters: 31, testament: 'old', division: 'neviim', subcategory: 'former-prophets' },
  { slug: 'II_Samuel', english: '2 Samuel', hebrew: 'שְׁמוּאֵל ב', transliteration: 'Shmuel Bet', chapters: 24, testament: 'old', division: 'neviim', subcategory: 'former-prophets' },
  { slug: 'I_Kings', english: '1 Kings', hebrew: 'מְלָכִים א', transliteration: 'Melachim Alef', chapters: 22, testament: 'old', division: 'neviim', subcategory: 'former-prophets' },
  { slug: 'II_Kings', english: '2 Kings', hebrew: 'מְלָכִים ב', transliteration: 'Melachim Bet', chapters: 25, testament: 'old', division: 'neviim', subcategory: 'former-prophets' },

  // Nevi'im — Latter Prophets (נביאים אחרונים)
  { slug: 'Isaiah', english: 'Isaiah', hebrew: 'יְשַׁעְיָהוּ', transliteration: 'Yeshayahu', chapters: 66, testament: 'old', division: 'neviim', subcategory: 'latter-prophets' },
  { slug: 'Jeremiah', english: 'Jeremiah', hebrew: 'יִרְמְיָהוּ', transliteration: 'Yirmeyahu', chapters: 52, testament: 'old', division: 'neviim', subcategory: 'latter-prophets' },
  { slug: 'Ezekiel', english: 'Ezekiel', hebrew: 'יְחֶזְקֵאל', transliteration: 'Yechezkel', chapters: 48, testament: 'old', division: 'neviim', subcategory: 'latter-prophets' },

  // Nevi'im — Trei Asar (תרי עשר), the Twelve Minor Prophets
  { slug: 'Hosea', english: 'Hosea', hebrew: 'הוֹשֵׁעַ', transliteration: 'Hoshea', chapters: 14, testament: 'old', division: 'neviim', subcategory: 'trei-asar' },
  { slug: 'Joel', english: 'Joel', hebrew: 'יוֹאֵל', transliteration: 'Yoel', chapters: 3, testament: 'old', division: 'neviim', subcategory: 'trei-asar' },
  { slug: 'Amos', english: 'Amos', hebrew: 'עָמוֹס', transliteration: 'Amos', chapters: 9, testament: 'old', division: 'neviim', subcategory: 'trei-asar' },
  { slug: 'Obadiah', english: 'Obadiah', hebrew: 'עֹבַדְיָה', transliteration: 'Ovadiah', chapters: 1, testament: 'old', division: 'neviim', subcategory: 'trei-asar' },
  { slug: 'Jonah', english: 'Jonah', hebrew: 'יוֹנָה', transliteration: 'Yonah', chapters: 4, testament: 'old', division: 'neviim', subcategory: 'trei-asar' },
  { slug: 'Micah', english: 'Micah', hebrew: 'מִיכָה', transliteration: 'Michah', chapters: 7, testament: 'old', division: 'neviim', subcategory: 'trei-asar' },
  { slug: 'Nahum', english: 'Nahum', hebrew: 'נַחוּם', transliteration: 'Nachum', chapters: 3, testament: 'old', division: 'neviim', subcategory: 'trei-asar' },
  { slug: 'Habakkuk', english: 'Habakkuk', hebrew: 'חֲבַקּוּק', transliteration: 'Chavakuk', chapters: 3, testament: 'old', division: 'neviim', subcategory: 'trei-asar' },
  { slug: 'Zephaniah', english: 'Zephaniah', hebrew: 'צְפַנְיָה', transliteration: 'Tzefaniah', chapters: 3, testament: 'old', division: 'neviim', subcategory: 'trei-asar' },
  { slug: 'Haggai', english: 'Haggai', hebrew: 'חַגַּי', transliteration: 'Chaggai', chapters: 2, testament: 'old', division: 'neviim', subcategory: 'trei-asar' },
  { slug: 'Zechariah', english: 'Zechariah', hebrew: 'זְכַרְיָה', transliteration: 'Zecharyah', chapters: 14, testament: 'old', division: 'neviim', subcategory: 'trei-asar' },
  { slug: 'Malachi', english: 'Malachi', hebrew: 'מַלְאָכִי', transliteration: 'Malachi', chapters: 4, testament: 'old', division: 'neviim', subcategory: 'trei-asar' },

  // Ketuvim — Sifrei Emet (סִפְרֵי אֱמֶ״ת), the poetic/wisdom books
  { slug: 'Psalms', english: 'Psalms', hebrew: 'תְּהִלִּים', transliteration: 'Tehillim', chapters: 150, testament: 'old', division: 'ketuvim', subcategory: 'sifrei-emet' },
  { slug: 'Proverbs', english: 'Proverbs', hebrew: 'מִשְׁלֵי', transliteration: 'Mishlei', chapters: 31, testament: 'old', division: 'ketuvim', subcategory: 'sifrei-emet' },
  { slug: 'Job', english: 'Job', hebrew: 'אִיּוֹב', transliteration: 'Iyov', chapters: 42, testament: 'old', division: 'ketuvim', subcategory: 'sifrei-emet' },

  // Ketuvim — Five Megillot (חֲמֵשׁ מְגִלּוֹת), the Five Scrolls
  { slug: 'Song_of_Songs', english: 'Song of Songs', hebrew: 'שִׁיר הַשִּׁירִים', transliteration: 'Shir HaShirim', chapters: 8, testament: 'old', division: 'ketuvim', subcategory: 'megillot' },
  { slug: 'Ruth', english: 'Ruth', hebrew: 'רוּת', transliteration: 'Rut', chapters: 4, testament: 'old', division: 'ketuvim', subcategory: 'megillot' },
  { slug: 'Lamentations', english: 'Lamentations', hebrew: 'אֵיכָה', transliteration: 'Eichah', chapters: 5, testament: 'old', division: 'ketuvim', subcategory: 'megillot' },
  { slug: 'Ecclesiastes', english: 'Ecclesiastes', hebrew: 'קֹהֶלֶת', transliteration: 'Kohelet', chapters: 12, testament: 'old', division: 'ketuvim', subcategory: 'megillot' },
  { slug: 'Esther', english: 'Esther', hebrew: 'אֶסְתֵּר', transliteration: 'Ester', chapters: 10, testament: 'old', division: 'ketuvim', subcategory: 'megillot' },

  // Ketuvim — remaining Writings
  { slug: 'Daniel', english: 'Daniel', hebrew: 'דָּנִיֵּאל', transliteration: 'Daniel', chapters: 12, testament: 'old', division: 'ketuvim', subcategory: 'other-writings' },
  { slug: 'Ezra', english: 'Ezra', hebrew: 'עֶזְרָא', transliteration: 'Ezra', chapters: 10, testament: 'old', division: 'ketuvim', subcategory: 'other-writings' },
  { slug: 'Nehemiah', english: 'Nehemiah', hebrew: 'נְחֶמְיָה', transliteration: 'Nechemyah', chapters: 13, testament: 'old', division: 'ketuvim', subcategory: 'other-writings' },
  { slug: 'I_Chronicles', english: '1 Chronicles', hebrew: 'דִּבְרֵי הַיָּמִים א', transliteration: 'Divrei HaYamim Alef', chapters: 29, testament: 'old', division: 'ketuvim', subcategory: 'other-writings' },
  { slug: 'II_Chronicles', english: '2 Chronicles', hebrew: 'דִּבְרֵי הַיָּמִים ב', transliteration: 'Divrei HaYamim Bet', chapters: 36, testament: 'old', division: 'ketuvim', subcategory: 'other-writings' },
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
