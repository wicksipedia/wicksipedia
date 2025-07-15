import fetch from 'node-fetch';
import fs from 'fs';

function formatVideosToHTML(videos) {
  return videos.map(video => `
    <tr>
      <td><a href="${video.url}"><img width="140px" src="http://img.youtube.com/vi/${video.videoId}/maxresdefault.jpg"></a></td>
      <td><a href="${video.url}">${video.title}</a><br/>${video.date.toDateString()}</td>
    </tr>
  `).join('\n');
}

function saveVideosToFile(html, outputPath) {
  const existingContent = fs.readFileSync(outputPath, 'utf-8');
  const updatedContent = existingContent.replace(
    /<!-- YOUTUBE-VIDEO-LIST:START -->[\s\S]*?<!-- YOUTUBE-VIDEO-LIST:END -->/,
    `<!-- YOUTUBE-VIDEO-LIST:START -->\n${html}\n<!-- YOUTUBE-VIDEO-LIST:END -->`
  );
  fs.writeFileSync(outputPath, updatedContent);
}

async function fetchPlaylistVideos(apiKey, playlistId) {
  let nextPageToken = '';
  const videos = [];

  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}&pageToken=${nextPageToken}`;
    const response = await fetch(url);
    const data = await response.json();

    data.items.forEach(item => {
      videos.push({
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
        date: new Date(item.snippet.publishedAt),
        videoId: item.snippet.resourceId.videoId
      });
    });

    nextPageToken = data.nextPageToken || '';
  } while (nextPageToken);

  return videos;
}

async function fetchChannelVideos(apiKey, channelId) {
  let nextPageToken = '';
  const videos = [];

  do {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=50&order=date&type=video&key=${apiKey}&pageToken=${nextPageToken}`;
    const response = await fetch(url);
    const data = await response.json();

    data.items.forEach(item => {
      videos.push({
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        date: new Date(item.snippet.publishedAt),
        videoId: item.id.videoId
      });
    });

    nextPageToken = data.nextPageToken || '';
  } while (nextPageToken);

  return videos;
}

async function main() {
  try {
    const [playlistVideos, channelVideos] = await Promise.all([
      fetchPlaylistVideos(apiKey, playlistId),
      fetchChannelVideos(apiKey, channelId)
    ]);

    const aggregatedVideos = [...playlistVideos, ...channelVideos];
    const filteredVideos = aggregatedVideos.filter(video => !video.title.startsWith('zz'));
    filteredVideos.sort((a, b) => b.date - a.date); // Sort by date (newest first)

    console.log('videos', filteredVideos);

    const html = formatVideosToHTML(filteredVideos);
    saveVideosToFile(html, outputPath);
  } catch (error) {
    console.error(error);
  }
}

const apiKey = process.env.YOUTUBE_API_KEY;
const playlistId = 'PLpiOR7CBNvlouByIBdQP_YiGkrYqKCWgP';
const channelId = 'UCz-9w1yxZVXofthsmh77G1w';
const outputPath = process.env.OUTPUT_FILE;

main();
