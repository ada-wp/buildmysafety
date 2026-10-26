// Adapted from Asme's About and Philosophy sections by Mohammad Shehadeh.
// MIT · https://github.com/MohammadShehadeh/hirael · source preserved in vendor/asme.
import { aboutContent, aboutStructuredData } from '@/content/aboutContent';
import { Footer } from '@/components/velorah/footer';
import { inter, instrumentSerif } from '@/components/velorah/fonts';
import { Navbar } from '@/components/velorah/navbar';
import { PillLink } from '@/components/velorah/primitives';
import { QuietScene } from '@/components/velorah/quiet-scene';
import { VelorahStyles } from '@/components/velorah/styles';
import { cn } from '@/lib/utils';

export default function AboutPage() {
  return (
    <div className={cn('velorah about-page min-h-svh bg-background text-foreground antialiased [font-family:var(--font-velorah-sans),ui-sans-serif,sans-serif]', inter.variable, instrumentSerif.variable)}>
      <VelorahStyles />
      <a href="#about-main" className="about-skip-link">Skip to content</a>
      <Navbar currentPage="about" />
      <main id="about-main">
        <section className="relative overflow-hidden px-6 pt-24 pb-16 md:pt-36 md:pb-24" aria-labelledby="about-title">
          <div className="relative mx-auto max-w-5xl text-center">
            <p className="mb-8 text-xs tracking-[0.2em] text-muted-foreground uppercase">About me · Creator of My Safety</p>
            <h1 id="about-title" className="animate-fade-rise text-6xl leading-[1.05] tracking-tight sm:text-7xl md:text-8xl">
              Hi, I’m <em className="about-serif text-foreground/80">Ada.</em>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-foreground/75 md:text-lg">{aboutContent.introduction}</p>
            <a href="#my-story" className="about-story-link mt-10 inline-flex items-center gap-3 text-sm text-muted-foreground">
              A little about why I’m here <span aria-hidden="true">↓</span>
            </a>
          </div>
        </section>

        <section id="my-story" className="scroll-mt-10 overflow-hidden px-6 py-16 md:py-24" aria-labelledby="story-title">
          <div className="mx-auto max-w-6xl">
            <h2 id="story-title" className="mb-12 max-w-5xl text-4xl leading-[1.08] tracking-tight sm:text-5xl md:mb-20 md:text-7xl lg:text-8xl">
              A life of your own.<br />
              <em className="about-serif text-foreground/65">Room to enjoy it.</em>
            </h2>
            <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-12">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
                <QuietScene />
              </div>
              <div>
                {aboutContent.story.map((block, index) => (
                  <div key={block.heading} className={index > 0 ? 'mt-9 border-t border-border pt-9' : ''}>
                    <h3 className="mb-4 text-xs tracking-[0.12em] text-muted-foreground uppercase">{block.heading}</h3>
                    <p className="text-base leading-relaxed text-foreground/75 md:text-lg">{block.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-20 md:py-28" aria-labelledby="beliefs-title">
          <div className="mx-auto max-w-6xl border-t border-border pt-16 md:pt-20">
            <p className="mb-6 text-xs tracking-[0.2em] text-muted-foreground uppercase">What I believe</p>
            <h2 id="beliefs-title" className="max-w-3xl text-4xl leading-tight tracking-tight sm:text-5xl md:text-6xl">
              A little preparation.<br /><em className="about-serif text-foreground/65">More room to live.</em>
            </h2>
            <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-3 md:gap-12">
              {aboutContent.principles.map((principle, index) => (
                <div key={principle.title}>
                  <span aria-hidden="true" className="text-xs text-muted-foreground">0{index + 1}</span>
                  <h3 className="mt-5 text-lg leading-snug">{principle.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">{principle.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pt-12 pb-28 text-center md:pt-20 md:pb-36" aria-labelledby="invitation-title">
          <div className="mx-auto max-w-2xl">
            <p className="mb-7 text-xs tracking-[0.2em] text-muted-foreground uppercase">A note from me to you</p>
            <h2 id="invitation-title" className="about-serif text-5xl leading-tight tracking-tight md:text-7xl">I’m glad you’re here.</h2>
            <p className="mt-7 text-base leading-relaxed text-foreground/75 md:text-lg">{aboutContent.closing}</p>
            <p className="about-serif mt-6 text-3xl italic text-foreground/70">Ada</p>
            <PillLink href="/#safety-areas" className="mt-10 px-9 py-4">Explore your safety areas <span aria-hidden="true" className="ml-3">↗</span></PillLink>
          </div>
        </section>
      </main>
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutStructuredData).replace(/</g, '\\u003c') }} />
    </div>
  );
}
