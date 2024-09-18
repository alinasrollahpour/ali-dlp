//node.js app to run in background

//yt-dlp -f "bestvideo[ext=mp4][height<=1080]+bestaudio[ext=m4a]/best[ext=mp4][height<=1080]"
//  --merge-output-format mp4 -o "/path/to/your/directory/filename.mp4" <video_url>

//api doc:
//  POST:
//  {
//      url: "example yt url",
//      file: "/path/to/file.mp4",
//      resolution: "1080"
//  }

const { spawn } = require('child_process');
const express = require('express');

const app = express();
const port = 3000;

app.use(express.json());

/**
 * POST route to start video download
 * Expects: { url: string, resolution: string }
 */
app.post('/download', (req, res) => {
    const videoUrl = req.body.url;
    const resolution = req.body.resolution || 'best';  // Fallback to 'best' resolution if not provided

    if (!videoUrl) {
        return res.status(400).send('URL is required');
    }

    const ytDlpArgs = ['-f', resolution, videoUrl];

    // Spawn yt-dlp process
    const ytDlpProcess = spawn('yt-dlp', ytDlpArgs);

    // Track real-time download progress
    ytDlpProcess.stderr.on('data', (data) => {
        const output = data.toString();
        const progressData = parseYtDlpOutput(output);

        if (progressData) {
            console.log(`Progress: ${progressData.progress}`);
            // Here you can emit progress to a frontend via WebSocket or similar
        }
    });

    ytDlpProcess.on('close', (code) => {
        if (code === 0) {
            console.log('Download completed successfully.');
            res.send('Download completed');
        } else {
            console.error(`yt-dlp exited with code ${code}`);
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


