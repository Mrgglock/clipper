/*
    This script aims to take a video, and clip it into several smaller videos.
    It then restitches them all together back into 1 big video and outputs it.
*/


// install ffmpeg, ffprobe
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
// Require dependencies
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
// Set up file path to find ffmpeg and ffprobe
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const path = require('path');
let tempDirPath = path.join(__dirname, 'tempDir');

async function main(filepath, data, dest) {
    // Takes in an array of details, each containing the filepath to the video, starting timestamp, and duration.

    // Clip and stitch all the videos above into 1 video.
    await process(filepath, data, dest);

    console.log("Stitched! Removing temp files...");

    // remove all temporary files. pass in the number of temporary files made.
    //removeTempFiles(filepath, data.length);

    console.log("Removed!");
}

async function process(filepath, data, dest) {
    // For every video, cut it and store it temporarily in tempDir
    let allLoads = [];
    for (let i = 0; i < data.length; ++i) {
        const [start, duration] = data[i];
        allLoads.push(load(filepath, start, duration, i));
    }

    console.log("Cutting clips...");
    await Promise.all(allLoads);
    console.log("Cut! Stitching clips...");

    // Using the library, queue all of the clips to prepare to stitch them
    let f = ffmpeg();
    for (let i = 0; i < data.length; ++i) {
        let clipPath = path.join(tempDirPath, `${i}.${filepath.slice(-3)}`);
        f = f.input(clipPath);
    }
    // Perform the stitching, wrapped in a promise.
    return new Promise((resolve, reject) => {
        f.mergeToFile(path.join(tempDirPath, `temp.${filepath.slice(-3)}`), tempDirPath)
            .save(dest)
            .on('end', _ => resolve())
            .on('error', err => reject(err))
        })
}

async function load(filepath, start, duration, i) {
    let clipPath = path.join(tempDirPath, `${i}.${filepath.slice(-3)}`);
    // Given a file and timestamps, cut it up and store it temporarily in tempDir
    return new Promise((resolve, reject) => {
            ffmpeg(filepath)
                .seekInput(start)
                .duration(duration)
                .save(clipPath)
                .on('end', _ => resolve())
                .on('error', err => reject(err))
            })  
}

// remove n temp files in the tempdir directory (wrapped in a promise)
async function removeTempFiles(filepath, n) {
    let promises = [];
    for (let i = 0; i < n; ++i) {
        let clipPath = path.join(__dirname, 'tempDir', `/${i}.${filepath.slice(-3)}`);
        promises.push(deleteFile(clipPath));
    }
    promises.push(deleteFile(path.join(tempDirPath, `temp.${filepath.slice(-3)}`)));
    return Promise.all(promises);
}

// remove a file (wrapped in a promise)
async function deleteFile(filepath) {
    // wait for the file to not be in use
    while (fileInUse(filepath));
    return new Promise((resolve, reject) => {
        fs.unlink(filepath, err => err ? reject(err) : resolve());
    })
}

function fileInUse(filepath) {
    try {
        fs.readFileSync(filepath);
        return false;
    } catch (e) {
        return true;
    }
}

async function merge(audio, video, destination) {
    return new Promise((resolve, reject) => { 
        ffmpeg().input(audio)
            .input(video)
            .save(destination, tempDirPath)
            .on('end', _ => resolve())
            .on('error', err => reject(err));
    });
}

(async () => {
    if (require.main === module) main();
})();

module.exports = {
    clipAndStitch: main,
    merge,
    deleteFile
}