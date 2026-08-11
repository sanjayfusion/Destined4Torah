export interface ParshaListEntry {
  english: string
  hebrew: string
  ref: string
  /** Links to Sanjay's YouTube teaching(s) on this parasha — sometimes more than one part. */
  youtubeUrls?: string[]
}

export interface TorahBookParshiyot {
  book: string
  parshiyot: ParshaListEntry[]
}

/**
 * The 54 traditional weekly Torah portions, in order, with their fixed
 * verse ranges. Some are read combined in non-leap years (e.g. "Vayakhel-
 * Pekudei"), but the 54 underlying divisions themselves never change —
 * this is a fixed, ancient tradition, not something that varies by year.
 */
export const PARSHIYOT_BY_BOOK: TorahBookParshiyot[] = [
  {
    book: 'Genesis',
    parshiyot: [
      { english: 'Bereshit', hebrew: 'בְּרֵאשִׁית', ref: 'Genesis 1:1-6:8' },
      { english: 'Noach', hebrew: 'נֹחַ', ref: 'Genesis 6:9-11:32' },
      { english: 'Lech Lecha', hebrew: 'לֶךְ־לְךָ', ref: 'Genesis 12:1-17:27' },
      { english: 'Vayera', hebrew: 'וַיֵּרָא', ref: 'Genesis 18:1-22:24' },
      { english: 'Chayei Sarah', hebrew: 'חַיֵּי שָׂרָה', ref: 'Genesis 23:1-25:18' },
      { english: 'Toldot', hebrew: 'תּוֹלְדֹת', ref: 'Genesis 25:19-28:9' },
      { english: 'Vayetzei', hebrew: 'וַיֵּצֵא', ref: 'Genesis 28:10-32:3' },
      { english: 'Vayishlach', hebrew: 'וַיִּשְׁלַח', ref: 'Genesis 32:4-36:43' },
      { english: 'Vayeshev', hebrew: 'וַיֵּשֶׁב', ref: 'Genesis 37:1-40:23' },
      { english: 'Miketz', hebrew: 'מִקֵּץ', ref: 'Genesis 41:1-44:17' },
      { english: 'Vayigash', hebrew: 'וַיִּגַּשׁ', ref: 'Genesis 44:18-47:27' },
      { english: 'Vayechi', hebrew: 'וַיְחִי', ref: 'Genesis 47:28-50:26' },
    ],
  },
  {
    book: 'Exodus',
    parshiyot: [
      {
        english: 'Shemot',
        hebrew: 'שְׁמוֹת',
        ref: 'Exodus 1:1-6:1',
        youtubeUrls: ['https://www.youtube.com/live/WHbIZQqDKGs', 'https://www.youtube.com/live/yW1Vnpe-uIw'],
      },
      { english: 'Vaera', hebrew: 'וָאֵרָא', ref: 'Exodus 6:2-9:35' },
      { english: 'Bo', hebrew: 'בֹּא', ref: 'Exodus 10:1-13:16' },
      { english: 'Beshalach', hebrew: 'בְּשַׁלַּח', ref: 'Exodus 13:17-17:16' },
      { english: 'Yitro', hebrew: 'יִתְרוֹ', ref: 'Exodus 18:1-20:23' },
      { english: 'Mishpatim', hebrew: 'מִשְׁפָּטִים', ref: 'Exodus 21:1-24:18' },
      { english: 'Terumah', hebrew: 'תְּרוּמָה', ref: 'Exodus 25:1-27:19' },
      { english: 'Tetzaveh', hebrew: 'תְּצַוֶּה', ref: 'Exodus 27:20-30:10' },
      { english: 'Ki Tisa', hebrew: 'כִּי תִשָּׂא', ref: 'Exodus 30:11-34:35' },
      { english: 'Vayakhel', hebrew: 'וַיַּקְהֵל', ref: 'Exodus 35:1-38:20' },
      { english: 'Pekudei', hebrew: 'פְקוּדֵי', ref: 'Exodus 38:21-40:38' },
    ],
  },
  {
    book: 'Leviticus',
    parshiyot: [
      { english: 'Vayikra', hebrew: 'וַיִּקְרָא', ref: 'Leviticus 1:1-5:26', youtubeUrls: ['https://youtu.be/T81fCHV8Oks'] },
      { english: 'Tzav', hebrew: 'צַו', ref: 'Leviticus 6:1-8:36', youtubeUrls: ['https://youtu.be/fd__3SBpWaM'] },
      { english: 'Shmini', hebrew: 'שְׁמִינִי', ref: 'Leviticus 9:1-11:47' },
      { english: 'Tazria', hebrew: 'תַזְרִיעַ', ref: 'Leviticus 12:1-13:59' },
      { english: 'Metzora', hebrew: 'מְצֹרָע', ref: 'Leviticus 14:1-15:33' },
      { english: 'Achrei Mot', hebrew: 'אַחֲרֵי מוֹת', ref: 'Leviticus 16:1-18:30' },
      { english: 'Kedoshim', hebrew: 'קְדֹשִׁים', ref: 'Leviticus 19:1-20:27' },
      { english: 'Emor', hebrew: 'אֱמֹר', ref: 'Leviticus 21:1-24:23' },
      { english: 'Behar', hebrew: 'בְּהַר', ref: 'Leviticus 25:1-26:2' },
      { english: 'Bechukotai', hebrew: 'בְּחֻקֹּתַי', ref: 'Leviticus 26:3-27:34' },
    ],
  },
  {
    book: 'Numbers',
    parshiyot: [
      { english: 'Bamidbar', hebrew: 'בְּמִדְבַּר', ref: 'Numbers 1:1-4:20' },
      { english: 'Nasso', hebrew: 'נָשֹׂא', ref: 'Numbers 4:21-7:89' },
      { english: "Beha'alotcha", hebrew: 'בְּהַעֲלֹתְךָ', ref: 'Numbers 8:1-12:16' },
      { english: "Sh'lach", hebrew: 'שְׁלַח', ref: 'Numbers 13:1-15:41' },
      { english: 'Korach', hebrew: 'קֹרַח', ref: 'Numbers 16:1-18:32' },
      { english: 'Chukat', hebrew: 'חֻקַּת', ref: 'Numbers 19:1-22:1' },
      { english: 'Balak', hebrew: 'בָּלָק', ref: 'Numbers 22:2-25:9' },
      { english: 'Pinchas', hebrew: 'פִּינְחָס', ref: 'Numbers 25:10-30:1' },
      { english: 'Matot', hebrew: 'מַטּוֹת', ref: 'Numbers 30:2-32:42' },
      { english: 'Masei', hebrew: 'מַסְעֵי', ref: 'Numbers 33:1-36:13' },
    ],
  },
  {
    book: 'Deuteronomy',
    parshiyot: [
      { english: 'Devarim', hebrew: 'דְּבָרִים', ref: 'Deuteronomy 1:1-3:22' },
      { english: 'Vaetchanan', hebrew: 'וָאֶתְחַנַּן', ref: 'Deuteronomy 3:23-7:11' },
      { english: 'Eikev', hebrew: 'עֵקֶב', ref: 'Deuteronomy 7:12-11:25' },
      { english: "Re'eh", hebrew: 'רְאֵה', ref: 'Deuteronomy 11:26-16:17' },
      { english: 'Shoftim', hebrew: 'שֹׁפְטִים', ref: 'Deuteronomy 16:18-21:9' },
      { english: 'Ki Teitzei', hebrew: 'כִּי תֵצֵא', ref: 'Deuteronomy 21:10-25:19' },
      { english: 'Ki Tavo', hebrew: 'כִּי תָבוֹא', ref: 'Deuteronomy 26:1-29:8' },
      { english: 'Nitzavim', hebrew: 'נִצָּבִים', ref: 'Deuteronomy 29:9-30:20' },
      { english: 'Vayeilech', hebrew: 'וַיֵּלֶךְ', ref: 'Deuteronomy 31:1-30' },
      { english: "Ha'azinu", hebrew: 'הַאֲזִינוּ', ref: 'Deuteronomy 32:1-52' },
      { english: "V'Zot HaBerachah", hebrew: 'וְזֹאת הַבְּרָכָה', ref: 'Deuteronomy 33:1-34:12' },
    ],
  },
]

/**
 * Looks up a parasha's static entry (including its YouTube link, if set)
 * by English name. Used to find the matching teaching video for "this
 * week's" parasha, whose name comes from Sefaria's live calendar rather
 * than from this list directly.
 */
export function findParshaEntry(englishName: string): ParshaListEntry | undefined {
  for (const group of PARSHIYOT_BY_BOOK) {
    const match = group.parshiyot.find((parsha) => parsha.english === englishName)
    if (match) return match
  }
  return undefined
}
