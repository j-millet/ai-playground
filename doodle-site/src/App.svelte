<script>
	import * as tf from '@tensorflow/tfjs';
	import * as utils from './utils.js';
	import * as imageUtils from './imageUtils.js';

	const MODEL_IMAGE_WIDTH = 64;
	const MODEL_IMAGE_HEIGHT = 64;
	const MODEL_IMAGE_CHANNELS = 1;
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
	const secondsToDraw = 20;
	let guesses = []


	const showcaseDrawingSpeed = 500;

	let map = [
    	'an apple', 'an arm', 'an asparagus', 'an axe', 'a backpack', 'a banana', 'a bandage', 'a barn', 'a baseball bat', 'a baseball',
    	'a bench', 'a bicycle', 'binoculars', 'a bird', 'a birthday cake', 'a blackberry', 'a blueberry', 'a book', 'a boomerang', 'a bottlecap',
    	'a bush', 'a butterfly', 'a cactus', 'a cake', 'a calculator', 'a calendar', 'a camel', 'a camera', 'camouflage', 'a campfire',
    	'a chair', 'a chandelier', 'a church', 'a circle', 'a clarinet', 'a clock', 'a cloud', 'a coffee cup', 'a compass', 'a computer',
    	'a diamond', 'a dishwasher', 'a diving board', 'a dog', 'a dolphin', 'a donut', 'a door', 'a dragon', 'a dresser', 'a drill',
    	'a harp', 'a hat', 'headphones', 'a hedgehog', 'a helicopter', 'a helmet', 'a hexagon', 'a hockey puck', 'a hockey stick', 'a horse',
    	'a hospital', 'a hot air balloon', 'a hot dog', 'a hot tub', 'an hourglass', 'a house plant', 'a house', 'a hurricane', 'an ice cream', 'a jacket',
    	'a paper clip', 'a parachute', 'a parrot', 'a passport', 'a peanut', 'a pear', 'peas', 'a pencil', 'a penguin', 'a piano',
    	'a popsicle', 'a postcard', 'a potato', 'a power outlet', 'a purse', 'a rabbit', 'a raccoon', 'a radio', 'rain', 'a rainbow',
    	'a trombone', 'a truck', 'a trumpet', 'an umbrella', 'underwear', 'a van', 'a vase', 'a violin', 'a washing machine', 'a watermelon'
		];	

	$: displayText = utils.descriptionText(label,perc,map);

	$: assignmentText = `Try to draw ${map[wantedLabel]}`;
	$: timerText = `${Math.round(secondsLeft)}s left...`;

		
	

	async function loadModelFromSource(){
    	const model = await tf.loadLayersModel('https://raw.githubusercontent.com/j-millet/doodle-fun/master/doodle-detection/models/tfjs-models/100obj-v3/model.json');
    	return model;
	}
	
	const model = loadModelFromSource();
	
	async function init(modelPromise){
		await modelPromise.then(function (res){
			tf.tidy(() => {
				const pred = res.predict(tf.zeros([1,MODEL_IMAGE_WIDTH,MODEL_IMAGE_HEIGHT,MODEL_IMAGE_CHANNELS])); //initial prediction of a zero tensor to cache the model weights
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
			await delay(delayMS);
		}
	}

	async function getScaledImageDataOfContent(x_points,y_points,width,height,padPx=2){
    	let scaled = imageUtils.scaledPoints(x_points,y_points,width,height,padPx);
		
    	dummyCanvas.width = width;
    	dummyCanvas.height = height;
    	await drawOnCanvas(dummyCanvas,scaled.x,scaled.y);

    	const imdata = dummyCanvas.getContext("2d").getImageData(0,0,dummyCanvas.width,dummyCanvas.height);
    	return imdata;
	}

	async function predictWithModel(){
		const imdata = await getScaledImageDataOfContent(x_points,y_points,MODEL_IMAGE_WIDTH,MODEL_IMAGE_HEIGHT,imageMatrixPadPX)

		const tensor = tf.tensor([imageUtils.imageDataToNormalizedImageMatrix(imdata)]); // put matrix into another array, because batches
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
			secondsLeft = secondsToDraw;
			let guessed = false;
			while (secondsLeft>0)
			{
				if (label == wantedLabel && perc > 0.65){
					correct += 1;
					guessed = true;
					guesses = [...guesses,{"points":imageUtils.scaledPoints(x_points,y_points,MODEL_IMAGE_WIDTH,MODEL_IMAGE_HEIGHT,imageMatrixPadPX),"label":l,"guessed":guessed}];
					await delay(4000);
					break;
				}
				await delay(100);
				secondsLeft -= 0.1;
			}
			if(!guessed){
				guesses = [...guesses,{"points":imageUtils.scaledPoints(x_points,y_points,MODEL_IMAGE_WIDTH,MODEL_IMAGE_HEIGHT,imageMatrixPadPX),"label":l,"guessed":guessed}];
			}
		}
		clearCanvas();
		gameState = 2;
	}

	function setCanvasCTX(){
		var rect = canvas.getBoundingClientRect();
		canvas.width = rect.right-rect.left;
		canvas.height = rect.bottom-rect.top;
		ctx = canvas.getContext("2d");
		ctx.fillStyle = "graphite";
		ctx.strokeStyle= "graphite";
		ctx.lineWidth = Math.min(canvas.width,canvas.height) * 1/100;
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
		perc=0.0;
	}

	function handleCanvasClick(event){
		if(event.buttons == 1 && gameState == 1){
			startDraw();
		}
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

	const handleShowcaseCanvas = (canvas,points) =>{
		canvas.height = MODEL_IMAGE_HEIGHT;
		canvas.width = MODEL_IMAGE_WIDTH;
		drawOnCanvas(canvas,points.x,points.y,parseInt(1000/showcaseDrawingSpeed));
	}
	
</script>
<svelte:head>
	<title>Doodles :)</title>
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Cabin+Sketch:wght@400;700&display=swap" rel="stylesheet">
</svelte:head>
<main>
	<canvas id = "dummy-canvas" bind:this={dummyCanvas}></canvas>
	{#await init(model)}
	<p>Loading model...</p>
	{:then value}
	<div id="top-controls">
		
		{#if gameState == 1}
		<div id="top-text">
			<div><h2>{assignmentText}</h2></div>
			<div><p>{timerText}</p></div>
		</div>
		<div id="button-div"><button on:click={clearCanvas}><h1>CLEAR</h1></button></div>
		{:else}
		<div></div>
		{/if}
		
	</div>
	<canvas id="drawing-canvas" on:resize={clearCanvas} on:mousedown={handleCanvasClick} on:mouseup={endDraw} on:mouseout={endDraw} on:blur={endDraw} on:mousemove={updateCoordinates} bind:this={canvas}></canvas>
	<div id="controls">
		<h2 style="color: rgb({255-perc*255},{perc*255},10)">{displayText}</h2>
	</div>

	{#if gameState == 2}
	<div id="summary">
		<h2>The AI guessed {correct}/{imagesToDraw} of your drawings!</h2>
		<div id="drawings-showcase-container">
			{#each guesses as guess}
			<div class="drawings-showcase-single">
				<canvas use:handleShowcaseCanvas={guess.points} style="background-color:aliceblue;"></canvas>
				<p style="color:{guess.guessed? "green":"red"}">{map[guess.label]} {guess.guessed? "✓":"✗"}</p>
			</div>	
			{/each}
		</div>
		<div><button on:click={mainLoop}><h1>Play Again</h1></button></div>
	</div>
	{/if}
	{/await}
</main>

<style>
	
	main {
		display: contents;
		text-align: center;
		padding:0px;
		max-width: 240px;
		margin: 0;
		background-color: rgb(26, 34, 34);
		overflow: hidden;
		font-family: "Cabin Sketch", sans-serif;
	}
	#summary{
		position: fixed;
		top: 50%;
  		left: 50%;

		max-width: 40%;
		min-width: 40%;
		max-height: 90%;
		min-height: 90%;

		background-color: bisque;
		border: 0.5rem outset grey;
		border-radius: 2rem;

		transform: translate(-50%, -50%);

		display: flex;
		flex-direction: column;
		justify-content: space-around;
		align-items: center;
		
		
	}
	#summary p{
		text-transform: capitalize;
	}

	#summary h2{
		font-size: 2rem;
	}

	button{
    	background:none;
    	border:none;
    	margin:0;
    	padding:0;
    	cursor: pointer;
	}
	#top-controls{
    	display: flex;
    	flex-direction: row;
		justify-content: center;
    	align-items: center;    
    	position: absolute;
    	max-width: 100%;
    	min-width: 100%;
    	max-height: 10%;
    	min-height: 10%;
	}

	#button-div{
		max-width: 6%;
		min-width: 6%;
		
	}

	#top-text{
		flex:1;
		padding-left: 6%;
	}
	#controls{
    	position: absolute;	

		display: flex;
    	flex-direction: row;
    	justify-content: center;
    	align-items: center;
    	transform: translate(0%,-100%);
    	max-width: 100%;
    	min-width: 100%;
    	max-height: 10%;
    	min-height: 10%;
	}
	#drawing-canvas{
		width: 100%;
		height: 100%;
		background-color:rgb(255, 248, 240);
		
	}
	#dummy-canvas{
		display: none;
	}

	#drawings-showcase-container{
		display: flex;
		flex-direction: row;
		flex-wrap: wrap;
		width: 80%;
	}

	
	.drawings-showcase-single{
		max-width: 50%;
 		min-width: 50%;
		
	}
	.drawings-showcase-single canvas{
		width: 40%;
		border-radius: 1rem;
		border: 0.5rem solid aliceblue;
	}
	:global(body){
		background-color: rgb(26, 34, 34);
		display: contents;
		
	}

	p{
		color:rgb(30,30,30);
		font-family: sans-serif;
	}

	h2 {
		text-transform: uppercase;
		font-size: 3em;
		font-weight: 200;
		color:rgb(30,30,30);
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>