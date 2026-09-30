import { siteContent } from '@/content/siteContent';
// Velorah from Hirael <https://hirael.com/templates/velorah>
// MIT · Mohammad Shehadeh · https://github.com/MohammadShehadeh/hirael

import { PillButton } from './primitives';

const STATEMENT_VIDEO = 'https://hirael.com/media/templates/velorah/statement.mp4';

const STATS = siteContent.steps;

export const Statement = () => {
  return (
    <section id="how-it-works" className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6">
      <video
        src={STATEMENT_VIDEO}
        autoPlay
        loop
        muted
        playsInline
        aria-hidden
        className="absolute inset-0 z-0 h-full w-full object-cover"
      />

      <div className="relative z-10 flex max-w-5xl flex-col items-center text-center">
        <p className="mb-6 text-xs tracking-[0.3em] text-muted-foreground uppercase sm:text-sm">
          Your Safety Map
        </p>

        <h2 className="[font-family:var(--font-velorah-serif)] text-4xl leading-[1.05] tracking-[-1.5px] text-foreground sm:text-6xl md:text-7xl">
          A clearer picture.
          <br />
          A place to begin.
        </h2>

        <p className="mt-8 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          A short Safety Scan brings your everyday support into focus. See what is already solid, what is worth strengthening, and one small step you can take next.
        </p>

        <div className="mt-14 grid grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-12">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div className="[font-family:var(--font-velorah-serif)] text-3xl font-light text-foreground sm:text-4xl">
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground sm:text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        <PillButton onClick={() => document.getElementById("next-step")?.scrollIntoView()} className="mt-12 px-10 py-4">Find your first step</PillButton>
      </div>
    </section>
  );
};
