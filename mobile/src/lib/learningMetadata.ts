const LEVEL_METADATA = {
  F1: {
    title: 'Foundations',
    description: 'Budgeting, banking, and everyday money habits.'
  },
  F2: {
    title: 'Everyday Decisions',
    description: 'Credit, paychecks, and smarter spending tradeoffs.'
  },
  F3: {
    title: 'Planning & Stability',
    description: 'Emergency funds, debt payoff, and financial protection.'
  },
  F4: {
    title: 'Long-Term Wealth',
    description: 'Investing, retirement, and compounding basics.'
  },
  F5: {
    title: 'Advanced Personal Finance',
    description: 'Taxes, mortgages, and higher-stakes money decisions.'
  },
  F6: {
    title: 'Analyst Mode',
    description: 'Markets, statements, and strategic financial reasoning.'
  }
} as const;

const FALLBACK_LEVEL = {
  title: 'Financial Growth',
  description: 'Build confidence one lesson at a time.'
};

export function getLevelMeta(level: string) {
  return LEVEL_METADATA[level as keyof typeof LEVEL_METADATA] ?? FALLBACK_LEVEL;
}

export function formatTrackLabel(track: string, premium: boolean): string {
  if (premium || track === 'advanced') {
    return 'Pro Path';
  }

  return 'Core Path';
}
