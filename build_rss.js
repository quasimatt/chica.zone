#!/usr/bin/env node
/**
 * build_rss.js — generate feed.xml from comics.data.js
 * Usage: node build_rss.js
 */
const fs = require('fs');
const path = require('path');

// Load comics (safe in Node)
const comics = require('./comics.data.js');

// Site config
const SITE_TITLE = 'CHICA MOB QUARTERLY';
const SITE_URL   = 'https://chica.zone';
const FEED_URL   = `${SITE_URL}/feed.xml`;
const SITE_DESC  = 'CHICA MOB QUARTERLY is a daily comic saga.';

// Normalize pages (ascending), then output items newest-first
const pages = Object.keys(comics)
  .map(n => parseInt(n, 10))
  .filter(Number.isFinite)
  .sort((a, b) => a - b)
  .map(n => ({ n, ...comics[n] }));

const itemsXml = pages.slice().reverse().map(({ n, image, date, title }) => {
  const pageUrl = `${SITE_URL}/#${n}`;           // hash link works on static hosting
  const guid    = pageUrl;                       // stable guid
  const pubDate = date ? new Date(date + 'T12:00:00Z').toUTCString()
                       : new Date().toUTCString();

  const ext  = (image || '').split('.').pop().toLowerCase();
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
             : ext === 'png' ? 'image/png'
             : 'application/octet-stream';
  const absImage = image?.startsWith('http') ? image : `${SITE_URL}/${image}`;

  const description = `<![CDATA[
    <p><strong>${escapeHtml(title || `Page ${n}`)}</strong></p>
    ${date ? `<p>Published: ${escapeHtml(date)}</p>` : ''}
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
}).join('\n');

const nowRfc822 = new Date().toUTCString();

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
</rss>`;

// Write feed.xml
const outPath = path.join(__dirname, 'feed.xml');
fs.writeFileSync(outPath, rss.trim() + '\n', 'utf8');
console.log(`✓ Wrote ${outPath}`);

function escapeXml(s='') {
  return s.replace(/[<>&'"]/g, c => (
    c === '<' ? '&lt;' :
    c === '>' ? '&gt;' :
    c === '&' ? '&amp;' :
    c === '\''? '&apos;' : '&quot;'
  ));
}
function escapeHtml(s='') {
  return s.replace(/[&<>"]/g, c => (
    c === '&' ? '&amp;' :
    c === '<' ? '&lt;' :
    c === '>' ? '&gt;' : '&quot;'
  ));
}

