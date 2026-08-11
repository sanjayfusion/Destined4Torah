import { ALL_BOOKS, NEW_TESTAMENT_BOOKS, OLD_TESTAMENT_BOOKS, type BibleBook } from '../data/books'

interface BookNavProps {
  selectedBook: string
  selectedChapter: number
  onSelect: (bookSlug: string, chapter: number) => void
}

const TANAKH_DIVISIONS: { key: BibleBook['division']; title: string; hebrew: string }[] = [
  { key: 'torah', title: 'Torah', hebrew: 'תּוֹרָה' },
  { key: 'neviim', title: "Nevi'im", hebrew: 'נְבִיאִים' },
  { key: 'ketuvim', title: 'Ketuvim', hebrew: 'כְּתוּבִים' },
]

function BookList({
  books,
  selectedBook,
  onSelect,
}: {
  books: BibleBook[]
  selectedBook: string
  onSelect: (bookSlug: string, chapter: number) => void
}) {
  return (
    <ul className="book-list">
      {books.map((book) => (
        <li key={book.slug}>
          <button
            type="button"
            className={book.slug === selectedBook ? 'book-button active' : 'book-button'}
            onClick={() => onSelect(book.slug, 1)}
          >
            {book.hebrew && <span className="book-hebrew">{book.hebrew}</span>}
            <span className="book-english">{book.english}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function BookGroup({
  title,
  books,
  selectedBook,
  onSelect,
}: {
  title: string
  books: BibleBook[]
  selectedBook: string
  onSelect: (bookSlug: string, chapter: number) => void
}) {
  return (
    <div className="book-group">
      <h3 className="book-group-title">{title}</h3>
      <BookList books={books} selectedBook={selectedBook} onSelect={onSelect} />
    </div>
  )
}

export function BookNav({ selectedBook, selectedChapter, onSelect }: BookNavProps) {
  const activeBook = ALL_BOOKS.find((book) => book.slug === selectedBook) ?? ALL_BOOKS[0]

  return (
    <nav className="book-nav">
      <div className="book-group">
        <h3 className="book-group-title">Hebrew Scriptures</h3>
        <div className="tanakh-scroll">
          {TANAKH_DIVISIONS.map((division) => (
            <div key={division.key} className="tanakh-division">
              <h4 className="tanakh-division-title">
                {division.title} <span className="tanakh-division-hebrew">{division.hebrew}</span>
              </h4>
              <BookList
                books={OLD_TESTAMENT_BOOKS.filter((book) => book.division === division.key)}
                selectedBook={selectedBook}
                onSelect={onSelect}
              />
            </div>
          ))}
        </div>
      </div>
      <BookGroup
        title="New Testament"
        books={NEW_TESTAMENT_BOOKS}
        selectedBook={selectedBook}
        onSelect={onSelect}
      />

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
