#!/usr/bin/env node
/**
 * build_rss.js — generate feed.xml from the comics object in script.js
 * Usage: node build_rss.js
 */
const fs = require('fs');
const path = require('path');

// 1) import comics from your script.js
const { comics } = require('./script.js');

// 2) site config
const SITE_TITLE = 'CHICA ZONE';
const SITE_URL   = 'https://chica.zone';
const FEED_URL   = `${SITE_URL}/feed.xml`;
const SITE_DESC  = 'CHICA ZONE is a daily comic saga.';

// 3) comics → array sorted by page number (ascending)
const pages = Object.keys(comics)
  .map(n => parseInt(n, 10))
  .sort((a, b) => a - b)
  .map(n => ({ n, ...comics[n] }));

// 4) build <item>s (most readers like newest first)
const itemsXml = pages
  .slice() // copy
  .reverse()
  .map(({ n, image, date, title }) => {
    const pageUrl = `${SITE_URL}/#${n}`;                     // deep-link to hash
    const guid    = `${SITE_URL}/#${n}`;                     // stable guid
    const pubDate = date ? new Date(date).toUTCString() : new Date().toUTCString();

    // best-effort mime type (png/jpg) based on filename
    const ext = (image || '').split('.').pop().toLowerCase();
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
               : ext === 'png' ? 'image/png'
               : 'application/octet-stream';
    const absImage = image?.startsWith('http') ? image : `${SITE_URL}/${image}`;

    // Basic HTML description. Keep it simple—some readers sanitize aggressively.
    const description = `<![CDATA[
      <p><strong>${escapeHtml(title || `Page ${n}`)}</strong></p>
      <p>Published: ${escapeHtml(date || '')}</p>
      <p><img src="${absImage}" alt="${escapeHtml(title || `Page ${n}`)}" /></p>
    ]]>`;

    return `
  <item>
    <title>${escapeXml(title || `Page ${n}`)}</title>
    <link>${pageUrl}</link>
    <guid isPermaLink="false">${guid}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${description}</description>
    <enclosure url="${absImage}" type="${mime}" />
  </item>`;
  })
  .join('\n');

const nowRfc822 = new Date().toUTCString();

// 5) full RSS 2.0 doc
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeXml(SITE_TITLE)}</title>
  <link>${SITE_URL}</link>
  <description>${escapeXml(SITE_DESC)}</description>
  <language>en-us</language>
  <lastBuildDate>${nowRfc822}</lastBuildDate>
  <docs>https://www.rssboard.org/rss-specification</docs>
  <generator>build_rss.js</generator>
  <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${FEED_URL}" rel="self" type="application/rss+xml"/>
${itemsXml}
</channel>
</rss>
`;

// 6) write to /feed.xml
const outPath = path.join(__dirname, 'feed.xml');
fs.writeFileSync(outPath, rss.trim() + '\n', 'utf8');
console.log(`✓ Wrote ${outPath}`);

function escapeXml(s='') {
  return s.replace(/[<>&'"]/g, c => (
    c === '<' ? '&lt;' :
    c === '>' ? '&gt;' :
    c === '&' ? '&amp;' :
    c === '\''? '&apos;' :
    '&quot;'
  ));
}
function escapeHtml(s='') {
  return s.replace(/[&<>"]/g, c => (
    c === '&' ? '&amp;' :
    c === '<' ? '&lt;' :
    c === '>' ? '&gt;' :
    '&quot;'
  ));
}
