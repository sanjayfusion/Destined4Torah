export function About() {
  return (
    <article className="reader about">
      <h2>About</h2>
      <div className="about-body">
        <div className="about-photo-placeholder" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="about-text">
          <p className="about-placeholder-note">
            Photo and bio coming soon.
          </p>
        </div>
      </div>
    </article>
  )
}
