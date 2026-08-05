export interface StrongsEntry {
  strongs: string
  hebrew: string
  transliteration: string
  definition: string
}

/**
 * A curated set of key Hebrew words for word study, keyed by their bare
 * consonantal spelling (no niqqud/cantillation). Not exhaustive — this is
 * a hand-picked list of theologically significant, frequently occurring
 * words relevant to Torah study, not a full interlinear tagging of every
 * word in the text.
 */
export const STRONGS_HEBREW: Record<string, StrongsEntry> = {
  אלהים: { strongs: 'H430', hebrew: 'אֱלֹהִים', transliteration: 'Elohim', definition: 'God; gods, rulers, judges (a majestic plural, used with singular verbs for the God of Israel)' },
  יהוה: { strongs: 'H3068', hebrew: 'יְהוָה', transliteration: 'YHWH', definition: 'The proper, personal name of the God of Israel (the Tetragrammaton), traditionally read aloud as "Adonai"' },
  אדון: { strongs: 'H113', hebrew: 'אָדוֹן', transliteration: 'adon', definition: 'Lord, master, owner' },
  תורה: { strongs: 'H8451', hebrew: 'תּוֹרָה', transliteration: 'torah', definition: 'Law, instruction, teaching' },
  ראשית: { strongs: 'H7225', hebrew: 'רֵאשִׁית', transliteration: 'reshit', definition: 'Beginning, first, chief' },
  ברא: { strongs: 'H1254', hebrew: 'בָּרָא', transliteration: 'bara', definition: 'To create (used in Scripture exclusively of divine creative activity)' },
  אור: { strongs: 'H216', hebrew: 'אוֹר', transliteration: 'or', definition: 'Light' },
  שלום: { strongs: 'H7965', hebrew: 'שָׁלוֹם', transliteration: 'shalom', definition: 'Peace, wholeness, completeness, welfare' },
  חסד: { strongs: 'H2617', hebrew: 'חֶסֶד', transliteration: 'chesed', definition: 'Lovingkindness, steadfast love, mercy, covenant faithfulness' },
  ברית: { strongs: 'H1285', hebrew: 'בְּרִית', transliteration: 'berit', definition: 'Covenant, agreement, pact' },
  קדוש: { strongs: 'H6918', hebrew: 'קָדוֹשׁ', transliteration: 'qadosh', definition: 'Holy, set apart, sacred' },
  רוח: { strongs: 'H7307', hebrew: 'רוּחַ', transliteration: 'ruach', definition: 'Spirit, wind, breath' },
  נפש: { strongs: 'H5315', hebrew: 'נֶפֶשׁ', transliteration: 'nephesh', definition: 'Soul, living being, self, life' },
  אדם: { strongs: 'H120', hebrew: 'אָדָם', transliteration: 'adam', definition: 'Man, mankind, humanity (also the proper name Adam)' },
  צדק: { strongs: 'H6664', hebrew: 'צֶדֶק', transliteration: 'tzedek', definition: 'Righteousness, rightness, justice' },
  משפט: { strongs: 'H4941', hebrew: 'מִשְׁפָּט', transliteration: 'mishpat', definition: 'Judgment, justice, ordinance, custom' },
  אמת: { strongs: 'H571', hebrew: 'אֱמֶת', transliteration: 'emet', definition: 'Truth, faithfulness, reliability' },
  אהבה: { strongs: 'H160', hebrew: 'אַהֲבָה', transliteration: 'ahavah', definition: 'Love' },
  משיח: { strongs: 'H4899', hebrew: 'מָשִׁיחַ', transliteration: 'mashiach', definition: 'Anointed one, messiah' },
  ישועה: { strongs: 'H3444', hebrew: 'יְשׁוּעָה', transliteration: 'yeshuah', definition: 'Salvation, deliverance, victory' },
  כבוד: { strongs: 'H3519', hebrew: 'כָּבוֹד', transliteration: 'kavod', definition: 'Glory, honor, splendor' },
  מלאך: { strongs: 'H4397', hebrew: 'מַלְאָךְ', transliteration: 'malach', definition: 'Messenger, angel' },
  נביא: { strongs: 'H5030', hebrew: 'נָבִיא', transliteration: 'navi', definition: 'Prophet, spokesman' },
  עבד: { strongs: 'H5650', hebrew: 'עֶבֶד', transliteration: 'eved', definition: 'Servant, slave' },
  מלך: { strongs: 'H4428', hebrew: 'מֶלֶךְ', transliteration: 'melech', definition: 'King' },
  כהן: { strongs: 'H3548', hebrew: 'כֹּהֵן', transliteration: 'kohen', definition: 'Priest' },
  קרבן: { strongs: 'H7133', hebrew: 'קָרְבָּן', transliteration: 'korban', definition: 'Offering, sacrifice, oblation' },
  שבת: { strongs: 'H7676', hebrew: 'שַׁבָּת', transliteration: 'shabbat', definition: 'Sabbath, day of rest' },
  חג: { strongs: 'H2282', hebrew: 'חַג', transliteration: 'chag', definition: 'Festival, feast' },
  זרע: { strongs: 'H2233', hebrew: 'זֶרַע', transliteration: 'zera', definition: 'Seed, offspring, descendants' },
  בן: { strongs: 'H1121', hebrew: 'בֵּן', transliteration: 'ben', definition: 'Son' },
  אב: { strongs: 'H1', hebrew: 'אָב', transliteration: 'av', definition: 'Father' },
  אם: { strongs: 'H517', hebrew: 'אֵם', transliteration: 'em', definition: 'Mother' },
  ארץ: { strongs: 'H776', hebrew: 'אֶרֶץ', transliteration: 'eretz', definition: 'Land, earth, ground, territory' },
  שמים: { strongs: 'H8064', hebrew: 'שָׁמַיִם', transliteration: 'shamayim', definition: 'Heaven, sky, heavens' },
  מים: { strongs: 'H4325', hebrew: 'מַיִם', transliteration: 'mayim', definition: 'Water' },
  אש: { strongs: 'H784', hebrew: 'אֵשׁ', transliteration: 'esh', definition: 'Fire' },
  דם: { strongs: 'H1818', hebrew: 'דָּם', transliteration: 'dam', definition: 'Blood' },
  לב: { strongs: 'H3820', hebrew: 'לֵב', transliteration: 'lev', definition: 'Heart, mind, inner self' },
  חיים: { strongs: 'H2416', hebrew: 'חַיִּים', transliteration: 'chayim', definition: 'Life, living' },
  מות: { strongs: 'H4194', hebrew: 'מָוֶת', transliteration: 'mavet', definition: 'Death' },
  חכמה: { strongs: 'H2451', hebrew: 'חָכְמָה', transliteration: 'chochmah', definition: 'Wisdom, skill' },
  דבר: { strongs: 'H1697', hebrew: 'דָּבָר', transliteration: 'davar', definition: 'Word, thing, matter, speech' },
  שם: { strongs: 'H8034', hebrew: 'שֵׁם', transliteration: 'shem', definition: 'Name, reputation' },
  קול: { strongs: 'H6963', hebrew: 'קוֹל', transliteration: 'qol', definition: 'Voice, sound, noise' },
  עולם: { strongs: 'H5769', hebrew: 'עוֹלָם', transliteration: 'olam', definition: 'Forever, eternity, ancient time, age' },
  גוי: { strongs: 'H1471', hebrew: 'גּוֹי', transliteration: 'goy', definition: 'Nation, people' },
  עם: { strongs: 'H5971', hebrew: 'עַם', transliteration: 'am', definition: 'People, nation, kinsmen' },
  ישראל: { strongs: 'H3478', hebrew: 'יִשְׂרָאֵל', transliteration: 'Yisrael', definition: 'Israel (the nation and the patriarch Jacob’s renamed identity, "one who strives with God")' },
  ירושלים: { strongs: 'H3389', hebrew: 'יְרוּשָׁלַיִם', transliteration: 'Yerushalayim', definition: 'Jerusalem' },
  ציון: { strongs: 'H6726', hebrew: 'צִיּוֹן', transliteration: 'Tzion', definition: 'Zion — the hill of Jerusalem, and by extension Jerusalem or Israel itself' },
}
