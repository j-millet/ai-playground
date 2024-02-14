<script>
	import * as tf from '@tensorflow/tfjs';

	export let name;
	export let canvas;
	
	let drawing = false;
	let ctx = null;

	let label = 0;
	let perc = 0.0;

	let map = ['marker', 'matches', 'megaphone', 'mermaid', 'microphone', 'microwave', 'monkey', 'moon', 'mosquito', 'motorbike'];
	$: display_text = `${map[label]} - ${Math.round(perc*10000)/100}%`;
	
	async function loadModelFromSource(){
		const model = await tf.loadLayersModel('https://raw.githubusercontent.com/j-millet/ai-playground/master/doodle-detection/models/tfjs-models/model.json');
		return model;
	}
	
	const model = loadModelFromSource();

	async function predictWithModel(){
		if(ctx == null){
			setCanvasCTX();
		}
		const imdata = ctx.getImageData(0,0,canvas.width,canvas.height).data;
		let matrix = [];
		let currRow = [];
		for(let i = 0; i <= 96*96; i += 1){
			if(i%96 == 0 && i > 0){
				console.log("yea");
				matrix.push(currRow);
				currRow = [];
			}
			currRow.push([parseFloat(imdata[i*4+3])/255.0]);
		}
		const tensor = tf.tensor([matrix]);
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
		canvas.width = 96;
		canvas.height = 96;
		ctx = canvas.getContext("2d");
		ctx.fillStyle = "black";
	}

	function updateCoordinates(event) {
    	if (drawing) {
      		const { clientX, clientY } = event;
			var rect = canvas.getBoundingClientRect();
			if(ctx == null){
				setCanvasCTX();
			}
			
			const x_draw = (clientX-rect.left)*96/(rect.right-rect.left);
			const y_draw = (clientY-rect.top)*96/(rect.bottom-rect.top);
			ctx.fillRect(x_draw,y_draw,2,2);
			const imdata = ctx.getImageData(0,0,96,96);
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
		console.log("AAAAAAA")
	}
	function endDraw(){
		if (!drawing){return;}
		drawing = false;
		predictWithModel()
	}
</script>

<main>
	
	<h2 style="color: rgb({255-perc*255},{perc*255},10)">{display_text}</h2>
	<canvas on:mousedown={startDraw} on:mouseup={endDraw} on:mouseout={endDraw} on:blur={endDraw} on:mousemove={updateCoordinates} bind:this={canvas}></canvas>
	<div><button on:click={clearCanvas}>CLEAR</button></div>
	<p>'marker', 'matches', 'megaphone', 'mermaid', 'microphone', 'microwave', 'monkey', 'moon', 'mosquito', 'motorbike'</p>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
		background-color: rgb(26, 34, 34);
	}

	canvas{
		width: 600px;
		height: 600px;
	}

	:global(body){
		background-color: rgb(26, 34, 34);
	}

	p{
		color:aliceblue;
	}

	h1 {
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