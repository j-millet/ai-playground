<script>
	import * as tf from '@tensorflow/tfjs';
	import * as utils from './utils.js';

	tf.ENV.set('WEBGL_PACK', false)

	let canvas;
	let dummyCanvas;
	
	let started = false;
	$:{
		if (canvas && !started){
			mainLoop();
			started = true;
		}
	}

	let gameState = 0;

	const delay = ms => new Promise(res => setTimeout(res, ms));
	const imageMatrixPadPX = 3;

	let drawing = false;
	let ctx = null;

	let x_points = [];
	let y_points = [];

	let label = 0;
	let perc = 0.0;

	let wantedLabel = 0;
	let secondsLeft = 0;

	let last_x = null;
	let last_y = null;

	let correct = 0;
	const imagesToDraw = 6;
	let guesses = []


	let map = ['a marker', 'matches', 'a megaphone', 'a mermaid', 'a microphone', 'a microwave', 'a monkey', 'the moon', 'a mosquito', 'a motorbike','a hospital', 'a hot air balloon', 'a hot dog', 'a hot tub', 'an hourglass', 'a house plant', 'a house', 'a hurricane', 'some ice cream', 'a jacket'];
	$: displayText = utils.descriptionText(label,perc,map);

	$: assignmentText = `Try to draw ${map[wantedLabel]}`;
	$: timerText = `${secondsLeft}s left...`;

		
	

	async function loadModelFromSource(){
    	const model = await tf.loadLayersModel('https://raw.githubusercontent.com/j-millet/ai-playground/master/doodle-detection/models/tfjs-models/20obj/model.json');
    	return model;
	}
	
	const model = loadModelFromSource();
	
	async function init(modelPromise){
		await modelPromise.then(function (res){
			tf.tidy(() => {
				const pred = res.predict(tf.zeros([1,96,96,1])); //initial prediction of a zero tensor to cache the model weights
				pred.dataSync();
				pred.dispose();
			});
		}, function(err){
			console.log(err);
		});
		
	}
	async function drawOnCanvas(canvas,x_points,y_points,delayMS=0){
		const dctx = canvas.getContext("2d");

		dctx.lineWidth = 2;
		dctx.strokeStyle= "black";

		for(let i = 0; i < x_points.length-1;i++){
			if (x_points[i+1] == null){
				i+= 2;
				continue;
			}
			if (x_points[i] == null){
				i+= 1;
				continue;
			}
			dctx.beginPath();
			dctx.moveTo(x_points[i],y_points[i]);
			dctx.lineTo(x_points[i+1],y_points[i+1]);
			dctx.lineCap = 'round';
			dctx.stroke();
		}
	}
	async function getScaledImageDataOfContent(x_points,y_points){
		//scale points to 96x96 grid
		let x_points_cpy = [...x_points]
		let y_points_cpy = [...y_points]

		let min_x = Math.min(...x_points.filter(e => {return e!==null}));
		let max_x = Math.max(...x_points.filter(e => {return e!==null})) - min_x;

		let min_y = Math.min(...y_points.filter(e => {return e!==null}));
		let max_y = Math.max(...y_points.filter(e => {return e!==null})) - min_y;
		
		let max_rect = Math.max(max_x,max_y)
		
		for(let i = 0; i < y_points.length;i++){
			x_points_cpy[i] = x_points[i] != null? Math.round(((x_points[i]-min_x)/max_rect) * (96-2*imageMatrixPadPX)+imageMatrixPadPX): null;
			y_points_cpy[i] = y_points[i] != null? Math.round(((y_points[i]-min_y)/max_rect) * (96-2*imageMatrixPadPX)+imageMatrixPadPX): null;
		}
	
    	dummyCanvas.width = 96;
    	dummyCanvas.height = 96;

    	await drawOnCanvas(dummyCanvas,x_points_cpy,y_points_cpy);

    	const imdata = dummyCanvas.getContext("2d").getImageData(0,0,96,96);
    	return imdata;
	}

	async function predictWithModel(){
		const imdata = await getScaledImageDataOfContent(x_points,y_points)
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

	async function mainLoop(){
		gameState = 1;
		let labels = [...Array(map.length).keys()].map(value => ({ value, sort: Math.random() }))
    											.sort((a, b) => a.sort - b.sort)
   												.map(({ value }) => value).slice(0,imagesToDraw)
		correct = 0;
		guesses = []
		for(const l of labels){
			clearCanvas();
			wantedLabel = l;
			secondsLeft = 1;
			while (secondsLeft>0)
			{
				if (label == wantedLabel && perc > 0.65){
					correct += 1;
					secondsLeft = -100;
					guesses = [...guesses,{"imdata":await getScaledImageDataOfContent(x_points,y_points),"label":l,"guessed":true}]
				}
				await delay(1000);
				secondsLeft -= 1;
			}
			if(secondsLeft > -100){
				guesses = [...guesses,{"imdata":await getScaledImageDataOfContent(x_points,y_points),"label":l,"guessed":false}];
			}
		}
		clearCanvas();
		gameState = 2;
		console.log(guesses)
	}

	function setCanvasCTX(){
		var rect = canvas.getBoundingClientRect();
		canvas.width = rect.right-rect.left;
		canvas.height = rect.bottom-rect.top;
		ctx = canvas.getContext("2d");
		ctx.fillStyle = "graphite";
		ctx.strokeStyle= "graphite";
		ctx.lineWidth = Math.min(canvas.width,canvas.height) * 1/96;
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
			
			x_points = [...x_points,x_draw];
			y_points = [...y_points,y_draw];

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
		setCanvasCTX();
		x_points = [];
		y_points = [];
		ctx.clearRect(0,0,canvas.width,canvas.height);
	}

	function startDraw(){
		drawing = true;
	}

	function endDraw(){
		if (!drawing){return;}
		if (x_points.at(-1) !== null){
			x_points = [...x_points,null];
			y_points = [...y_points,null];
		}
		drawing = false;
		last_x = null;
		last_y = null;
		predictWithModel()
	}

	const loadImdata = (canvas, imdata) =>{
		canvas.height = 96;
		canvas.width = 96;
		canvas.getContext("2d").putImageData(imdata,0,0);
	}
	
</script>

<main>
	<div id="drawing">
		<h2 style="color: rgb({255-perc*255},{perc*255},10)">{displayText}</h2>
		{#await init(model)}
			<p>Loading...</p>
		{:then value}
			<canvas id="drawing-canvas" on:mousedown={startDraw} on:mouseup={endDraw} on:mouseout={endDraw} on:blur={endDraw} on:mousemove={updateCoordinates} bind:this={canvas}></canvas>
			<div><button on:click={clearCanvas}>CLEAR</button></div>
		{/await}
	</div>
	<div id="controls">
		{#if gameState == 0}
		<p></p>
		{:else if gameState == 1}
		<h2>{assignmentText}</h2>
		<p>{timerText}</p>
		<h2 style="font-size: 3em;">What I see:</h2>
		<canvas id = "dummy-canvas" bind:this={dummyCanvas}></canvas>
		{:else if gameState == 2}

		<p>The ai guessed {correct}/{imagesToDraw} drawings!</p>
		<div id="drawings-showcase-container">
			{#each guesses as guess}
			<div class="drawings-showcase-single">
				<canvas use:loadImdata={guess.imdata} style="background-color:aliceblue;"></canvas>
				<p>{map[guess.label]} - {guess.guessed? "Correct":"Incorrect"}</p>
			</div>	
			{/each}
		</div>
		<button on:click={mainLoop}>Play Again</button>
		{/if}
	</div>
	
</main>

<style>
	main {
		display: flex;
		flex-direction: row;
		text-align: center;
		padding:0px;
		max-width: 240px;
		margin: 0;
		background-color: rgb(26, 34, 34);
	}
	#drawing{
		max-width: 68%;
		min-width: 68%;
	}
	#controls{
		padding: 0.5rem;
		max-width: 30%;
		min-width: 30%;
	}
	#drawing-canvas{
		width: 100%;
		border-radius: 2rem;
		background-image: url('https://wiobyrne.com/wp-content/uploads/2013/03/Natural-Paper-Background-Texture-HD.jpg');
		
	}
	#dummy-canvas{
		width: 288px;
		height: 288px;
		border: 2px solid orange;
		background-image: url('https://wiobyrne.com/wp-content/uploads/2013/03/Natural-Paper-Background-Texture-HD.jpg');
	}

	#drawings-showcase-container{
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
	}
	.drawings-showcase-single{
		max-width: 50%;
 		min-width: 50%;
		
	}
	:global(body){
		background-color: rgb(26, 34, 34);
	}

	p{
		color:aliceblue;
	}

	h2 {
		text-transform: uppercase;
		font-size: 3em;
		font-weight: 100;
		color:aliceblue;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>