
//script to run on browser

//globals


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



    updateProgress(progress)
}

function updateProgress() {

}
