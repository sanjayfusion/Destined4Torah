import { NEW_TESTAMENT_BOOKS } from '../data/books'
import { passageUrl } from '../lib/passageLinks'

// Grouped into three sections to mirror the Tanakh page's Torah / Nevi'im / Ketuvim.
const sections = [
  { key: 'gospels', name: 'Gospels', hebrew: 'בשורות', meaning: 'Besorot · Good News', description: 'The life and teaching of Yeshua among His own people, and the first Jewish believers carrying that good news from Jerusalem to the nations.', groups: [{ title: 'The Four Gospels', books: ['Matthew', 'Mark', 'Luke', 'John'] }, { title: 'Acts of the Apostles', books: ['Acts'] }] },
  { key: 'letters', name: 'Letters', hebrew: 'אגרות', meaning: 'Igrot · Letters', description: 'Letters to congregations of Jews and Gentiles, written by followers of Yeshua steeped in the Torah, the Temple, and the Prophets.', groups: [{ title: 'Letters of Paul', books: ['Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy', '2 Timothy', 'Titus', 'Philemon'] }, { title: 'Hebrews and the General Letters', books: ['Hebrews', 'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John', 'Jude'] }] },
  { key: 'revelation', name: 'Revelation', hebrew: 'חזון', meaning: 'Chazon · Vision', description: 'John’s vision of the end of days, rich with the Temple, the feasts of Israel, and the words of the prophets.', groups: [{ title: 'The Revelation to John', books: ['Revelation'] }] },
] as const

export function NewTestamentPage({ onSelect }: { onSelect: (book: string) => void }) {
  return <article className="tanakh-page">
    <header className="tanakh-intro">
      <p className="tanakh-eyebrow">EXPLORE THE APOSTOLIC SCRIPTURES</p>
      <h1>New Testament <span lang="he" dir="rtl">ברית חדשה</span></h1>
      <p>Many Messianic readers call these books the <strong>Brit Chadashah</strong>, the “Renewed Covenant” promised in Jeremiah 31:31. Written almost entirely by Jews, they tell of Yeshua, the Jewish Messiah, and the first communities who followed Him.</p>
      <p>Choose a book below to begin reading in English, with the Greek text alongside.</p>
    </header>
    <div className="tanakh-cards">
      {sections.map((section) => <section className="tanakh-card" key={section.key} aria-labelledby={`overview-${section.key}`}>
        <h2 id={`overview-${section.key}`}>{section.name} <span lang="he" dir="rtl">{section.hebrew}</span></h2>
        <p className="tanakh-meaning">{section.meaning}</p>
        <p>{section.description}</p>
        {section.groups.map((group) => <div key={group.title} className="tanakh-book-group">
          <h3>{group.title}</h3>
          <ul>{NEW_TESTAMENT_BOOKS.filter((book) => (group.books as readonly string[]).includes(book.slug)).map((book) => <li key={book.slug}>
            <a href={passageUrl({ view: 'book', book: book.slug, chapter: 1 }, window.location.href)} onClick={(event) => {
              if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onSelect(book.slug) }
            }}>
              <span><strong>{book.english}</strong><small>{book.chapters} {book.chapters === 1 ? 'chapter' : 'chapters'}</small></span>
            </a>
          </li>)}</ul>
        </div>)}
      </section>)}
    </div>
  </article>
}
