
//script to run on browser

//globals
let lastStatus;
let statusBar = document.querySelector('#status-bar');

//run whole script after load completed
document.addEventListener('DOMContentLoaded', function() {

    document.getElementById('start-download').addEventListener('click', async function () {

        const url = document.getElementById('video-url').value;
        const resolution = document.querySelector('.resolution-group input:checked').value;

        console.log(`i got url and resolution from document: ${url} ${resolution}`);

        const response = await fetch('/download',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({url, resolution}) } )

        const data = await response.json();

        console.log('the returned data: ' + data);

        if (data.ok === true) {alert(data.message)}
        else {alert(`Error: ${data.message}`)}
    });

});

//should be used with interval
async function updateStatus() {
    const response = await fetch('/status');
    const data = await response.json();
    const {status, progress, progressLog} = data;

    //to prevent overhead of useless updates
    if (status !== lastStatus) {
        lastStatus = status;
        if (status === 'downloading') {
            statusBar.innerHTML = 'is downloading...';
            updateProgress(progress)
        } else if (status === 'none') {
            statusBar.innerHTML = 'ready to download!';
        } else if (status === 'finished') {
            statusBar.innerHTML = 'download finished successfully!';
        } else{
            statusBar.innerHTML = 'invalid status: ' + status;
        }
    }


}

//arg: progress: a float bet. 0.0 and 1
function updateProgress(progress) {
//todo
}
