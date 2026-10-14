import { siteContent } from '@/content/siteContent';
// Velorah from Hirael <https://hirael.com/templates/velorah>
// MIT · Mohammad Shehadeh · https://github.com/MohammadShehadeh/hirael

import { PillLink, Wordmark } from './primitives';

const NAV_LINKS = siteContent.nav;

export const Navbar = ({ currentPage = 'home' }: { currentPage?: 'home' | 'about' }) => {
  return (
    <nav aria-label="Main navigation" className="relative z-20 mx-auto flex max-w-7xl items-center justify-between gap-4 px-8 py-6">
      <a href="/" aria-label="My Safety home" className="shrink-0"><Wordmark className="text-3xl" /></a>

      <div className="hidden items-center gap-10 text-sm text-foreground lg:flex">
        {NAV_LINKS.map((link) => (
          <a key={link.label} href={link.href} aria-current={currentPage === 'about' && link.href === '/about' ? 'page' : undefined} className="transition-colors hover:text-foreground/80">
            {link.label}
          </a>
        ))}
      </div>

      <PillLink href="/#next-step" className="hidden px-6 py-2.5 sm:inline-flex">Begin with one step</PillLink>
      <details className="site-menu relative lg:hidden">
        <summary className="cursor-pointer rounded-full border border-border px-5 py-2.5 text-sm">Menu</summary>
        <div className="absolute top-full right-0 mt-3 flex min-w-56 flex-col rounded-2xl border border-border bg-card p-3 shadow-xl">
          {NAV_LINKS.map(link => (
            <a key={link.label} href={link.href} aria-current={currentPage === 'about' && link.href === '/about' ? 'page' : undefined} className="rounded-lg px-4 py-3 text-sm hover:bg-muted" onClick={event => event.currentTarget.closest('details')?.removeAttribute('open')}>
              {link.label}
            </a>
          ))}
          <a href="/#next-step" className="rounded-lg px-4 py-3 text-sm hover:bg-muted">Begin with one step</a>
        </div>
      </details>
    </nav>
  );
};
