import { OLD_TESTAMENT_BOOKS } from '../data/books'
import { passageUrl } from '../lib/passageLinks'

const sections = [
  { key: 'torah', name: 'Torah', hebrew: 'תורה', meaning: 'Teaching', description: 'The five books of Moses: the foundation of Torah study, from creation to Israel’s covenant journey.', groups: [{ key: undefined, title: 'The Five Books of Moses' }] },
  { key: 'neviim', name: 'Nevi’im', hebrew: 'נביאים', meaning: 'Prophets', description: 'Israel’s life in the land and the prophetic call to faithfulness, justice, repentance, and hope.', groups: [{ key: 'former-prophets', title: 'Former Prophets' }, { key: 'latter-prophets', title: 'Latter Prophets' }, { key: 'trei-asar', title: 'The Twelve · within the Latter Prophets' }] },
  { key: 'ketuvim', name: 'Ketuvim', hebrew: 'כתובים', meaning: 'Writings', description: 'Poetry, wisdom, prayer, and accounts of faith through suffering, exile, and restoration.', groups: [{ key: 'sifrei-emet', title: 'Poetry & Wisdom' }, { key: 'megillot', title: 'Five Megillot · The Five Scrolls' }, { key: 'other-writings', title: 'Other Writings' }] },
] as const

export function TanakhPage({ onSelect }: { onSelect: (book: string) => void }) {
  return <article className="tanakh-page">
    <header className="tanakh-intro">
      <p className="tanakh-eyebrow">EXPLORE THE HEBREW SCRIPTURES</p>
      <h1>Tanakh <span lang="he" dir="rtl">תנ״ך</span></h1>
      <p>The name <strong>Tanakh</strong> brings together the names of its three divisions: <strong>Torah</strong>, <strong>Nevi’im</strong>, and <strong>Ketuvim</strong>.</p>
      <p>Choose a book below to begin reading in Hebrew and English.</p>
    </header>
    <div className="tanakh-cards">
      {sections.map((section) => <section className="tanakh-card" key={section.key} aria-labelledby={`overview-${section.key}`}>
        <h2 id={`overview-${section.key}`}>{section.name} <span lang="he" dir="rtl">{section.hebrew}</span></h2>
        <p className="tanakh-meaning">{section.meaning}</p>
        <p>{section.description}</p>
        {section.groups.map((group) => <div key={group.title} className="tanakh-book-group">
          <h3>{group.title}</h3>
          <ul>{OLD_TESTAMENT_BOOKS.filter((book) => book.division === section.key && book.subcategory === group.key).map((book) => <li key={book.slug}>
            <a href={passageUrl({ view: 'book', book: book.slug, chapter: 1 }, window.location.href)} onClick={(event) => {
              if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); onSelect(book.slug) }
            }}>
              <span><strong>{book.english}</strong><small>{book.transliteration}</small></span>
              <span lang="he" dir="rtl">{book.hebrew}</span>
            </a>
          </li>)}</ul>
        </div>)}
      </section>)}
    </div>
    <p className="tanakh-source">Explore the organization of these books in the <a href="https://www.sefaria.org/texts/Tanakh" target="_blank" rel="noopener noreferrer">Sefaria Tanakh library</a>.</p>
  </article>
}
