var audioContext = new AudioContext();

console.log("audio is starting up ...");

var BUFF_SIZE = 16384;

var audioInput = null,
    microphone_stream = null,
    gain_node = null,
    script_processor_node = null,
    script_processor_fft_node = null,
    analyserNode = null,
	streamOriginal=null,
	mediaRecorder=null;

function terminarGrabacion(){

	mediaRecorder.stop();
	streamOriginal.stop();
	
}	
var video = document.querySelector('video');

function iniciarGrabacion(){

	if (!navigator.getUserMedia)
			navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
						  navigator.mozGetUserMedia || navigator.msGetUserMedia;

	if (navigator.getUserMedia){

		navigator.getUserMedia({audio:true/*, video:true*/}, 
		  function(stream) {
		  
				//video.src = window.URL.createObjectURL(stream);
				start_microphone(stream);
				streamOriginal = stream;


				mediaRecorder = new MediaRecorder(stream);
				mediaRecorder.ondataavailable = function(e) {
					console.log("data available after MediaRecorder.stop() called.");

					var audio = document.querySelector('#audiograbado');
					audio.setAttribute('controls', '');
					var audioURL = window.URL.createObjectURL(e.data);
					audio.src = audioURL;
					
					
					var reader = new window.FileReader();
					reader.readAsDataURL(e.data); 
					reader.onloadend = function() {
						base64data = reader.result;                
						console.log(base64data );
						$("#algo").text(base64data);
					}
					
				}
				mediaRecorder.start();
	  

    
			  
			  
      	 visualize();
		  },
		  function(e) {
			alert('Error capturing audio.');
		  }
		);

	} else { alert('getUserMedia not supported in this browser.'); };
}

function show_some_data(given_typed_array, num_row_to_display, label) {

    var size_buffer = given_typed_array.length;
    var index = 0;
    var max_index = num_row_to_display;

	
	
	graficar = false;
    for (; index < max_index && index < size_buffer; index += 1) {

        if (given_typed_array[index]!=0){
			graficar = true;
			break;
		}
    }

	if(graficar){
		console.log("__________ " + label);
		for (; index < max_index && index < size_buffer; index += 1) {

			console.log(given_typed_array[index]);
		}
	}
}

function process_microphone_buffer(event) {  // PCM audio data in time domain

    var i, N, inp, microphone_output_buffer;

    microphone_output_buffer = event.inputBuffer.getChannelData(0); // just mono - 1 channel for now

    show_some_data(microphone_output_buffer, 5, "from getChannelData");
}

function start_microphone(stream){

  gain_node = audioContext.createGain();
  gain_node.connect( audioContext.destination );

  microphone_stream = audioContext.createMediaStreamSource(stream);
  microphone_stream.connect(gain_node); // comment out to disconnect output speakers
                                        // ... everything else will work OK this
                                        // eliminates possibility of feedback squealing
                                        // or leave it in and turn down the volume

  script_processor_node = audioContext.createScriptProcessor(BUFF_SIZE, 1, 1);
  script_processor_node.onaudioprocess = process_microphone_buffer; // callback

  microphone_stream.connect(script_processor_node); 

  // --- setup FFT

  script_processor_fft_node = audioContext.createScriptProcessor(2048, 1, 1);
  script_processor_fft_node.connect(gain_node);

  analyserNode = audioContext.createAnalyser();
  analyserNode.smoothingTimeConstant = 0;
  analyserNode.fftSize = 2048;

  microphone_stream.connect(analyserNode);

  analyserNode.connect(script_processor_fft_node);

  script_processor_fft_node.onaudioprocess = function() { // FFT in frequency domain

    // get the average for the first channel
    var fft_array = new Uint8Array(analyserNode.frequencyBinCount);
    analyserNode.getByteFrequencyData(fft_array);

    // draw the spectrogram
    if (microphone_stream.playbackState == microphone_stream.PLAYING_STATE) {

        show_some_data(fft_array, 5, "from fft");
    }
  }
}




var canvas = document.querySelector('.visualizer');
var canvasCtx = canvas.getContext("2d");




function visualize() {
  WIDTH = canvas.width;
  HEIGHT = canvas.height;

analyser=analyserNode;
//var visualSetting = visualSelect.value;
  //console.log(visualSetting);

  //if(visualSetting == "sinewave") {
    analyser.fftSize = 2048;
    var bufferLength = analyser.fftSize;
    console.log(bufferLength);
    var dataArray = new Uint8Array(bufferLength);

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    function draw() {

      drawVisual = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      canvasCtx.fillStyle = 'rgb(200, 200, 200)';
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

      canvasCtx.beginPath();

      var sliceWidth = WIDTH * 1.0 / bufferLength;
      var x = 0;

      for(var i = 0; i < bufferLength; i++) {
   
        var v = dataArray[i] / 128.0;
        var y = v * HEIGHT/2;

        if(i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height/2);
      canvasCtx.stroke();
    };

    draw();
/*
  } else if(visualSetting == "frequencybars") {
    analyser.fftSize = 256;
    var bufferLength = analyser.frequencyBinCount;
    console.log(bufferLength);
    var dataArray = new Uint8Array(bufferLength);

    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

    function draw() {
      drawVisual = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      canvasCtx.fillStyle = 'rgb(0, 0, 0)';
      canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      var barWidth = (WIDTH / bufferLength) * 2.5;
      var barHeight;
      var x = 0;

      for(var i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];

        canvasCtx.fillStyle = 'rgb(' + (barHeight+100) + ',50,50)';
        canvasCtx.fillRect(x,HEIGHT-barHeight/2,barWidth,barHeight/2);

        x += barWidth + 1;
      }
    };

    draw();

  } else if(visualSetting == "off") {
    canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
    canvasCtx.fillStyle = "red";
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
  }
  
  */

}