import type { Request } from 'express';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderMarketingPage, renderRobotsTxt, renderSitemapXml } from '../src/marketingSite.js';

const MARKETING_ENV_VARS = [
  'MARKETING_IOS_URL',
  'MARKETING_ANDROID_URL',
  'MARKETING_WAITLIST_URL',
  'MARKETING_PRIVACY_URL',
  'MARKETING_TERMS_URL'
] as const;

function makeRequest(overrides: { protocol?: string; host?: string | undefined } = {}): Request {
  const protocol = overrides.protocol ?? 'https';
  const host = 'host' in overrides ? overrides.host : 'moneta.test';
  return {
    protocol,
    get: (header: string) => (header.toLowerCase() === 'host' ? host : undefined)
  } as unknown as Request;
}

describe('marketingSite rendering', () => {
  const originalEnv = new Map<string, string | undefined>();

  beforeEach(() => {
    for (const name of MARKETING_ENV_VARS) {
      originalEnv.set(name, process.env[name]);
      delete process.env[name];
    }
  });

  afterEach(() => {
    for (const name of MARKETING_ENV_VARS) {
      const value = originalEnv.get(name);
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  });

  describe('renderRobotsTxt', () => {
    it('points crawlers at the request-derived sitemap URL', () => {
      const robots = renderRobotsTxt(makeRequest());

      expect(robots).toContain('User-agent: *');
      expect(robots).toContain('Allow: /');
      expect(robots).toContain('Sitemap: https://moneta.test/sitemap.xml');
    });

    it('falls back to localhost when the Host header is missing', () => {
      const robots = renderRobotsTxt(makeRequest({ protocol: 'http', host: undefined }));

      expect(robots).toContain('Sitemap: http://localhost/sitemap.xml');
    });
  });

  describe('renderSitemapXml', () => {
    it('emits a single canonical url entry derived from the request', () => {
      const sitemap = renderSitemapXml(makeRequest());

      expect(sitemap).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(sitemap).toContain('<loc>https://moneta.test/</loc>');
    });
  });

  describe('renderMarketingPage launch links', () => {
    it('uses in-page anchors when no launch URLs are configured', () => {
      const page = renderMarketingPage(makeRequest());

      expect(page).toContain('href="#curriculum"');
      expect(page).toContain('Explore the Learning Path');
      expect(page).toContain('href="#difference"');
      expect(page).toContain('Why Moneta Works');
      // Without launch URLs no legal links render, so the fallback note is shown instead.
      expect(page).toContain('Store, support, and policy links are wired in when launch URLs are available.');
    });

    it('prefers the Android store link for the secondary CTA when no iOS link exists', () => {
      process.env.MARKETING_ANDROID_URL = 'https://play.google.com/store/apps/details?id=app.moneta';

      const page = renderMarketingPage(makeRequest());

      // Android becomes the primary CTA when there is no iOS URL...
      expect(page).toContain('Download on Android');
      // ...and is reused for the secondary CTA label.
      expect(page).toContain('Get Android Access');
      expect(page).toContain('https://play.google.com/store/apps/details?id=app.moneta');
    });

    it('falls back to the waitlist for the secondary CTA when only a waitlist URL exists', () => {
      process.env.MARKETING_WAITLIST_URL = 'https://moneta.app/waitlist';

      const page = renderMarketingPage(makeRequest());

      expect(page).toContain('Join the Launch List');
      expect(page).toContain('Request Early Access');
      expect(page).toContain('https://moneta.app/waitlist');
    });

    it('renders both legal links and marks external anchors as such', () => {
      process.env.MARKETING_PRIVACY_URL = 'https://moneta.app/privacy';
      process.env.MARKETING_TERMS_URL = 'https://moneta.app/terms';

      const page = renderMarketingPage(makeRequest());

      expect(page).toContain('>Privacy</a>');
      expect(page).toContain('>Terms</a>');
      expect(page).toContain('https://moneta.app/privacy');
      expect(page).toContain('https://moneta.app/terms');
      // External links open in a new tab without leaking the referrer.
      expect(page).toContain('target="_blank"');
      expect(page).toContain('rel="noreferrer"');
      expect(page).not.toContain('Store, support, and policy links are wired in');
    });
  });

  describe('renderMarketingPage escaping', () => {
    it('escapes HTML-sensitive characters in configured launch URLs', () => {
      process.env.MARKETING_IOS_URL = 'https://moneta.app/dl?a=1&b="2"&c=<x>';

      const page = renderMarketingPage(makeRequest());

      expect(page).toContain('https://moneta.app/dl?a=1&amp;b=&quot;2&quot;&amp;c=&lt;x&gt;');
      // The raw, unescaped form must never reach the rendered HTML.
      expect(page).not.toContain('c=<x>');
    });

    it('escapes the request-derived canonical URL', () => {
      const page = renderMarketingPage(makeRequest({ protocol: 'https', host: 'moneta.test"<script>' }));

      expect(page).toContain('moneta.test&quot;&lt;script&gt;');
      expect(page).not.toContain('moneta.test"<script>');
    });
  });
});
