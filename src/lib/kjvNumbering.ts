import { ALL_BOOKS } from '../data/books'

// Tanakh and KJV chapter totals differ in these two books.
export function kjvChapterCount(book: string): number {
  return book === 'Joel' ? 3 : book === 'Malachi' ? 4 : ALL_BOOKS.find(b => b.slug === book)?.chapters ?? 1
}
