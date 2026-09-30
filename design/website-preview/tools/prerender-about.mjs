import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { createServer } from 'vite';

const escapeHtml = value => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { default: AboutPage } = await server.ssrLoadModule('/src/pages/about.tsx');
  const { aboutContent } = await server.ssrLoadModule('/src/content/aboutContent.ts');
  const template = await readFile('dist/index.html', 'utf8');
  if (!template.includes('<div id="root"></div>')) throw new Error('The prerender root was not found.');
  const markup = renderToString(createElement(AboutPage));
  let html = template
    .replace('<div id="root"></div>', () => `<div id="root">${markup}</div>`)
    .replace(/<title>.*?<\/title>/, () => `<title>${escapeHtml(aboutContent.meta.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?\s*>/, () => `<meta name="description" content="${escapeHtml(aboutContent.meta.description)}"/>`);
  const socialMeta = `<meta property="og:title" content="${escapeHtml(aboutContent.meta.title)}"/><meta property="og:description" content="${escapeHtml(aboutContent.meta.description)}"/><meta property="og:type" content="website"/>`;
  html = html.replace('</head>', () => socialMeta + '</head>');
  // Configure the real public origin at deployment; never publish a localhost canonical.
  if (process.env.SITE_URL) {
    const origin = new URL(process.env.SITE_URL);
    if (!['https:', 'http:'].includes(origin.protocol)) throw new Error('SITE_URL must be an HTTP(S) URL.');
    const aboutUrl = new URL('/about', origin).href;
    html = html.replace('</head>', () => `<link rel="canonical" href="${escapeHtml(aboutUrl)}"/><meta property="og:url" content="${escapeHtml(aboutUrl)}"/></head>`);
    await writeFile('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escapeHtml(origin.origin + '/')}</loc></url><url><loc>${escapeHtml(aboutUrl)}</loc></url></urlset>`);
  }
  await mkdir('dist/about', { recursive: true });
  await writeFile('dist/about/index.html', html);
  // Vite and static hosts may resolve extensionless and directory URLs differently.
  await writeFile('dist/about.html', html);
  console.log('Prerendered /about with Ada’s story, metadata and structured data.');
} finally {
  await server.close();
}
