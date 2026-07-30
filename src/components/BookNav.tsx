import { TORAH_BOOKS } from '../data/books'

interface BookNavProps {
  selectedBook: string
  selectedChapter: number
  onSelect: (bookSlug: string, chapter: number) => void
}

export function BookNav({ selectedBook, selectedChapter, onSelect }: BookNavProps) {
  const activeBook = TORAH_BOOKS.find((book) => book.slug === selectedBook) ?? TORAH_BOOKS[0]

  return (
    <nav className="book-nav">
      <ul className="book-list">
        {TORAH_BOOKS.map((book) => (
          <li key={book.slug}>
            <button
              type="button"
              className={book.slug === selectedBook ? 'book-button active' : 'book-button'}
              onClick={() => onSelect(book.slug, 1)}
            >
              <span className="book-hebrew">{book.hebrew}</span>
              <span className="book-english">{book.english}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="chapter-grid">
        {Array.from({ length: activeBook.chapters }, (_, i) => i + 1).map((chapter) => (
          <button
            key={chapter}
            type="button"
            className={chapter === selectedChapter ? 'chapter-button active' : 'chapter-button'}
            onClick={() => onSelect(activeBook.slug, chapter)}
          >
            {chapter}
          </button>
        ))}
      </div>
    </nav>
  )
}
