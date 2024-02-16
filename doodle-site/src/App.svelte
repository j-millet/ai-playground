<script>
	import * as tf from '@tensorflow/tfjs';

	export let canvas;
	export let dummyCanvas;
	
	let drawing = false;
	let ctx = null;

	let label = 0;
	let perc = 0.0;

	let last_x = null;
	let last_y = null;

	let map = ['a marker', 'matches', 'a megaphone', 'a mermaid', 'a microphone', 'a microwave', 'a monkey', 'the moon', 'a mosquito', 'a motorbike','a hospital', 'a hot air balloon', 'a hot dog', 'a hot tub', 'an hourglass', 'a house plant', 'a house', 'a hurricane', 'some ice cream', 'a jacket'];
	$: display_text = descriptionText(label,perc,map);
	
	function descriptionText(label,perc,map){
		if (perc == 0){
			return "Start drawing!";
		}
		else if(perc < 0.2){
			return "I'm not quite sure what I'm looking at...";
		}
		else if(perc < 0.4){
			return `This might be ${map[label]}`;
		}
		else if(perc <= 0.6){
			return `I think it's ${map[label]}`;
		}
		else if(perc <= 0.8){
			return `I'm pretty sure it's ${map[label]}`;
		}
		else if(perc <= 1){
			return `This must be ${map[label]}`;
		}
		return "";
	}

	async function loadModelFromSource(){
		const model = await tf.loadLayersModel('https://raw.githubusercontent.com/j-millet/ai-playground/master/doodle-detection/models/tfjs-models/20obj/model.json');
		return model;
	}
	
	const model = loadModelFromSource();

	function getMatrixFromImageData(imdata){
		let matrix = [];
		let currRow = [];
		for(let i = 0; i <= imdata.height*imdata.width; i += 1){
			if(i%imdata.width == 0 && i > 0){
				matrix.push(currRow);
				currRow = [];
			}
			currRow.push(parseFloat(imdata.data[i*4+3]));
		}
		return matrix;
	}

	function getImageBounds(imageMatrix2D,pad){
		let top = imageMatrix2D.length;
		let bottom = 0;
		let right = 0;
		let left = imageMatrix2D[0].length;

		for(let i = 0; i <imageMatrix2D.length; i++){
			for (let j = 0; j <imageMatrix2D[0].length; j++){
				if(imageMatrix2D[i][j] > 0){
					top = Math.min(top,i);
					bottom = Math.max(bottom,i);
					left = Math.min(left,j);
					right = Math.max(right,j);
				}
			}
		}
		return {
			"top":Math.max(0,top-pad),
			"bottom":Math.min(imageMatrix2D.length,bottom+pad),
			"left":Math.max(0,left-pad),
			"right":Math.min(imageMatrix2D[0].length,right+pad)
			}
	}

	function getScaledImageDataOfContent(){
		//this is an abomination but it works somehow lol
		if(ctx == null){
			setCanvasCTX();
		}
		
		const snapshot = ctx.getImageData(0,0,canvas.width,canvas.height);

		let canvasMatrix = getMatrixFromImageData(snapshot);
		let bounds = getImageBounds(canvasMatrix,5);

		let rectSize = Math.max(bounds.bottom-bounds.top,bounds.right-bounds.left);

		const imageContent = ctx.getImageData(bounds.left,bounds.top,rectSize,rectSize);
		
		dummyCanvas.width = rectSize;
		dummyCanvas.height = rectSize;

		const dctx = dummyCanvas.getContext("2d");

		dctx.putImageData(imageContent,0,0);
		
		let scale_x = 96/rectSize;
		let scale_y = 96/rectSize;

		ctx.scale(scale_x,scale_y);
		ctx.drawImage(dummyCanvas,0,0);

		const imdata = ctx.getImageData(0,0,96,96);

		ctx.scale(1/scale_x,1/scale_y);
		ctx.putImageData(snapshot,0,0);
		return imdata;
	}
	async function predictWithModel(){
		
		const imdata = getScaledImageDataOfContent();

		let matrix = [];
		let currRow = [];
		for(let i = 0; i <= imdata.height*imdata.width; i += 1){
			if(i%imdata.width == 0 && i > 0){
				matrix.push(currRow);
				currRow = [];
			}
			currRow.push([parseFloat(imdata.data[i*4+3])/255]);
		}

		const tensor = tf.tensor([matrix]); // put matrix into another array, because batches
		model.then(function (res){
			const pred = tf.tidy(() => {
				return res.predict(tensor).dataSync();
			});
			label = pred.indexOf(Math.max(...pred));
			perc = pred[label];
		}, function(err){
			console.log(err);
		});
	}

	function setCanvasCTX(){
		var rect = canvas.getBoundingClientRect();
		canvas.width = rect.right-rect.left;
		canvas.height = rect.bottom-rect.top;
		ctx = canvas.getContext("2d");
		ctx.fillStyle = "black";
		ctx.strokeStyle= "black";
		ctx.lineWidth = canvas.width * 2/96;
	}

	function updateCoordinates(event) {
    	if (drawing) {
      		const { clientX, clientY } = event;
			var rect = canvas.getBoundingClientRect();
			if(ctx == null){
				setCanvasCTX();
			}
			
			const x_draw = (clientX-rect.left)*canvas.width/(rect.right-rect.left);
			const y_draw = (clientY-rect.top)*canvas.height/(rect.bottom-rect.top);

			if (last_x == null){
				last_x = x_draw;
			}
			if (last_y == null){
				last_y = y_draw;
			}
			ctx.beginPath();
			ctx.moveTo(last_x,last_y);
			ctx.lineTo(x_draw,y_draw);
			ctx.lineCap = 'round';
			ctx.stroke();
			
			last_y = y_draw;
			last_x = x_draw;
    	}
		
  	}

	function clearCanvas(){
		if(ctx == null){
			setCanvasCTX();
		}
		ctx.clearRect(0,0,canvas.width,canvas.height);
	}


	function startDraw(){
		drawing = true;
	}
	function endDraw(){
		if (!drawing){return;}
		drawing = false;
		last_x = null;
		last_y = null;
		predictWithModel()
	}
</script>

<main>
	<div style="max-width: 60%;min-width: 60%">
		<div><button on:click={clearCanvas}>CLEAR</button></div>
		<canvas on:mousedown={startDraw} on:mouseup={endDraw} on:mouseout={endDraw} on:blur={endDraw} on:mousemove={updateCoordinates} bind:this={canvas}></canvas>
		<canvas style="display:none;" bind:this={dummyCanvas}></canvas>
		<h2 style="color: rgb({255-perc*255},{perc*255},10)">{display_text}</h2>
	</div>
	<div style="max-width: 40%; min-width: 40%">
		<p>'marker', 'matches', 'megaphone', 'mermaid', 'microphone', 'microwave', 'monkey', 'moon', 'mosquito', 'motorbike','hospital', 'hot_air_balloon', 'hot_dog', 'hot_tub', 'hourglass', 'house_plant', 'house', 'hurricane', 'ice_cream', 'jacket'</p>
	</div>
</main>

<style>
	main {
		display: flex;
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
		background-color: rgb(26, 34, 34);
	}

	canvas{
		width: 30vw;
		height: 30vw;
	}

	:global(body){
		background-color: rgb(26, 34, 34);
	}

	p{
		color:aliceblue;
	}

	h2 {
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}

	canvas{
		background-color: white;
		border: solid #ff3e00 3px;
		border-radius: 10px;
	}
</style>