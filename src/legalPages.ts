import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { marked } from 'marked';

// Slugs are the compliance doc filenames; the pages these render are what the
// marketing footer's MARKETING_*_URL env vars and the store listings link to.
export const LEGAL_SLUGS = [
  'privacy-policy',
  'terms-of-service',
  'subscription-terms',
  'financial-education-disclaimer',
  'account-data-deletion-policy'
] as const;

export type LegalSlug = (typeof LEGAL_SLUGS)[number];

export function isLegalSlug(value: string): value is LegalSlug {
  return (LEGAL_SLUGS as readonly string[]).includes(value);
}

const renderedPages = new Map<LegalSlug, string>();

function extractTitle(markdown: string, slug: string): string {
  const heading = markdown.match(/^#\s+(.+)$/m);
  return heading ? heading[1].trim() : slug;
}

function pageShell(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title} | Moneta</title>
    <meta name="robots" content="index,follow" />
    <meta name="theme-color" content="#0c1415" />
    <link rel="icon" href="/marketing/moneta-mark.svg" type="image/svg+xml" />
    <style>
      :root {
        --ink: #0c1415;
        --paper: #f6f1e7;
        --brass: #d1a15c;
        --muted: #9ab0aa;
        --line: rgba(246, 241, 231, 0.12);
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--ink);
        color: var(--paper);
        font-family: 'Avenir Next', 'Segoe UI', system-ui, sans-serif;
        line-height: 1.7;
      }
      .wrap { max-width: 720px; margin: 0 auto; padding: 40px 22px 80px; }
      .site-nav { display: flex; align-items: center; gap: 12px; padding-bottom: 28px; border-bottom: 1px solid var(--line); }
      .site-nav a { color: var(--paper); text-decoration: none; font-weight: 600; }
      article h1 { font-family: 'Iowan Old Style', Georgia, serif; font-size: 2rem; line-height: 1.2; }
      article h2 { font-family: 'Iowan Old Style', Georgia, serif; font-size: 1.3rem; margin-top: 2em; }
      article a { color: var(--brass); }
      article code { background: rgba(246, 241, 231, 0.08); padding: 1px 5px; border-radius: 4px; }
      article table { border-collapse: collapse; }
      article th, article td { border: 1px solid var(--line); padding: 6px 10px; text-align: left; }
      footer { margin-top: 56px; padding-top: 20px; border-top: 1px solid var(--line); color: var(--muted); font-size: 0.9rem; }
      footer a { color: var(--brass); }
    </style>
  </head>
  <body>
    <div class="wrap">
      <nav class="site-nav">
        <img src="/marketing/moneta-mark.svg" alt="" width="30" height="30" />
        <a href="/">Moneta</a>
      </nav>
      <article>
${bodyHtml}
      </article>
      <footer>Questions about this policy: <a href="mailto:lorenzosca7@protonmail.ch">lorenzosca7@protonmail.ch</a> · <a href="/">moneta home</a></footer>
    </div>
  </body>
</html>
`;
}

export async function renderLegalPage(slug: LegalSlug): Promise<string> {
  const cached = renderedPages.get(slug);
  if (cached) {
    return cached;
  }

  const filePath = path.resolve(process.cwd(), 'docs', 'compliance', `${slug}.md`);
  const markdown = await readFile(filePath, 'utf8');
  const bodyHtml = await marked.parse(markdown, { async: true });
  const page = pageShell(extractTitle(markdown, slug), bodyHtml);
  renderedPages.set(slug, page);
  return page;
}
