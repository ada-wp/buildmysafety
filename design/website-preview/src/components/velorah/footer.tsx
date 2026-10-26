import { siteContent } from '@/content/siteContent';
// Velorah from Hirael <https://hirael.com/templates/velorah>
// MIT · Mohammad Shehadeh · https://github.com/MohammadShehadeh/hirael

import { PillLink, Wordmark } from './primitives';

const FOOTER_LINKS = siteContent.footerLinks;

export const Footer = () => {
  return (
    <footer className="mx-auto max-w-7xl border-t border-border bg-[hsl(0,0%,0%)] px-6 py-16 md:px-12">
      <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-3">
        <h2 className="[font-family:var(--font-velorah-serif)] text-2xl leading-tight text-foreground sm:text-3xl">
          Build a life
          <br />
          you can rely on.
        </h2>

        <nav aria-label="Footer navigation" className="flex flex-col items-start gap-3">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-muted-foreground capitalize transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div>
          <p className="mb-4 text-sm text-muted-foreground">
            A little preparation.
            <br />
            More room to live.
          </p>
          <PillLink href="/#safety-areas" className="px-6 py-2.5">Explore the four areas</PillLink>
        </div>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground md:flex-row">
        <Wordmark className="text-xl" />
        <div className="flex items-center gap-6">
          <a href="/about" className="transition-colors hover:text-foreground">
            About My Safety
          </a>
          <a href="/#safety-areas" className="transition-colors hover:text-foreground">
            Explore the four areas
          </a>
        </div>
      </div>
    </footer>
  );
};
