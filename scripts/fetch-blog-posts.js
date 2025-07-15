import fetch from 'node-fetch';
import fs from 'fs';
import { parseStringPromise } from 'xml2js';

async function fetchBlogPosts(feedUrl, outputPath, maxPosts) {
  const response = await fetch(feedUrl);
  const xml = await response.text();
  const json = await parseStringPromise(xml);

  const posts = json.rss.channel[0].item.slice(0, maxPosts).map(post => ({
    title: post.title[0],
    url: post.link[0],
    date: new Date(post.pubDate[0]),
    description: post.description[0]
  }));

  const markdown = posts.map(post => `
#### [${post.title}](${post.url})
${post.date.toDateString()} - *${post.description}*
  `).join('\n\n');

  const existingContent = fs.readFileSync(outputPath, 'utf-8');
  const updatedContent = existingContent.replace(
    /<!-- BLOG-POST-LIST:START -->[\s\S]*?<!-- BLOG-POST-LIST:END -->/,
    `<!-- BLOG-POST-LIST:START -->\n${markdown}\n<!-- BLOG-POST-LIST:END -->`
  );

  fs.writeFileSync(outputPath, updatedContent);
}

const feedUrl = process.env.BLOG_FEED_URL;
const outputPath = process.env.OUTPUT_FILE;
const maxPosts = parseInt(process.env.MAX_POSTS) || 10;
fetchBlogPosts(feedUrl, outputPath, maxPosts).catch(console.error);
