import { siteContent } from '@/content/siteContent';
// Velorah from Hirael <https://hirael.com/templates/velorah>
// MIT · Mohammad Shehadeh · https://github.com/MohammadShehadeh/hirael

'use client';

import * as React from 'react';

import { ToggleGroup, ToggleGroupItem } from '@/registry/hirael/bases/radix/ui/toggle-group';

import { PillButton } from './primitives';
import { QuietScene } from './quiet-scene';

const FEATURE_TABS = siteContent.areas;

interface FeatureProps {
  videoSrc?: string;
  posterSrc?: string;
}

export const Feature = ({ videoSrc, posterSrc }: FeatureProps) => {
  const [activeId, setActiveId] = React.useState(FEATURE_TABS[0].id);
  const [videoFailed, setVideoFailed] = React.useState(false);

  const active = FEATURE_TABS.find((tab) => tab.id === activeId) ?? FEATURE_TABS[0];

  return (
    <section id="safety-areas" className="mx-auto max-w-7xl px-6 py-0 md:px-12">
      <div className="grid min-h-[520px] gap-4 overflow-hidden rounded-2xl md:grid-cols-2">
        <div className="flex flex-col justify-between rounded-2xl bg-card p-10 md:p-14">
          <div>
            <span className="mb-8 inline-block h-8 w-8 rounded-full border border-border" />
            <h2 className="mb-6 [font-family:var(--font-velorah-serif)] text-3xl tracking-[-1px] text-foreground sm:text-5xl">
              {active.heading}
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base">{active.description}</p>
          </div>

          <div>
            <ToggleGroup
              aria-label="Safety areas"
              type="single"
              variant="outline"
              size="sm"
              spacing={2}
              value={active.id}
              onValueChange={(id) => {
                if (id) setActiveId(id);
              }}
              className="mb-8 flex-wrap"
            >
              {FEATURE_TABS.map((tab) => (
                <ToggleGroupItem key={tab.id} value={tab.id}>
                  {tab.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            <div role="img" aria-label={`Area ${FEATURE_TABS.findIndex(tab => tab.id === active.id) + 1} of 4`} className="mb-6 h-0.5 w-full rounded-full bg-border">
              <div
                className="h-full rounded-full bg-foreground transition-[width] duration-500 ease-out"
                style={{ width: `${active.progress}%` }}
              />
            </div>

            <PillButton onClick={() => document.getElementById("how-it-works")?.scrollIntoView()} className="px-8 py-3">See how it comes together</PillButton>
          </div>
        </div>

        <div className="relative min-h-[400px] overflow-hidden rounded-2xl">
          {!videoSrc ? (
            <QuietScene />
          ) : videoFailed ? (
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-br from-muted via-card to-background bg-cover bg-center"
              style={posterSrc ? { backgroundImage: `url(${posterSrc})` } : undefined}
            />
          ) : (
            <video
              className="absolute inset-0 h-full w-full object-cover"
              src={videoSrc}
              poster={posterSrc}
              autoPlay
              loop
              muted
              playsInline
              aria-hidden="true"
              tabIndex={-1}
              onError={() => setVideoFailed(true)}
            />
          )}
        </div>
      </div>
    </section>
  );
};
