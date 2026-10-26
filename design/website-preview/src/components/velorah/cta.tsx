// Velorah from Hirael <https://hirael.com/templates/velorah>
// MIT · Mohammad Shehadeh · https://github.com/MohammadShehadeh/hirael

import { PillButton } from './primitives';

const CTA_VIDEO = 'https://hirael.com/media/templates/velorah/cta.mp4';

export const Cta = () => {
  return (
    <section id="next-step" className="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden px-6 text-center">
      <video
        className="absolute inset-0 z-0 h-full w-full object-cover"
        src={CTA_VIDEO}
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
        tabIndex={-1}
      />

      <div className="relative z-10 flex max-w-4xl flex-col items-center">
        <p className="mb-4 text-xs tracking-[0.3em] text-muted-foreground uppercase sm:text-sm">One small step at a time</p>

        <h2 className="[font-family:var(--font-velorah-serif)] text-5xl leading-[0.95] tracking-[-2px] text-foreground sm:text-7xl md:text-8xl">
          Build your first block
        </h2>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Start with one part of your life you want to strengthen. A person to call. Information you can find. A simple plan for the days that do not go to plan.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <PillButton onClick={() => document.getElementById("safety-areas")?.scrollIntoView()} className="px-10 py-4">Explore your safety areas</PillButton>
          <PillButton onClick={() => document.getElementById("how-it-works")?.scrollIntoView()} tone="outline" className="px-10 py-4">
            See how it works
          </PillButton>
        </div>
      </div>
    </section>
  );
};
