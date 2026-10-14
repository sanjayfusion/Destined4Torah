import photo from '../assets/sanjay-compass.png'
import arrow from '../assets/destinys-arrow.jpg'
import countdown from '../assets/final-countdown.jpg'
import voice from '../assets/earth-wind-fire.jpg'
import mirror from '../assets/man-in-the-mirror.jpg'
import royal from '../assets/becoming-a-royal.jpg'
import {
  AmazonIcon,
  ApplePodcastsIcon,
  FacebookIcon,
  InstagramIcon,
  SpotifyIcon,
  XIcon,
  YouTubeIcon,
} from './icons'

const BOOKS = [
  { title: "Destiny’s Arrow", subtitle: 'How to Recognize the Signs of Greatness', cover: arrow, asin: 'B0HDKK31LP', description: 'Have you ever been rejected? You may be closer to your calling than you think. Journey through the lives of Saul and David to explore how humility, jealousy, and the choices we make in seasons of testing shape our destiny. Drawing on Scripture and rabbinic commentary, this book invites you to recognize the greatness God has placed within you.' },
  { title: 'The Final Countdown', subtitle: 'Your Journey in the Symphony of Creation', cover: countdown, asin: 'B0924P6R9R', description: 'Discover your place in God’s symphony of creation. Through the lives of the patriarchs and matriarchs in Genesis, explore divine providence and the blueprint for your destiny.' },
  { title: 'Earth, Wind, Fire, and a Still Small Voice', subtitle: 'How to Hear the Voice of God', cover: voice, asin: '1983113395', description: 'Learn from biblical figures who followed the Lord through listening to His voice. This book invites you to grow in trust, discern His guidance, and walk with Him in the everyday steps of your life.' },
  { title: 'Man in the Mirror', subtitle: 'Creating a More Authentic Version of You', cover: mirror, asin: 'B093B22PZD', description: 'Discover the treasures God has placed in your soul. Explore how He can use life’s painful experiences to shape your character, reveal purpose, and help you become a more authentic version of yourself.' },
  { title: 'Becoming a Royal', subtitle: 'Assuming Your Role as a Royal in the Tapestry of Creation', cover: royal, asin: 'B09YV9PG8J', description: 'Explore the principles of royalty woven throughout God’s Word. Discover what it means to live as a child of the King of Kings and embrace your place in the tapestry of creation.' },
]

const SOCIAL_LINKS = [
  { label: 'Facebook', href: 'https://www.facebook.com/destined4torah', Icon: FacebookIcon },
  { label: 'Instagram', href: 'https://www.instagram.com/destined4torah', Icon: InstagramIcon },
  {
    label: 'Spotify',
    href: 'https://open.spotify.com/show/7xKxwlBgYAhWaH7qiQSE96?si=OsAB83d1RwCGDPa-NThfRQ&nd=1&dlsi=516b4bf6332543fc',
    Icon: SpotifyIcon,
  },
  { label: 'YouTube', href: 'https://www.youtube.com/@destined4torah', Icon: YouTubeIcon },
  { label: 'Amazon', href: 'https://www.amazon.com/author/sanjayprajapati', Icon: AmazonIcon },
  {
    label: 'Apple Podcasts',
    href: 'https://podcasts.apple.com/us/podcast/destined4torah/id1441022266',
    Icon: ApplePodcastsIcon,
  },
  { label: 'X', href: 'https://x.com/destined4torah', Icon: XIcon },
]

export function About() {
  return (
    <article className="reader about">
      <h2>About</h2>
      <div className="about-body">
        <img src={photo} className="about-photo" width={1254} height={1254} alt="Dr. Sanjay Prajapati" />
        <div className="about-text">
          <h3 className="about-name">Dr. Sanjay Prajapati</h3>
          <p className="about-title">Author, Teacher &amp; Public Speaker</p>
          <ul className="social-links">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
                  <Icon className="social-icon" />
                </a>
              </li>
            ))}
          </ul>
          <div className="about-intro">
        <p>
          Dr. Sanjay Prajapati is an author, teacher, and public speaker revealing Jesus in
          His Jewish context through Torah study.
        </p>
        <p>
          He began studying Torah under Dr. Michelle Corral, founder of Breath of the Spirit
          Ministries, in 1991, and teaches a weekly Torah service, Destined4Torah, exploring
          how the Torah — the five books of Moses — is the foundation of all Scripture,
          Hebrew and New Testament alike. He is a frequent guest on Dr. Corral's program The
          Prophetic Word (Word Network).
        </p>
          </div>
        </div>
      </div>

      <div className="about-bio">
        <p>
          His mission is to reveal the depths of the Bible through Hebrew roots and Messianic
          Jewish scholarship — showing that Scripture isn't a memoir of the past, but a living
          blueprint for today. His unique style inspires, empowers, and entertains audiences
          while giving them the tools and strategies they need to discover and implement the
          blueprint to their destinies.
        </p>
        <blockquote className="about-motto">
          "The blueprint to your destiny is found in the lives of Biblical figures."
        </blockquote>
      </div>

      <section className="about-library" aria-labelledby="books-heading">
        <p className="about-eyebrow">Continue the journey</p>
        <h3 id="books-heading">Books by Sanjay Prajapati</h3>
        <p className="about-library-intro">Explore Scripture, discover your purpose, and grow in your walk with God.</p>
        <div className="about-book-grid">
          {BOOKS.map((book, index) => (
            <article className={index === 0 ? 'about-book about-book-featured' : 'about-book'} key={book.asin}>
              <img className="about-book-cover" src={book.cover} alt={`${book.title} book cover`} loading="lazy" />
              <div className="about-book-copy">
                {index === 0 && <p className="about-eyebrow">Featured book</p>}
                <h4>{book.title}</h4>
                <p className="about-book-subtitle">{book.subtitle}</p>
                <p>{book.description}</p>
                <a className="about-book-button" href={`https://www.amazon.com/dp/${book.asin}`} target="_blank" rel="noopener noreferrer" aria-label={`View ${book.title} on Amazon (opens in a new tab)`}>View on Amazon <span aria-hidden="true">↗</span></a>
                <p className="about-book-formats">Choose your format on Amazon.</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="about-bio">
        <section className="about-speaking" aria-labelledby="speaking-heading">
          <h3 id="speaking-heading">Speaking engagements</h3>
          <p>Dr. Sanjay Prajapati is available for speaking engagements at churches, conferences, and Bible-study gatherings. Invite him to share the depths of Scripture in its Jewish context and help your audience discover the blueprint to their destiny.</p>
          <p>For speaking inquiries, email <a href="mailto:sanjay@destined4torah.com?subject=Speaking%20engagement%20inquiry">sanjay@destined4torah.com</a>.</p>
        </section>
      </div>
    </article>
  )
}
