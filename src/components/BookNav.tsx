import { ALL_BOOKS, NEW_TESTAMENT_BOOKS, OLD_TESTAMENT_BOOKS, type BibleBook } from '../data/books'

interface BookNavProps {
  selectedBook: string
  selectedChapter: number
  onSelect: (bookSlug: string, chapter: number) => void
}

const DIVISIONS: { key: string; title: string; hebrew?: string; books: BibleBook[] }[] = [
  { key: 'torah', title: 'Torah', hebrew: 'תּוֹרָה', books: OLD_TESTAMENT_BOOKS.filter((book) => book.division === 'torah') },
  { key: 'neviim', title: "Nevi'im", hebrew: 'נְבִיאִים', books: OLD_TESTAMENT_BOOKS.filter((book) => book.division === 'neviim') },
  { key: 'ketuvim', title: 'Ketuvim', hebrew: 'כְּתוּבִים', books: OLD_TESTAMENT_BOOKS.filter((book) => book.division === 'ketuvim') },
  { key: 'new-testament', title: 'New Testament', books: NEW_TESTAMENT_BOOKS },
]

const SUBCATEGORY_LABELS: Record<string, { title: string; hebrew?: string }> = {
  'former-prophets': { title: 'Former Prophets', hebrew: 'נְבִיאִים רִאשׁוֹנִים' },
  'latter-prophets': { title: 'Latter Prophets', hebrew: 'נְבִיאִים אַחֲרוֹנִים' },
  'trei-asar': { title: 'Trei Asar (The Twelve)', hebrew: 'תְּרֵי עָשָׂר' },
  'sifrei-emet': { title: 'Sifrei Emet (Poetry)', hebrew: 'סִפְרֵי אֱמֶ״ת' },
  megillot: { title: 'Five Megillot', hebrew: 'חֲמֵשׁ מְגִלּוֹת' },
  'other-writings': { title: 'Other Writings' },
}

interface BookSubgroup {
  key: string | undefined
  books: BibleBook[]
}

/** Splits an already subcategory-sorted book list into contiguous runs. */
function groupBySubcategory(books: BibleBook[]): BookSubgroup[] {
  const groups: BookSubgroup[] = []
  for (const book of books) {
    const last = groups[groups.length - 1]
    if (last && last.key === book.subcategory) {
      last.books.push(book)
    } else {
      groups.push({ key: book.subcategory, books: [book] })
    }
  }
  return groups
}

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
            {book.hebrew && (
              <span className="book-hebrew-block">
                <span className="book-hebrew">{book.hebrew}</span>
                {book.transliteration && <span className="book-translit">{book.transliteration}</span>}
              </span>
            )}
            <span className="book-english">{book.english}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

export function BookNav({ selectedBook, selectedChapter, onSelect }: BookNavProps) {
  const activeBook = ALL_BOOKS.find((book) => book.slug === selectedBook) ?? ALL_BOOKS[0]

  return (
    <nav className="book-nav">
      <div className="book-group">
        <h3 className="book-group-title">Bible</h3>
        <div className="tanakh-scroll">
          {DIVISIONS.map((division) => (
            <div key={division.key} className="tanakh-division">
              <h4 className="tanakh-division-title">
                {division.title}
                {division.hebrew && <span className="tanakh-division-hebrew"> {division.hebrew}</span>}
              </h4>
              {groupBySubcategory(division.books).map((group, i) => {
                const label = group.key ? SUBCATEGORY_LABELS[group.key] : undefined
                return (
                  <div key={group.key ?? i} className={label ? 'tanakh-subcategory' : undefined}>
                    {label && (
                      <h5 className="tanakh-subcategory-title">
                        {label.title}
                        {label.hebrew && <span className="tanakh-division-hebrew"> {label.hebrew}</span>}
                      </h5>
                    )}
                    <BookList books={group.books} selectedBook={selectedBook} onSelect={onSelect} />
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

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
