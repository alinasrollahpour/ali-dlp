//node.js app to run in background

//yt-dlp -f "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4][height<=1080]" --merge-output-format mp4 -o "/path/to/your/directory/filename.mp4" <video_url>

//api doc:
//  POST:
//  {
//      url: "example yt url",
//      resolution: "1080"
//  }

// const { spawn } = require('child_process');
// const express = require('express');

import {spawn} from 'child_process';
import express from 'express';
import open from 'open';
import path from 'path';

const app = express();
const __filename = import.meta.filename;
const __dirname = path.dirname(__filename);
const port = 8086;
const defaultResolution = "1080";

//globals
let status = "none"; // can be: none - downloading - finished
let progress = NaN; // 0.0 to 100.0
let progressLog = ""; // like: [download]   3.7% of ~247.43MiB at  1.15MiB/s ETA 03:29

open(`http://localhost:${port}`).then(
    () => console.log(`I tried to open on port ${port}`),
);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());


app.get('/', function (req, res) {
    res.sendFile(path.resolve(__dirname, './index.html'));
})

//get current status from frontend
app.get('/status', (req, res) => {
    console.log('i sent /status to front: ' + status + progress + progressLog)
    return res.status(200).json({
        status, progress, progressLog
    });
})

/**
 * POST route to start video download
 * Expects: { url: string, resolution: string }
 */
app.post('/download', (req, res) => {

    console.log("req.body: " + JSON.stringify(req.body));
    const videoUrl = req.body.url;
    let resolution = req.body.resolution;
    if (resolution == null || resolution === "") { resolution = defaultResolution}

    console.log("### a POST request on /download");
    console.log(`i extracted req.body... : ${videoUrl} ${resolution}`);

    //answer POST request
    if (!videoUrl) {
        return res.status(400).json({ok:false, message:'url required'});
    }
    res.status(200).json({ok:true, message:"download has started"});

    //make up args for yt-dlp
    //yt-dlp -f "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4][height<=1080]"
    //  --merge-output-format mp4 -o "/path/to/your/directory/filename.mp4" <video_url>

    //"/path/to/your/folder/%(title)s.%(ext)s"  (default name)
    const ytDlpArgs = ['-f',
        `bestvideo[ext=mp4][height<=${resolution}]+bestaudio[ext=m4a]/best[ext=mp4][height<=${resolution}]`,
        "--merge-output-format",
        "mp4",
        "-o",
        path.join(__dirname, "downloads","%(title)s.%(ext)s"),   //possible error fix: `"${filePath}"`
        videoUrl];
    console.log("the joined path :" + ytDlpArgs[5]);
    console.log("now i log the prepared Args: " + ytDlpArgs);

    // Spawn yt-dlp process
    const ytDlpProcess = spawn('yt-dlp', ytDlpArgs);
    console.log('>>> now i have spawned yt-dlp subprocess!');

    // Track real-time download progress
    ytDlpProcess.stdout.on('data', (data) => {

        const output = data.toString();
        console.log("\n" + output);
        const progressFloat = outputToFloat(output);


        status = "downloading";
        progressLog = output;
        if (progressFloat) {
            //set the global var progress to value
            progress = progressFloat;
        } else {
            progress = NaN;
        }
    });


    ytDlpProcess.on('close', (code) => {
        if (code === 0) {
            console.log('>>> Download completed successfully.');
            status = 'finished';
        } else {
            console.error(`>>> yt-dlp exited with code ${code}`);
            status = 'none';
        }
    });
});

/**
 * Function to parse yt-dlp output and extract progress.
 * @param {string} output
 */
function outputToFloat(output) {
    // Example of yt-dlp progress output:
    // [download]   3.7% of ~247.43MiB at  1.15MiB/s ETA 03:29
    const progressRegex = /\[download\]\s+([\d.]+)%/;
    const match = output.match(progressRegex);

    if (match) {
        return parseFloat(match[1])
    }
    return null;
}

// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


