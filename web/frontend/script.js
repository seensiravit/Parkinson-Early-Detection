const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
let drawing = false; 
const is_fill_bg = false;

if(is_fill_bg){
    fill_background();
}

canvas.addEventListener('mousedown', () => { drawing = true; });
canvas.addEventListener('mouseup', () => { drawing = false; ctx.beginPath(); });
canvas.addEventListener('mousemove', draw);

canvas.addEventListener('touchstart', () => { drawing = true; });
canvas.addEventListener('touchend', () => { drawing = false; ctx.beginPath(); });
canvas.addEventListener('touchmove', draw);

function draw(event) {
    if (!drawing) return;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';

    ctx.lineTo(event.offsetX, event.offsetY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(event.offsetX, event.offsetY);
}

function fill_background() {
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

document.getElementById('clearButton').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if(is_fill_bg) fill_background();
    document.getElementById('previewImage').src = 'white.jpg';
    document.getElementById('result').innerText = ''; 
    document.getElementById('details').innerText = '';
    document.getElementById('previewImage2').src = 'white.jpg';
});

function display_image() {
    if(canvas.getContext) {
        var myImage = canvas.toDataURL("myImage/jpg");
    }

    console.log(typeof(myImage) , myImage);


    document.getElementById('previewImage2').src = myImage;
}

document.getElementById('seecanvas').addEventListener('click' , () => {
    display_image();
})

async function predictImage(imageBlob) {
    // console.log('image blob: ' , imageBlob)

    const url = 'http://127.0.0.1:8000/predict/';

    const formData = new FormData();
    formData.append('file', imageBlob);

    console.log(...formData)

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Accept': 'application/json'
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
    }
}

document.getElementById('predictButton').addEventListener('click', () => {
    canvas.toBlob(async (blob) => {
        if(true){
            const previewImage = document.getElementById('previewImage')
            const url = URL.createObjectURL(blob);

            previewImage.onload = () => {
                // no longer need to read the blob so it's revoked
                URL.revokeObjectURL(url);
            };

            previewImage.src = url;

            display_image();
        }
        

        // console.log('blob:' , blob);

        const result = await predictImage(blob);
        console.log('result: ' , result);

        const predicted_class = result[0];
        const prob_healthy = result[1];
        const prob_pk = result[2];

        document.getElementById('result').innerText = `Prediction result: ${(predicted_class == 1) ? "Patient" : "Healthy"}`;
        document.getElementById('details').innerText = `Healthy: ${prob_healthy}\nPatient: ${prob_pk}`;
    
        if(predicted_class == 0){
            document.getElementById("output_text").style.color = "green";
            
            const header_elem = document.getElementsByTagName('header')
            console.log(header_elem)
            for(elem of header_elem){
                elem.style.backgroundColor = 'green'
            }
        }else{
            document.getElementById("output_text").style.color = 'red';
            
            const header_elem = document.getElementsByTagName('header')
            
            for(elem of header_elem){
                elem.style.backgroundColor = '#B31B1B'
            }
        }
    },'image/jpg');

});

document.getElementById('saveButton').addEventListener('click', () => {
    canvas.toBlob(async (blob) => {
        console.log(blob);

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'drawing.jpg'; // Set the download file name
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link); // Clean up

        const result = await predictImage(blob);
    },'image/jpg');
});