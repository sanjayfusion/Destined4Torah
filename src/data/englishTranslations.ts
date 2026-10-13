export const ENGLISH_TRANSLATIONS = [
  { id: 'kjv', name: 'King James Version', shortName: 'KJV' },
  { id: 'asv', name: 'American Standard Version (1901)', shortName: 'ASV' },
  { id: 'web', name: 'World English Bible', shortName: 'WEB' },
  { id: 'bbe', name: 'Bible in Basic English', shortName: 'BBE' },
  { id: 'darby', name: 'Darby Bible', shortName: 'Darby' },
  { id: 'dra', name: 'Douay-Rheims 1899', shortName: 'Douay-Rheims' },
  { id: 'ylt', name: 'Young’s Literal Translation (New Testament)', shortName: 'YLT', newTestamentOnly: true },
] as const
export type EnglishTranslationId = typeof ENGLISH_TRANSLATIONS[number]['id']
export function translationAvailable(id: EnglishTranslationId, testament: 'old' | 'new') {
  return id !== 'ylt' || testament === 'new'
}
