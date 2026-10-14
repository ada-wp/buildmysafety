import { siteContent } from '@/content/siteContent';
// Velorah from Hirael <https://hirael.com/templates/velorah>
// MIT · Mohammad Shehadeh · https://github.com/MohammadShehadeh/hirael

import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

interface WordmarkProps {
  className?: string;
}

export const Wordmark = ({ className }: WordmarkProps) => {
  return (
    <span className={cn('[font-family:var(--font-velorah-serif)] tracking-tight text-foreground', className)}>
      {siteContent.brand}
    </span>
  );
};

type PillButtonTone = 'glass' | 'outline';

interface PillButtonProps extends ComponentProps<'button'> {
  /** `glass` is the frosted primary pill, `outline` the quiet bordered one. */
  tone?: PillButtonTone;
}

export const PillButton = ({ tone = 'glass', className, ...props }: PillButtonProps) => {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full text-sm font-normal whitespace-nowrap outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50',
        tone === 'glass'
          ? 'liquid-glass text-foreground transition-transform hover:scale-[1.03]'
          : 'border border-border text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground',
        className,
      )}
      {...props}
    />
  );
};

export const PillLink = ({ className, ...props }: ComponentProps<'a'>) => (
  <a
    className={cn('liquid-glass inline-flex shrink-0 items-center justify-center rounded-full text-sm font-normal whitespace-nowrap text-foreground transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white', className)}
    {...props}
  />
);
