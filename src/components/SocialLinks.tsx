import {
  AmazonIcon,
  ApplePodcastsIcon,
  FacebookIcon,
  InstagramIcon,
  SpotifyIcon,
  TikTokIcon,
  XIcon,
  YouTubeIcon,
} from './icons'

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
  { label: 'TikTok', href: 'https://www.tiktok.com/@destined4torah', Icon: TikTokIcon },
]

export function SocialLinks() {
  return (
          <ul className="social-links header-social-links" aria-label="Connect with Destined4Torah">
            {SOCIAL_LINKS.map(({ label, href, Icon }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
                  <Icon className="social-icon" />
                </a>
              </li>
            ))}
          </ul>
  )
}
