const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { deleteFile } = require(path.join(__dirname, "..", "mp4", "clipAndStitch.js"));

async function download(link, type, destination) {
    if (type != 'audio' && type != 'video') throw 'Type is not audio or video!';
    const audio = partialDownload(link, type, destination);
    await audio;
    console.log("Downloaded! Merging...");
    await merge(audioDest, videoDest, destination);
    console.log("Merged! Removing temp files...");
    await Promise.all([deleteFile(audioDest), deleteFile(videoDest)]);
    console.log("Removed!")
}

async function partialDownload(link, type, destination) {
    if (type != 'audio' && type != 'video') throw 'Type is not audio or video!';
    if (type == 'audio' && destination.slice(-4) != '.mp3') throw 'Type is of audio but filename does not end with .mp3!';
    if (type == 'video' && destination.slice(-4) != '.mp4') throw 'Type is of video but filename does not end with .mp4!';
    const stream = ytdl(link, { filter: `${type}only` } ).pipe(fs.createWriteStream(destination));
    return new Promise((resolve, reject) => {
        stream.on('finish', () => {
            return resolve();
        })
    })
}

module.exports = {
    partialDownload
}