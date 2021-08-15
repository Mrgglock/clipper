const path = require("path");
const { clipAndStitch, merge, deleteFile } = require(path.join(__dirname, 'mp4', 'clipAndStitch.js'));
const { getBestTimestamps } = require(path.join(__dirname, 'ytAnalysis', 'index.js'));
const { partialDownload } = require(path.join(__dirname, 'dlVideo', 'dlVideo.js'));
const home = __dirname;


async function main() {

    /*
        Given a link,
        download the video and audio.
        Simultaneously analyse the chat for the most interesting timestamps.
        Cut the video and audio,
        and merge them.
    */

    const link = 'https://www.youtube.com/watch?v=a3UGJKAIiIg';

    const audioPath = path.join(home, 'audio.mp3');
    const videoPath = path.join(home, 'video.mp4');
    const mergedPath = path.join(home, 'merged.mp4');
    const finalPath = path.join(home, 'final.mp4');
    let promises = [];
    promises.push(partialDownload(link, 'audio', audioPath)); // Download Audio
    promises.push(partialDownload(link, 'video', videoPath)); // Download Video
    promises.push(getBestTimestamps(link)); // Get most interesting timestamps
    let [_, __, data] = await Promise.all(promises);
    await merge(audioPath, videoPath, mergedPath);
    await clipAndStitch(mergedPath, data, finalPath)
    
    //const files = [audioPath, videoPath, finalAudioPath, finalVideoPath];
    //for (const file of files) deleteFile(file);
}

(() => main())();