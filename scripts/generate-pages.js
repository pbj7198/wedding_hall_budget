import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cloudflare Worker RSS endpoint
const FEED_ENDPOINT = 'https://dic-wannabe-rss.qkrqudwn12-b9d.workers.dev/feed';
const BLOG_HOME = 'https://blog.naver.com/dic-wannabe';
const SITE_URL = 'https://seoul-wedding.site';

// Fetch RSS feed
async function fetchRSS() {
  const fetch = (await import('node-fetch')).default;
  const response = await fetch(FEED_ENDPOINT);
  const data = await response.json();
  return data.xml;
}

// Parse XML
async function parseXML(xmlString) {
  const { parseString } = await import('xml2js');
  return new Promise((resolve, reject) => {
    parseString(xmlString, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

// Extract first image from HTML description
function extractFirstImage(html) {
  if (!html) return null;
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return imgMatch ? imgMatch[1] : null;
}

// Decode HTML entities
function decodeEntities(text) {
  const entities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' '
  };
  return text.replace(/&[^;]+;/g, match => entities[match] || match);
}

// Infer category from title/description
function inferCategory(title, desc) {
  const text = `${title} ${desc}`.toLowerCase();
  if (text.includes('웨딩홀') || text.includes('홀투어') || text.includes('예식장')) return '웨딩홀';
  if (text.includes('스드메') || text.includes('드레스') || text.includes('메이크업') || text.includes('스튜디오')) return '스드메';
  if (text.includes('신혼여행') || text.includes('허니문') || text.includes('바르셀로나') || text.includes('크루즈')) return '신혼여행';
  return '기타';
}

// Create slug from title
function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

// Generate post HTML
function generatePostHTML(post) {
  const { title, description, link, pubDate, thumbnail, category } = post;

  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} | 쭈령이 커플 웨딩준비</title>
  <meta name="description" content="${description.substring(0, 150)}..." />
  <meta name="keywords" content="${category}, 웨딩준비, 서울 웨딩홀, 스드메, 신혼여행, 쭈령이 커플" />

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description.substring(0, 150)}..." />
  <meta property="og:url" content="${SITE_URL}/posts/${post.slug}.html" />
  ${thumbnail ? `<meta property="og:image" content="${thumbnail}" />` : ''}

  <!-- Canonical -->
  <link rel="canonical" href="${link}" />

  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f8fafc;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    header {
      background: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 15px;
      color: #0f172a;
    }
    .meta {
      color: #64748b;
      font-size: 0.9rem;
      margin-bottom: 20px;
    }
    .category {
      display: inline-block;
      background: #e0f2fe;
      color: #0369a1;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.85rem;
      margin-right: 10px;
    }
    .thumbnail {
      width: 100%;
      border-radius: 8px;
      margin: 20px 0;
    }
    .content {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      margin-bottom: 30px;
    }
    .btn {
      display: inline-block;
      background: #2563eb;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
    }
    .btn:hover {
      background: #1d4ed8;
    }
    .back-link {
      color: #64748b;
      text-decoration: none;
      margin-bottom: 20px;
      display: inline-block;
    }
    .back-link:hover {
      color: #0f172a;
    }
  </style>
</head>
<body>
  <div class="container">
    <a href="/" class="back-link">← 홈으로 돌아가기</a>

    <header>
      <h1>${title}</h1>
      <div class="meta">
        <span class="category">${category}</span>
        <span>${new Date(pubDate).toLocaleDateString('ko-KR')}</span>
      </div>
      ${thumbnail ? `<img src="${thumbnail}" alt="${title}" class="thumbnail" />` : ''}
    </header>

    <div class="content">
      <p>${description}</p>
    </div>

    <div style="text-align: center;">
      <a href="${link}" class="btn" target="_blank" rel="noopener">
        네이버 블로그에서 전체 글 읽기 →
      </a>
    </div>
  </div>
</body>
</html>`;
}

// Generate sitemap
function generateSitemap(posts) {
  const urls = [
    `  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`
  ];

  posts.forEach(post => {
    urls.push(`  <url>
    <loc>${SITE_URL}/posts/${post.slug}.html</loc>
    <lastmod>${new Date(post.pubDate).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`);
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;
}

// Generate robots.txt
function generateRobotsTxt() {
  return `User-agent: *
Allow: /

User-agent: Yeti
Allow: /

User-agent: Googlebot
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml`;
}

// Main function
async function main() {
  try {
    console.log('Fetching RSS feed...');
    const xmlString = await fetchRSS();

    console.log('Parsing XML...');
    const feed = await parseXML(xmlString);
    const items = feed.rss.channel[0].item || [];

    console.log(`Found ${items.length} posts`);

    // Create posts directory
    const postsDir = path.join(process.cwd(), 'posts');
    if (!fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true });
    }

    // Process each post
    const posts = [];
    items.forEach((item, index) => {
      const title = item.title?.[0] || 'Untitled';
      const link = item.link?.[0] || BLOG_HOME;
      const pubDate = item.pubDate?.[0];
      const descriptionRaw = item.description?.[0] || '';
      const description = decodeEntities(descriptionRaw.replace(/<[^>]*>/g, '')).substring(0, 300);
      const thumbnail = extractFirstImage(descriptionRaw);
      const category = inferCategory(title, description);
      const slug = `${index + 1}-${createSlug(title)}`;

      const post = {
        title,
        link,
        pubDate,
        description,
        thumbnail,
        category,
        slug
      };

      posts.push(post);

      // Generate HTML file
      const htmlContent = generatePostHTML(post);
      const filePath = path.join(postsDir, `${slug}.html`);
      fs.writeFileSync(filePath, htmlContent, 'utf8');

      console.log(`Generated: ${slug}.html`);
    });

    // Generate sitemap
    console.log('Generating sitemap...');
    const sitemapContent = generateSitemap(posts);
    fs.writeFileSync(path.join(process.cwd(), 'sitemap.xml'), sitemapContent, 'utf8');

    // Generate robots.txt
    console.log('Generating robots.txt...');
    const robotsTxtContent = generateRobotsTxt();
    fs.writeFileSync(path.join(process.cwd(), 'robots.txt'), robotsTxtContent, 'utf8');

    console.log('✅ All pages generated successfully!');
    console.log(`Total posts: ${posts.length}`);

  } catch (error) {
    console.error('Error generating pages:', error);
    process.exit(1);
  }
}

main();
