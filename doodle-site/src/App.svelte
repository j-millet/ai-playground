<script>
	
	import * as tf from '@tensorflow/tfjs';

	export let name;
	export let thing = 230;
	let drawing = false;
	function startDraw(){
		drawing = true;
		console.log("AAAAAAA")
	}
	function endDraw(){
		if (!drawing){return;}
		console.log("BBBBBB")
	}
	function doThing(){
		thing = (thing+10)%256;
	}
</script>

<main>
	<h1 style="color: rgb({thing},10,10)">Hello {name}!</h1>
	<p>Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p>
	<canvas on:mousedown={startDraw} on:mouseup={endDraw} on:mouseout={endDraw} on:blur={endDraw}></canvas>
	<div><button on:click={doThing}>MOAR REDDER</button></div>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
		background-color: rgb(26, 34, 34);
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