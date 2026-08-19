import type { Request } from 'express';
import { lessons } from './data.js';

// Derived from the live curriculum so the landing page can never drift from
// what the app actually ships.
const curriculumStats = {
  lessons: lessons.length,
  items: lessons.reduce((sum, lesson) => sum + lesson.items.length, 0),
  levels: new Set(lessons.map((lesson) => lesson.level)).size
};

interface MarketingLink {
  href: string;
  label: string;
  external?: boolean;
}

function readOptionalUrl(envName: string): string | null {
  const value = process.env[envName]?.trim();
  return value ? value : null;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function resolveBaseUrl(req: Request): string {
  return `${req.protocol}://${req.get('host') ?? 'localhost'}`;
}

function resolveLaunchLinks(): { primary: MarketingLink; secondary: MarketingLink; legal: MarketingLink[] } {
  const iosUrl = readOptionalUrl('MARKETING_IOS_URL');
  const androidUrl = readOptionalUrl('MARKETING_ANDROID_URL');
  const waitlistUrl = readOptionalUrl('MARKETING_WAITLIST_URL');
  const privacyUrl = readOptionalUrl('MARKETING_PRIVACY_URL');
  const termsUrl = readOptionalUrl('MARKETING_TERMS_URL');

  const primary = iosUrl
    ? { href: iosUrl, label: 'Download for iPhone', external: true }
    : androidUrl
      ? { href: androidUrl, label: 'Download on Android', external: true }
      : waitlistUrl
        ? { href: waitlistUrl, label: 'Join the Launch List', external: true }
        : { href: '#curriculum', label: 'Explore the Learning Path' };

  const secondary = androidUrl
    ? { href: androidUrl, label: 'Get Android Access', external: true }
    : waitlistUrl
      ? { href: waitlistUrl, label: 'Request Early Access', external: true }
      : { href: '#difference', label: 'Why Moneta Works' };

  const legalCandidates: Array<MarketingLink | null> = [
    privacyUrl ? { href: privacyUrl, label: 'Privacy', external: true } : null,
    termsUrl ? { href: termsUrl, label: 'Terms', external: true } : null
  ];
  const legal = legalCandidates.filter((link): link is MarketingLink => link !== null);

  return { primary, secondary, legal };
}

function renderAnchor(link: MarketingLink, className: string): string {
  const rel = link.external ? ' rel="noreferrer"' : '';
  const target = link.external ? ' target="_blank"' : '';
  return `<a class="${className}" href="${escapeHtml(link.href)}"${target}${rel}>${escapeHtml(link.label)}</a>`;
}

export function renderRobotsTxt(req: Request): string {
  const baseUrl = resolveBaseUrl(req);
  return `User-agent: *\nAllow: /\nSitemap: ${baseUrl}/sitemap.xml\n`;
}

export function renderSitemapXml(req: Request): string {
  const baseUrl = resolveBaseUrl(req);
  const legalUrls = [
    'privacy-policy',
    'terms-of-service',
    'subscription-terms',
    'financial-education-disclaimer',
    'account-data-deletion-policy'
  ].map((slug) => `  <url>\n    <loc>${baseUrl}/legal/${slug}</loc>\n  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
  </url>
${legalUrls}
</urlset>
`;
}

export function renderMarketingPage(req: Request): string {
  const baseUrl = resolveBaseUrl(req);
  const canonicalUrl = `${baseUrl}/`;
  const socialImageUrl = `${baseUrl}/marketing/moneta-mark.svg`;
  const { primary, secondary, legal } = resolveLaunchLinks();
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    name: 'Moneta',
    applicationCategory: 'EducationApplication',
    operatingSystem: 'iOS, Android',
    description: 'Moneta helps people build money confidence with 5-minute finance lessons, daily review, and a guided path from budgeting basics to long-term wealth concepts.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    }
  };

  const legalLinks = legal.length > 0
    ? legal.map((link) => renderAnchor(link, 'footer-link')).join('')
    : '<p class="footer-note">Store, support, and policy links are wired in when launch URLs are available.</p>';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Moneta | Build money confidence in 5-minute lessons</title>
    <meta
      name="description"
      content="Moneta is a Duolingo-style finance learning app with 5-minute lessons, daily review, and a guided path from budgeting basics to long-term wealth concepts."
    />
    <meta name="theme-color" content="#0c1415" />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
    <link rel="icon" href="/marketing/moneta-mark.svg" type="image/svg+xml" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Moneta" />
    <meta property="og:title" content="Moneta | Build money confidence in 5-minute lessons" />
    <meta
      property="og:description"
      content="A guided finance learning app built around short lessons, daily review, and real-life money decisions."
    />
    <meta property="og:url" content="${escapeHtml(canonicalUrl)}" />
    <meta property="og:image" content="${escapeHtml(socialImageUrl)}" />
    <meta property="og:image:alt" content="Moneta brand mark" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Moneta | Build money confidence in 5-minute lessons" />
    <meta
      name="twitter:description"
      content="Short finance lessons, daily review, and a guided path that helps money skills actually stick."
    />
    <meta name="twitter:image" content="${escapeHtml(socialImageUrl)}" />
    <meta name="twitter:image:alt" content="Moneta brand mark" />
    <link rel="stylesheet" href="/marketing/site.css" />
    <script type="application/ld+json">${JSON.stringify(structuredData)}</script>
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    <div class="page-shell">
      <header class="site-header">
        <a class="brand-lockup" href="/">
          <img class="brand-mark" src="/marketing/moneta-mark.svg" alt="" width="48" height="48" decoding="async" fetchpriority="high" />
          <span class="brand-text">
            <span class="brand-name">Moneta</span>
            <span class="brand-tag">Finance learning for real life</span>
          </span>
        </a>
        <nav class="site-nav" aria-label="Primary">
          <a href="#how-it-works">How it works</a>
          <a href="#curriculum">Curriculum</a>
          <a href="#trust">Trust</a>
        </nav>
      </header>

      <main id="main">
        <section class="hero">
          <div class="hero-copy">
            <p class="eyebrow">Short finance lessons. Daily review. No hype.</p>
            <h1>Build money confidence in 5-minute lessons.</h1>
            <p class="hero-body">
              Moneta turns personal finance into a guided daily habit. Learn the basics, practice real-life decisions,
              and keep key ideas fresh with a review loop built to make them stick.
            </p>
            <div class="hero-actions">
              ${renderAnchor(primary, 'button button-primary')}
              ${renderAnchor(secondary, 'button button-secondary')}
            </div>
            <p class="hero-note">Educational only. Not financial advice or investment recommendations.</p>
          </div>

          <div class="hero-panel" aria-label="Product highlights">
            <div class="hero-card hero-card-highlight">
              <span class="hero-card-kicker">Daily Loop</span>
              <strong>Place. Learn. Review. Repeat.</strong>
              <p>Start with a placement check, move through guided lessons, and revisit concepts before they fade.</p>
            </div>
            <div class="hero-grid">
              <div class="hero-card">
                <span class="stat">${curriculumStats.lessons}</span>
                <span class="stat-label">lessons in the current curriculum</span>
              </div>
              <div class="hero-card">
                <span class="stat">${curriculumStats.items}</span>
                <span class="stat-label">learning items already mapped in-repo</span>
              </div>
              <div class="hero-card">
                <span class="stat">${curriculumStats.levels}</span>
                <span class="stat-label">finance levels from F1 Foundations to F6 Analyst Mode</span>
              </div>
              <div class="hero-card">
                <span class="stat">5 min</span>
                <span class="stat-label">default lesson length for busy schedules</span>
              </div>
            </div>
          </div>
        </section>

        <section class="section section-proof" aria-label="Positioning pillars">
          <div class="section-heading">
            <p class="eyebrow">Why it lands</p>
            <h2>Moneta makes finance feel learnable instead of intimidating.</h2>
          </div>
          <div class="pillars">
            <article class="pillar">
              <h3>Structured, not scattered</h3>
              <p>A guided path replaces random videos, disconnected blog posts, and advice that only shows up when something is already urgent.</p>
            </article>
            <article class="pillar">
              <h3>Habit-forming, not overwhelming</h3>
              <p>Short lessons and daily review create momentum without requiring a full course calendar or weekend crash session.</p>
            </article>
            <article class="pillar">
              <h3>Education-first, not hype-driven</h3>
              <p>Moneta stays on the education side of the line: clear concepts, practical reasoning, and no promises of returns or stock tips.</p>
            </article>
          </div>
        </section>

        <section class="section" id="how-it-works">
          <div class="section-heading">
            <p class="eyebrow">How it works</p>
            <h2>A habit loop designed for real retention.</h2>
          </div>
          <div class="steps">
            <article class="step">
              <span class="step-number">01</span>
              <h3>Start with a placement check</h3>
              <p>Meet learners where they are instead of forcing everyone through the same first-time-money-person script.</p>
            </article>
            <article class="step">
              <span class="step-number">02</span>
              <h3>Progress through a guided path</h3>
              <p>Move from budgeting and credit basics into saving, investing, retirement, and higher-stakes planning concepts.</p>
            </article>
            <article class="step">
              <span class="step-number">03</span>
              <h3>Reinforce with daily review</h3>
              <p>Daily review sessions revisit concepts over time so knowledge compounds instead of disappearing after one lesson.</p>
            </article>
          </div>
        </section>

        <section class="section section-curriculum" id="curriculum">
          <div class="section-heading">
            <p class="eyebrow">Curriculum</p>
            <h2>A finance path that grows with the learner.</h2>
          </div>
          <div class="curriculum-grid">
            <article class="level-card">
              <span class="level-code">F1</span>
              <h3>Foundations</h3>
              <p>Cash flow, budgeting, safe banking, and interest basics.</p>
            </article>
            <article class="level-card">
              <span class="level-code">F2</span>
              <h3>Everyday Decisions</h3>
              <p>APR vs. APY, credit drivers, paychecks, and the money choices that show up every month.</p>
            </article>
            <article class="level-card">
              <span class="level-code">F3</span>
              <h3>Planning & Stability</h3>
              <p>Emergency planning, debt tradeoffs, and the basics of insurance and resilience.</p>
            </article>
            <article class="level-card">
              <span class="level-code">F4</span>
              <h3>Long-Term Wealth</h3>
              <p>Investing fundamentals, retirement accounts, diversification, and fee awareness.</p>
            </article>
            <article class="level-card">
              <span class="level-code">F5</span>
              <h3>Advanced Personal Finance</h3>
              <p>Taxes, mortgages, scams, and higher-complexity planning tradeoffs.</p>
            </article>
            <article class="level-card">
              <span class="level-code">F6</span>
              <h3>Analyst Mode</h3>
              <p>Statements, macro context, and structured reasoning for higher-stakes financial literacy.</p>
            </article>
          </div>
        </section>

        <section class="section section-comparison" id="difference">
          <div class="section-heading">
            <p class="eyebrow">What makes it different</p>
            <h2>Designed to be the Duolingo of learning finance, without becoming shallow.</h2>
          </div>
          <div class="comparison-grid">
            <article class="comparison-card">
              <h3>What Moneta gives you</h3>
              <ul>
                <li>Short sessions that fit busy schedules</li>
                <li>A full guided path instead of one-off content</li>
                <li>Daily review built around memory and repetition</li>
                <li>Progress, streaks, and mastery signals</li>
              </ul>
            </article>
            <article class="comparison-card comparison-card-muted">
              <h3>What most alternatives leave behind</h3>
              <ul>
                <li>Fragmented advice with no clear sequence</li>
                <li>Hype-heavy content optimized for attention</li>
                <li>Long courses that are hard to complete</li>
                <li>Finance tools that assume understanding before teaching</li>
              </ul>
            </article>
          </div>
        </section>

        <section class="section section-trust" id="trust">
          <div class="section-heading">
            <p class="eyebrow">Trust & compliance</p>
            <h2>Trust is part of the product, not a legal afterthought.</h2>
          </div>
          <div class="trust-grid">
            <article class="trust-card">
              <h3>Education only</h3>
              <p>Moneta teaches concepts and decision frameworks. It does not provide personalized financial advice, trading signals, or guarantees of outcomes.</p>
            </article>
            <article class="trust-card">
              <h3>User control</h3>
              <p>The product already supports account export and deletion flows in-app, so privacy controls are visible instead of hidden behind support tickets.</p>
            </article>
            <article class="trust-card">
              <h3>Launch discipline</h3>
              <p>This repo already includes release gates for billing readiness, launch docs, store assets, and final signoff before production promotion.</p>
            </article>
          </div>
        </section>

        <section class="section section-faq" aria-label="Frequently asked questions">
          <div class="section-heading">
            <p class="eyebrow">FAQ</p>
            <h2>The questions launch visitors will ask first.</h2>
          </div>
          <div class="faq-list">
            <details>
              <summary>Who is Moneta for?</summary>
              <p>Beginners, early planners, and anyone who wants a clearer path into personal finance without being talked down to or pushed into hype.</p>
            </details>
            <details>
              <summary>What does Moneta Pro unlock?</summary>
              <p>Advanced tracks, deeper review access, and premium learning features for people who want more than the free path.</p>
            </details>
            <details>
              <summary>Does Moneta tell users what to buy or invest in?</summary>
              <p>No. The app is explicitly education-first and stays on the non-advisory side of the line.</p>
            </details>
          </div>
        </section>
      </main>

      <footer class="site-footer">
        <div class="footer-brand">
          <img class="brand-mark" src="/marketing/moneta-mark.svg" alt="" width="36" height="36" loading="lazy" decoding="async" />
          <div>
            <strong>Moneta</strong>
            <p>Learn money skills with structure, repetition, and a calmer voice.</p>
          </div>
        </div>
        <div class="footer-links">
          ${legalLinks}
        </div>
      </footer>
    </div>
  </body>
</html>
`;
}
