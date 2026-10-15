import {
  AmazonIcon,
  ApplePodcastsIcon,
  FacebookIcon,
  InstagramIcon,
  SpotifyIcon,
  XIcon,
  YouTubePlayIcon,
} from './icons'

const SOCIAL_LINKS = [
  { label: 'Facebook', href: 'https://www.facebook.com/destined4torah', Icon: FacebookIcon, brand: 'facebook' },
  { label: 'Instagram', href: 'https://www.instagram.com/destined4torah', Icon: InstagramIcon, brand: 'instagram' },
  {
    label: 'Spotify',
    href: 'https://open.spotify.com/show/7xKxwlBgYAhWaH7qiQSE96?si=OsAB83d1RwCGDPa-NThfRQ&nd=1&dlsi=516b4bf6332543fc',
    Icon: SpotifyIcon,
    brand: 'spotify',
  },
  { label: 'YouTube', href: 'https://www.youtube.com/@destined4torah', Icon: YouTubePlayIcon, brand: 'youtube' },
  { label: 'Amazon', href: 'https://www.amazon.com/author/sanjayprajapati', Icon: AmazonIcon, brand: 'amazon' },
  {
    label: 'Apple Podcasts',
    href: 'https://podcasts.apple.com/us/podcast/destined4torah/id1441022266',
    Icon: ApplePodcastsIcon,
    brand: 'podcasts',
  },
  { label: 'X', href: 'https://x.com/destined4torah', Icon: XIcon, brand: 'x' },
]

export function SocialLinks() {
  return (
          <ul className="social-links header-social-links" aria-label="Connect with Destined4Torah">
            {SOCIAL_LINKS.map(({ label, href, Icon, brand }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} data-brand={brand}>
                  <Icon className="social-icon" />
                </a>
              </li>
            ))}
          </ul>
  )
}
