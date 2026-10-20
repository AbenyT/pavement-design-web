// Site-wide details shown in the header, footer, Help button and home page. Edit them here only.

export const SITE = {
  name: 'Pavement Design',
  tagline: 'AASHTO 1993 · layer-by-layer structural number method',
  author: 'Abenezer Tilahun',
  authorRole: 'Senior Pavement & Materials Engineer',
  email: 'abenytilahunccecc@gmail.com',
  /** Full profile URL, e.g. "https://www.linkedin.com/in/your-name". Links are hidden while it is empty. */
  linkedin: '',
  /** Fixed rather than computed: Next.js 16 Cache Components does not allow `new Date()` while prerendering. */
  copyrightYear: 2026,
} as const;

export const mailto = (subject?: string) =>
  `mailto:${SITE.email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
