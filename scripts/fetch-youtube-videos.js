import fetch from "node-fetch";
import fs from "fs";

const apiKey = process.env.YOUTUBE_API_KEY;
const outputPath = process.env.OUTPUT_FILE;
const playlistIds = process.env.YOUTUBE_PLAYLIST_IDS.split(',');
const channelIds = process.env.YOUTUBE_CHANNEL_IDS.split(',');

function formatVideosToMarkdownTable(videos) {
  const header = `| Thumbnail | Title | Date |\n|---|---|---|`;
  const rows = videos
    .map(
      (video) => `
| ![Thumbnail](https://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg) | [${video.title}](${video.url}) | ${video.date.toDateString()} |
  `
    )
    .join("\n");
  return `${header}\n${rows}`;
}

function saveVideosToFile(html, outputPath) {
  const existingContent = fs.readFileSync(outputPath, "utf-8");
  const updatedContent = existingContent.replace(
    /<!-- YOUTUBE-VIDEO-LIST:START -->[\s\S]*?<!-- YOUTUBE-VIDEO-LIST:END -->/,
    `<!-- YOUTUBE-VIDEO-LIST:START -->\n${html}\n<!-- YOUTUBE-VIDEO-LIST:END -->`
  );
  fs.writeFileSync(outputPath, updatedContent);
}

async function fetchPlaylistVideos(apiKey, playlistId) {
  let nextPageToken = "";
  const videos = [];

  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}&pageToken=${nextPageToken}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(`YouTube API error: ${data.error.message}`, {
        cause: data.error,
      });
    }

    data.items.forEach((item) => {
      videos.push({
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
        date: new Date(item.snippet.publishedAt),
        videoId: item.snippet.resourceId.videoId,
      });
    });

    nextPageToken = data.nextPageToken || "";
  } while (nextPageToken);

  return videos;
}

async function fetchChannelVideos(apiKey, channelId) {
  let nextPageToken = "";
  const videos = [];

  do {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=50&order=date&type=video&key=${apiKey}&pageToken=${nextPageToken}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      throw new Error(`YouTube API error: ${data.error.message}`, {
        cause: data.error,
      });
    }

    data.items.forEach((item) => {
      videos.push({
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        date: new Date(item.snippet.publishedAt),
        videoId: item.id.videoId,
      });
    });

    nextPageToken = data.nextPageToken || "";
  } while (nextPageToken);

  return videos;
}

async function main() {
  try {
    const [playlistVideos, channelVideos] = await Promise.all([
      ...playlistIds.map((id) => fetchPlaylistVideos(apiKey, id)),
      ...channelIds.map((id) => fetchChannelVideos(apiKey, id)),
    ]);

    const filteredVideos = [...playlistVideos, ...channelVideos]
      .filter((video) => !video.title.startsWith("zz"))
      .sort((a, b) => b.date - a.date) // Sort by date (newest first)
      .slice(0, 10);

    const html = formatVideosToMarkdownTable(filteredVideos);
    saveVideosToFile(html, outputPath);
  } catch (error) {
    console.error(error);
  }
}

main();
