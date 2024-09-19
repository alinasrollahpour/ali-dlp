//node.js app to run in background

//yt-dlp -f "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4][height<=1080]" --merge-output-format mp4 -o "/path/to/your/directory/filename.mp4" <video_url>

//api doc:
//  POST:
//  {
//      url: "example yt url",
//      file: "/path/to/file.mp4",
//      resolution: "1080"
//  }

// const { spawn } = require('child_process');
// const express = require('express');

import {spawn} from 'child_process';
import express from 'express';
import open from 'open';
import path from 'path';
import dialog from 'node-file-dialog';
const {saveFileDialog} = dialog;

const app = express();
const __filename = import.meta.filename;
const __dirname = path.dirname(__filename);
const port = 8086;
const defaultResolution = "1080";

open(`http://localhost:${port}`).then(
    () => console.log(`I tried to open on port ${port}`),
);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());


app.get('/', function (req, res) {
    res.sendFile(path.resolve(__dirname, './index.html'));
})

/**
 * POST route to start video download
 * Expects: { url: string, resolution: string }
 */
app.post('/download', (req, res) => {

    const videoUrl = req.body.url;
    let resolution = req.body.resolution;
    if (resolution == null || resolution === "") { resolution = defaultResolution}

    console.log(`i extracted req.body... : ${videoUrl} ${resolution}`);

    if (!videoUrl) {
        return res.status(400).json({ok:false, message:'url and file are required'});
    }

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
    console.log('now i have spawned yt-dlp subprocess!');

    // Track real-time download progress
    ytDlpProcess.stderr.on('data', (data) => {
        const output = data.toString();
        console.log("i have just logging 'data' :> " + output); //dev temp
        const progressData = parseYtDlpOutput(output);

        if (progressData) {
            console.log(`i log progress based on 'data' event: ${progressData.progress}`);
            // Here you can emit progress to a frontend via WebSocket or similar
        }
    });

    ytDlpProcess.on('close', (code) => {
        if (code === 0) {
            console.log('[ytDlpProcess]Download completed successfully.');
            res.send('[ytDlpProcess]Download completed');
        } else {
            console.error(`[ytDlpProcess] yt-dlp exited with code ${code}`);
            res.status(500).send('Download failed');
        }
    });
});

/**
 * Function to parse yt-dlp output and extract progress.
 * @param {string} output
 */
function parseYtDlpOutput(output) {
    // Example of yt-dlp progress output:
    // [download]   3.7% of ~247.43MiB at  1.15MiB/s ETA 03:29
    const progressRegex = /\[download\]\s+([\d.]+)%/;
    const match = output.match(progressRegex);

    if (match) {
        return {
            progress: match[1] + '%'
        };
    }
    return null;
}

// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


