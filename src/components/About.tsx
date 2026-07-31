import photo from '../assets/sanjay.jpg'

const BOOKS = [
  'The Final Countdown: Your Journey in the Symphony of Creation',
  'Earth, Wind, Fire, & A Still Small Voice: How to Hear the Voice of God',
  'Man in the Mirror: Creating a More Authentic Version of You',
  'Becoming a Royal: Assuming Your Role as a Royal in the Tapestry of Creation',
]

export function About() {
  return (
    <article className="reader about">
      <h2>About</h2>
      <div className="about-body">
        <img src={photo} className="about-photo" alt="Dr. Sanjay Prajapati" />
        <div className="about-text">
          <h3 className="about-name">Dr. Sanjay Prajapati</h3>
          <p className="about-title">Author, Teacher &amp; Public Speaker</p>
        </div>
      </div>

      <div className="about-bio">
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
        <p>
          Sanjay is the author of four books:
        </p>
        <ul className="about-books">
          {BOOKS.map((book) => (
            <li key={book}>{book}</li>
          ))}
        </ul>
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
        <p className="about-location">Sanjay and his wife, Bhavna, live in Orange County, CA.</p>
      </div>
    </article>
  )
}
