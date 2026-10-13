export interface ParshaListEntry {
  english: string
  hebrew: string
  ref: string
  /** Links to Sanjay's YouTube teaching(s) on this parasha — sometimes more than one part. */
  youtubeUrls?: string[]
  /** Actual video titles; separate teachings are not necessarily consecutive parts. */
  youtubeTitles?: string[]
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
      { english: 'Bereshit', hebrew: 'בְּרֵאשִׁית', ref: 'Genesis 1:1-6:8', youtubeUrls: ["https://www.youtube.com/watch?v=4boXYeN7J58"], youtubeTitles: ["Let there be Light"] },
      { english: 'Noach', hebrew: 'נֹחַ', ref: 'Genesis 6:9-11:32', youtubeUrls: ["https://www.youtube.com/watch?v=J1Q_wJsG4rg"], youtubeTitles: ["The Light in the Ark"] },
      { english: 'Lech Lecha', hebrew: 'לֶךְ־לְךָ', ref: 'Genesis 12:1-17:27', youtubeUrls: ["https://www.youtube.com/watch?v=hDd1nsURl04", "https://www.youtube.com/watch?v=FL4pFvb3dSs"], youtubeTitles: ["Be the Light", "Go to Yourself"] },
      { english: 'Vayera', hebrew: 'וַיֵּרָא', ref: 'Genesis 18:1-22:24', youtubeUrls: ["https://www.youtube.com/watch?v=evIg4s9nhd8", "https://www.youtube.com/watch?v=q-U4YzchJ7k"], youtubeTitles: ["Immersed in the Light", "And He Appeared"] },
      { english: 'Chayei Sarah', hebrew: 'חַיֵּי שָׂרָה', ref: 'Genesis 23:1-25:18', youtubeUrls: ["https://www.youtube.com/watch?v=T8hVfubgE0I"], youtubeTitles: ["The World to Come"] },
      { english: 'Toldot', hebrew: 'תּוֹלְדֹת', ref: 'Genesis 25:19-28:9', youtubeUrls: ["https://www.youtube.com/watch?v=eAx7P_asQbg"], youtubeTitles: ["Generations"] },
      { english: 'Vayetzei', hebrew: 'וַיֵּצֵא', ref: 'Genesis 28:10-32:3', youtubeUrls: ["https://www.youtube.com/watch?v=8sVcqPs5zAY"], youtubeTitles: ["And He Went Out"] },
      { english: 'Vayishlach', hebrew: 'וַיִּשְׁלַח', ref: 'Genesis 32:4-36:43', youtubeUrls: ["https://www.youtube.com/watch?v=XHLKnGEeIys"], youtubeTitles: ["And He Sent — Angels at your Disposal"] },
      { english: 'Vayeshev', hebrew: 'וַיֵּשֶׁב', ref: 'Genesis 37:1-40:23', youtubeUrls: ["https://www.youtube.com/watch?v=QIbFAp35X2s", "https://www.youtube.com/watch?v=9n-q7vcQ9do"], youtubeTitles: ["Coat of Light", "Mentored for the Anointing"] },
      { english: 'Miketz', hebrew: 'מִקֵּץ', ref: 'Genesis 41:1-44:17', youtubeUrls: ["https://www.youtube.com/watch?v=n0RP3he8auM", "https://www.youtube.com/watch?v=l68nxYG8w3s"], youtubeTitles: ["Light at the End of the Tunnel", "Living the Dream"] },
      { english: 'Vayigash', hebrew: 'וַיִּגַּשׁ', ref: 'Genesis 44:18-47:27', youtubeUrls: ["https://www.youtube.com/watch?v=bBTYPVTOXEE", "https://www.youtube.com/watch?v=nGTb4hORNko"], youtubeTitles: ["Approaching the Light", "Pride, Prejudice, & Torah"] },
      { english: 'Vayechi', hebrew: 'וַיְחִי', ref: 'Genesis 47:28-50:26', youtubeUrls: ["https://www.youtube.com/watch?v=bkFK6KadB6Q", "https://www.youtube.com/watch?v=1cBOilEiKQ4"], youtubeTitles: ["Live in the Light", "Unprecedented Changes of Messianic Proportions"] },
    ],
  },
  {
    book: 'Exodus',
    parshiyot: [
      {
        english: 'Shemot',
        hebrew: 'שְׁמוֹת',
        ref: 'Exodus 1:1-6:1',
        youtubeUrls: ["https://www.youtube.com/watch?v=WHbIZQqDKGs", "https://www.youtube.com/watch?v=yW1Vnpe-uIw", "https://www.youtube.com/watch?v=z4TpU_ov1cg", "https://www.youtube.com/watch?v=iUw1zjnpZqA"],
        youtubeTitles: ["Let there be Light in your Ark", "Filled With Light", "The Hidden Light of Divine Purpose", "In a Blaze of FIre"],
      },
      { english: 'Vaera', hebrew: 'וָאֵרָא', ref: 'Exodus 6:2-9:35', youtubeUrls: ["https://www.youtube.com/watch?v=e7e2IeUasmE"], youtubeTitles: ["Let there be Light in the Name (Part 2)"] },
      { english: 'Bo', hebrew: 'בֹּא', ref: 'Exodus 10:1-13:16', youtubeUrls: ["https://www.youtube.com/watch?v=BdrzI2KMttc", "https://www.youtube.com/watch?v=N-uu-nDwWgQ"], youtubeTitles: ["2019-02-22 The Rippling Effect of Time", "The Rippling Effects of Time"] },
      { english: 'Beshalach', hebrew: 'בְּשַׁלַּח', ref: 'Exodus 13:17-17:16', youtubeUrls: ["https://www.youtube.com/watch?v=_YW9eQp_I0M", "https://www.youtube.com/watch?v=lEMMet3R8nM"], youtubeTitles: ["Revealing the Light", "Revealing the Light"] },
      { english: 'Yitro', hebrew: 'יִתְרוֹ', ref: 'Exodus 18:1-20:23', youtubeUrls: ["https://www.youtube.com/watch?v=AzJO_5_tsnk", "https://www.youtube.com/watch?v=uJjS0mYizDs"], youtubeTitles: ["Receiving the Light", "Receiving the Light"] },
      { english: 'Mishpatim', hebrew: 'מִשְׁפָּטִים', ref: 'Exodus 21:1-24:18', youtubeUrls: ["https://www.youtube.com/watch?v=QQmgR2SiPcM"], youtubeTitles: ["God's Guiding Light"] },
      { english: 'Terumah', hebrew: 'תְּרוּמָה', ref: 'Exodus 25:1-27:19', youtubeUrls: ["https://www.youtube.com/watch?v=xgjy-PbNQFo", "https://www.youtube.com/watch?v=9-lwsNITkIU"], youtubeTitles: ["Make Me a Sanctuary", "Make Me a Sanctuary"] },
      { english: 'Tetzaveh', hebrew: 'תְּצַוֶּה', ref: 'Exodus 27:20-30:10', youtubeUrls: ["https://www.youtube.com/watch?v=3ByakZQRe1g", "https://www.youtube.com/watch?v=rg3oPyVJoJQ"], youtubeTitles: ["The Connection Between the Oil and the Light", "The Connection Between the Oil and the Light"] },
      { english: 'Ki Tisa', hebrew: 'כִּי תִשָּׂא', ref: 'Exodus 30:11-34:35', youtubeUrls: ["https://www.youtube.com/watch?v=kQvmPg0ChAc", "https://www.youtube.com/watch?v=3J2i-Lq0Sd4"], youtubeTitles: ["The Light in the Attributes of God’s Mercy", "The Light in the Attributes of God's Mercy"] },
      { english: 'Vayakhel', hebrew: 'וַיַּקְהֵל', ref: 'Exodus 35:1-38:20', youtubeUrls: ["https://www.youtube.com/watch?v=MC-KU48xa7g"], youtubeTitles: ["The Tabernacle of Jewelry"] },
      { english: 'Pekudei', hebrew: 'פְקוּדֵי', ref: 'Exodus 38:21-40:38', youtubeUrls: ["https://www.youtube.com/watch?v=MC-KU48xa7g"], youtubeTitles: ["The Tabernacle of Jewelry"] },
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
    const exact = group.parshiyot.find((parsha) => parsha.english === englishName)
    if (exact) return exact
    const parts = englishName.split('-')
    if (parts.length !== 2) continue
    const index = group.parshiyot.findIndex((entry) => entry.english === parts[0])
    const first = group.parshiyot[index]
    const second = group.parshiyot[index + 1]
    if (!first || second?.english !== parts[1]) continue
    const videos = new Map<string, string>()
    for (const entry of [first, second]) {
      entry.youtubeUrls?.forEach((url, i) => videos.set(url, entry.youtubeTitles?.[i] ?? "Sanjay's teaching"))
    }
    return {
      english: englishName,
      hebrew: `${first.hebrew}־${second.hebrew}`,
      ref: `${first.ref.split('-')[0]}-${second.ref.split('-')[1]}`,
      youtubeUrls: [...videos.keys()],
      youtubeTitles: [...videos.values()],
    }
  }
  return undefined
}
