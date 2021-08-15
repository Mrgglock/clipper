/*
    The purpose of this file is that given a youtube link, target length, tolerance range, and clip preview range, return a list of timestamp ranges where the chat
    is the most active.

    - Youtube Link : The link to the VOD to analyse on.
    - Target Length : The desired length of the resulting clip.
    - Tolerance Range : The amount, in seconds, to average the number of messages sent on a given second. Smoothing.
    - Clip Preview Range : The amount, in seconds, to add to the front and back of a clip, to give context to the clip.
*/

const path = require('path');
const fs = require("fs");

async function main(link = "", maxClipTime = 240, leftPreview = 15, rightPreview = 10, smoothing = 15) {
    console.log("Loading Stream Chat...");
    let data = await getActivity(link, smoothing);
    console.log("Loaded! Analysing best timestamps...");
    // Sort data ascending by activity
    data.sort((a, b) => a[1] - b[1]);
    let ans = getOptimalTimestamp(maxClipTime, data, leftPreview, rightPreview);
    ans = ans.map(e => {
        e[1] = e[1] - e[0];
        return e;
    })
    console.log("Done!");
    return ans;
}

// Helper function that returns the array of (smoothed) number of messages sent on every given second to the end of the livestream.
// This array is filled with length of livestream elements, which are [timestamp, number of messages].
// Takes in the smoothing factor, and a youtube link.
async function getActivity(link, range) {
    // Require dependencies
    const spawn = require("child_process").spawn;
    const pyScriptPath = path.join(__dirname, "chatDownloader.py");
    const dataJSONPath = path.join(__dirname, "data.json");
    const pythonProcess = spawn('python3', [pyScriptPath, link]);
    if (!link && !fs.existsSync(dataJSONPath)) fs.writeFileSync(dataJSONPath, '[]'); 

    // Call the .py file, wrapped in a promise, to process.
    return new Promise((resolve, reject) => {
        pythonProcess.stdout.on('close', () => {
            // Read the file returned by the .py script.
            const data = JSON.parse(fs.readFileSync(dataJSONPath));
            // at `t`s, the chat activity is calculated by the number of messages sent between `t - range/2`s and `t + range/2`s.
            let activity = [];
            // Prepare 2 pointers, to get the (smoothed) number of messages sent on each second. O(n) runtime this way rather than O(n^2).
            let left = -1;
            let right = -1;
            for (let t = 0; t <= data[data.length - 1]; ++t) {
                // The left pointer should give the element 1 before the range required
                for (let i = left; i < data.length - 1; ++i) {
                    if (data[i + 1] >= t - range / 2) break;
                    ++left;
                }
                // The right pointer should give the biggest element in the range.
                for (let i = right; i < data.length - 1; ++i) {
                    if (data[i + 1] > t + range / 2) break;
                    ++right;
                }
                activity.push([t, right - left]);
            }
            // Return the list of (smoothed) number of messages sent on each second.
            resolve(activity);
        });
    });

}

// Helper function that returns an array of time ranges, of which are length 2, containing the start and end times.
// Given a threshold, data, left clip preview range, right preview range,
// Timestamps are considered if the number of messages is above the threshold.
// It then tries to string them together into interesting time ranges.
function getClipStamps(threshold, data, leftTol, rightTol) {
    // Store max timestamp in maxT
    const maxT = data.length;
    // Find all the elements that have more messages than the threshold and sort it by timestamp
    let truncatedData = data.filter(e => e[1] >= threshold);
    truncatedData.sort((a, b) => a[0] - b[0]);
    // If there is no data to consider, return immediately.
    if (truncatedData.length == 0) return [];
    // Start processing the durations
    let timestamps = [];
    // Store an existing start time of a clip (no lower than 0)
    let existingStartTime = Math.max(0, truncatedData[0][0] - leftTol);
    // Store an existing end time of a clip (no higher than maxT)
    let existingEndTime = Math.min(maxT, truncatedData[0][0] + rightTol);
    // Go through every interesting time point
    for (let [time, _] of truncatedData) {
        // If this time were considered in a vacuum, calculate the start and end time based on the tolerance.
        const startTime = Math.max(0, time - leftTol);
        const endTime = Math.min(maxT, time + rightTol);
        // If the start time of this clip happens before the existing end time, just string it on to a new end time
        if (startTime <= existingEndTime) {
            existingEndTime = endTime;
        } else {
            // Otherwise, this is a new time stamp and push it. Create new existing timestamps for further processing
            timestamps.push([existingStartTime, existingEndTime]);
            existingStartTime = startTime;
            existingEndTime = endTime;
        }
    }
    // Push the last timestamp
    timestamps.push([existingStartTime, existingEndTime]);
    return timestamps;
}

// Helper function that returns the total length of the video in seconds, given the array of time ranges returned by getClipStamps.
function getClipLength(clipstamps) {
    let sum = 0;
    for (const [start, end] of clipstamps) {
        sum += end - start;
    }
    return sum;
}

// Helper function that returns the array of time ranges, of which are length 2, containing the start and end times.
// Such that it maximises the amount of runtime in total without exceeding the duration specified.
// Takes in a maximum duration, the data of [timestamp, number of messages], left clip preview range and right clip preview range.
function getOptimalTimestamp(duration, data, leftTol, rightTol) {
    const maxActivity = Math.max(...data.map(e => e[1]));
    let i;
    for (i = maxActivity; i >= 0; --i) {
        const clipstamps = getClipStamps(i, data, leftTol, rightTol);
        if (getClipLength(clipstamps) > duration) break;
    }
    return getClipStamps(i + 1, data, leftTol, rightTol);
}

(async () => {
    if (require.main === module) main();
})();

module.exports = {
    getBestTimestamps: main
}