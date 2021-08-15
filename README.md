# yt-livestream-clipper
 This is a little pet project. \
 Produces a compilation of clips based on fast the chat moves in a YouTube livestream. 
 
# Dependencies
 `node.js`, `npm`, `python3`, `pip` \
 chat-downloader: `pip install chat-downloader` \
 https://github.com/xenova/chat-downloader 
 
 ffmpeg: `npm install fluent-ffmpeg` `npm install @ffmpeg-installer/ffmpeg` `npm install @ffprobe-installer/ffprobe` \
 https://github.com/fluent-ffmpeg/node-fluent-ffmpeg \
 https://www.npmjs.com/package/@ffmpeg-installer/ffmpeg \
 https://www.npmjs.com/package/@ffprobe-installer/ffprobe 
 
 ytdl-core: `npm install ytdl-core` \
 https://www.npmjs.com/package/ytdl-core 

# Usage
 In `clipper.js`, change the line `const link` to the youtube link you wish to analyse. \
 Run `node clipper.js`. 

# How it works
 - Downloads the audio and video using `ytdl-core` 
 - Merges them into 1 video 
 - Downloads the chat log using `chat-downloader` 
 - Based on how fast the chat goes, it determines the best timestamps for the compilation of clips 
 - Cut and stitch the video together based on the best timestamps
