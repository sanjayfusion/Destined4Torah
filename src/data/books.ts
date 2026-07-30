export interface TorahBook {
  slug: string
  english: string
  hebrew: string
  chapters: number
}

export const TORAH_BOOKS: TorahBook[] = [
  { slug: 'Genesis', english: 'Genesis', hebrew: 'בְּרֵאשִׁית', chapters: 50 },
  { slug: 'Exodus', english: 'Exodus', hebrew: 'שְׁמוֹת', chapters: 40 },
  { slug: 'Leviticus', english: 'Leviticus', hebrew: 'וַיִּקְרָא', chapters: 27 },
  { slug: 'Numbers', english: 'Numbers', hebrew: 'בְּמִדְבַּר', chapters: 36 },
  { slug: 'Deuteronomy', english: 'Deuteronomy', hebrew: 'דְּבָרִים', chapters: 34 },
]
