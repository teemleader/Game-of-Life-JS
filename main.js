class GameDefaults {
	constructor() {
		this.gameDelay = 400;
		this.renderDelay = 5;
		
		this.zoomWidth = 800;
		this.zoomHeight = 800;
		
		this.gameWidth = 80;
		this.gameHeight = 80;
		
		this.aliveChartWidth = 400;
		this.aliveChartHeight = 200;
	}
}

class ChartAlive {
	constructor(settings) {
		settings = settings || {};
		const gameDefaults = new GameDefaults();
		
		this.canvas = settings.canvas;
		this.ctx = this.canvas.getContext('2d');
		
		this.width = settings.width || gameDefaults.aliveChartWidth;
		this.height = settings.height || gameDefaults.aliveChartHeight;

		this.data = [];
		
		this.maxY = 0;
		
		this.lastAlive = 0;
		this.sameCounter = 0;
	}
	
	restart() {
		this.data = [];
		this.maxY = 0;
	}
	
	update(newData) {
		if (newData == this.lastAlive) {
			this.sameCounter++;
		} else {
			this.sameCounter = 0;
		}
		this.lastAlive = newData;
		
		if (this.sameCounter < 30) {
			if (newData > this.maxY) this.maxY = newData;
		
			this.data.push(newData);
			this.draw();
		}
	}
	
	draw() {
		this.ctx.clearRect(0, 0, this.width, this.height);
		
		this.ctx.strokeStyle = 'red';
		this.ctx.beginPath();
		
		let x = 0;
		const xStep = this.width / this.data.length;
		this.ctx.moveTo(0,this.height);
		
		for (let i in this.data) {
			const value = this.data[i];
			
			const y = this.height - ((value / this.maxY) * this.height);
			this.ctx.lineTo(x,y);
			
			x += xStep;
		}
		
		this.ctx.stroke();
	}
}

class Cells {
	constructor(width, height) {
		const gameDefaults = new GameDefaults();
		
		this.width = width || gameDefaults.gameWidth;
		this.height = height || gameDefaults.gameHeight;
		this.count = width * height;
		
		this.data = new Array(this.count);
		this.clear();
		
		this.flipList = [];
		this.changed = false;
	}
	
	// set every cell to specified value
	clear(value) {
		value = value || 0;
		for (let i = 0; i < this.count; i++) {
			this.data[i] = value;
		}
	}
	
	countAlive() {
		let counter = 0;
		for (let i = 0; i < this.count; i++) {
			if (this.data[i]) counter++;
		}
		return counter;
	}
	
	clearColors(value) {
		value = value || 0;
		for (let i = 0; i < this.count; i++) {
			this.data[i] = value;
		}
	}
	
	flipAt(pos) {
		this.data[pos] = !this.data[pos];
	}
	
	flip(x, y) { 
		const cellPos = y * this.width + x;
		this.data[cellPos] = !this.data[cellPos];
	}
	
	get(x, y) {
		if (x < 0 || y < 0) return 0;
		if (x >= this.width || y >= this.height) return 0;
		
		return this.data[y * this.width + x];
	}
	
	aliveSurrandings(x, y) {
		let aliveCount = 0;
		
		if (this.get(x-1, y-1)) aliveCount++;
		if (this.get(x-1, y  )) aliveCount++;
		if (this.get(x-1, y+1)) aliveCount++;
		if (this.get(x,   y-1)) aliveCount++;
		if (this.get(x,   y+1)) aliveCount++;
		if (this.get(x+1, y-1)) aliveCount++;
		if (this.get(x+1, y  )) aliveCount++;
		if (this.get(x+1, y+1)) aliveCount++;
		
		return aliveCount;
	}
	
	cellNextGeneration(x, y) {
		const cellPos = y * this.width + x;
		const alives = this.aliveSurrandings(x, y);
		
		if (this.get(x, y)) {
			if (alives != 2 && alives != 3) this.flipList.push(cellPos);
		} else if (alives == 3) {
			this.flipList.push(cellPos);
		}
	}
	
	nextGeneration() {
		this.flipList = [];
		
		for (let x = 0; x < this.width; x++) {
			for (let y = 0; y < this.height; y++) {
				this.cellNextGeneration(x, y);
			}
		}
		
		this.changed = this.flipList.length > 0;
		
		for (let i in this.flipList) {
			const pos = this.flipList[i];
			this.flipAt(pos);
			
			const cellAlive = this.data[pos];
			if (cellAlive) {
				this.data[pos] = 2;
			}
		}
	}
	
	save() {
		let stage = "";
		let prev = "";
		let sameCount = 0;
		
		for (let i = 0; i < this.count; i++) {
			if (this.data[i] === true) this.data[i] = 1;
			if (this.data[i] === false) this.data[i] = 0;

			const value = this.data[i] === 0 ? "a" : this.data[i] === 1 ? "b" : this.data[i] === 2 ? "c" : "d";

			const sameAsBefore = prev === value;
			const lastLoop = i === this.count-1;

			if (sameAsBefore) {
				sameCount++;
				
				if (lastLoop) {
					stage += sameCount;
					sameCount = 0;
				}
				
			} else {
				
				if (sameCount > 0) {
					stage += (sameCount + 1);
					sameCount = 0;
				}
				if (!lastLoop) {
					stage += value;
				}
				
			}
			
			prev = value;
			
		}
		
		return stage;
	}
	
	setRange(from, howMany, value) {
		const n = (value === "a") ? 0 : (value === "b") ? 1 : (value === "c") ? 2 : 3;
		
		for (let i = from; i < from + howMany; i++) {
			this.data[i] = n;
		}
	}
	
	load(stage) {
		let prev = "a";
		let number = "";
		
		let pos = 0;
		
		for (let i = 0; i < stage.length; i++) {
			const current = stage[i];
			const aNumber = (current >= '0' && current <= '9');
			const lastLoop = i === stage.length-1;
			
			if (aNumber) {
				number += current;
				
				if (lastLoop) {
					const intNumber = parseInt(number);
					number = "";
					
					this.setRange(--pos, intNumber, prev);
					pos += intNumber;
				}
				
			} else {
				if (number.length > 0) {
					
					const intNumber = parseInt(number);
					number = "";
					
					this.setRange(pos, intNumber, prev);
					pos += intNumber-1;
					
				}
				
				this.setRange(pos, 1, current);
				pos++;
				
				prev = current;
			}
		}
		
	}
	
	loadFromStorage() {
		if (localStorage.hasOwnProperty("gameStage")) {
			this.load(localStorage.getItem("gameStage"));
		}
	}
	
	saveToStorage() {
		localStorage.setItem("gameStage", this.save());
	}
	
}

class Game {
	constructor(settings) {
		settings = settings || {};
		const gameDefaults = new GameDefaults();
		
		// Game variables
		this.gameStarted = false;
		
		this.gameDelay = settings.gameDelay || gameDefaults.gameDelay;
		if (!settings.gameDelay && localStorage.hasOwnProperty("gameDelay")) {
			this.gameDelay = parseInt(localStorage.getItem("gameDelay"));
		}
		this.renderDelay = settings.renderDelay || gameDefaults.renderDelay;
		
		this.zoomWidth = settings.zoomWidth || gameDefaults.zoomWidth;
		this.zoomHeight = settings.zoomHeight || gameDefaults.zoomHeight;
		
		this.gameWidth = settings.gameWidth || gameDefaults.gameWidth;
		this.gameHeight = settings.gameHeight || gameDefaults.gameHeight;
		
		this.initDOM(settings);

		this.cells = new Cells(this.gameWidth, this.gameHeight);
		this.cells.loadFromStorage();

		this.renderInterval = setInterval(this.render.bind(this), this.renderDelay);
	}
	
	initDOM(settings) {
		this.canvas = settings.canvas;
		this.canvasZoom = settings.zoomCanvas;
		
		this.ctx = this.canvas.getContext("2d");
		this.ctxZoom = this.canvasZoom.getContext("2d");
		
		this.ctxZoom.imageSmoothingEnabled = false;
		this.ctxZoom.mozImageSmoothingEnabled = false;
		this.ctxZoom.webkitImageSmoothingEnabled = false;
		this.ctxZoom.msImageSmoothingEnabled = false;
		
		this.mouseDown = false;
		this.mouseOnCell = {x: -1, y:-1};
		
		this.canvasZoom.addEventListener('mousedown', this.onMouseDown.bind(this));
		this.canvasZoom.addEventListener('mouseup', this.onMouseUp.bind(this));
		this.canvasZoom.addEventListener('mousemove', this.onMouseMove.bind(this));
		
		this.speedCounter = settings.speedCounter;
		this.speedCounter.innerHTML = (1000 - this.gameDelay);
	}
	
	addChart(chartCanvas) {
		this.aliveChart = new ChartAlive({canvas: chartCanvas});
	}
	
	// Registers buttons for game purposes
	addButton(type, DOMobj) {
		if (type === "start") {
			this.startButton = DOMobj;
			this.startButton.addEventListener('click', this.startGame.bind(this));
		} else if (type === "stop") {
			this.stopButton = DOMobj;
			this.stopButton.addEventListener('click', this.stopGame.bind(this));
		} else if (type === "speed-") {
			this.speedMinusButton = DOMobj;
			this.speedMinusButton.addEventListener('click', this.speedMinus.bind(this));
		} else if (type === "speed+") {
			this.speedPlusButton = DOMobj;
			this.speedPlusButton.addEventListener('click', this.speedPlus.bind(this));
		} else if (type === "clear") {
			this.clearButton = DOMobj;
			this.clearButton.addEventListener('click', this.clearStage.bind(this));
		}
	}
	
	// Event for CLEAR GAME button
	clearStage() {
		this.cells.clear(0);
		this.cells.saveToStorage();
	}
	
	// Restarts game update interval
	updateGameSpeed() {
		if (this.gameStarted) {
			clearInterval(this.gameInterval);
			this.gameInterval = setInterval(this.gameStep.bind(this), this.gameDelay);
		}
		
		this.speedCounter.innerHTML = (1000 - this.gameDelay);
		localStorage.setItem("gameDelay", this.gameDelay);
	}
	
	// Event for MAKE GAME SLOWER button
	speedMinus() {
		const step = (this.gameDelay < 100) ? 10 : 100;
		
		this.gameDelay += step;
		if (this.gameDelay > 900) this.gameDelay = 900;
		
		this.updateGameSpeed();
	}
	
	// Event for MAKE GAME FASTER button
	speedPlus() {
		const step = (this.gameDelay <= 100) ? 10 : 100;
		
		this.gameDelay -= step;
		if (this.gameDelay < 10) this.gameDelay = 10;
		
		this.updateGameSpeed();
	}
	
	// Helper function - transform mouse position over big canvas to proper cell position
	eventToXY(e) {
		const rect = this.canvasZoom.getBoundingClientRect();
		const x = Math.floor((e.clientX - rect.left) / (this.zoomWidth / this.gameWidth));
		const y = Math.floor((e.clientY - rect.top)  / (this.zoomHeight / this.gameHeight));
		return {x, y};
	}
	
	compareXY(pos1, pos2) {
		return (pos1.x == pos2.x && pos1.y == pos2.y);
	}
	
	// Left mouse button is pressed over big game canvas
	onMouseDown(e) {
		const pos = this.eventToXY(e);
		if (!this.gameStarted) {
			this.mouseDown = true;
			this.mouseOnCell = pos;
			this.cells.flip(pos.x, pos.y);
		}
	}
	
	// Left mouse button is NOT pressed over big game canvas
	onMouseUp(e) {
		const pos = this.eventToXY(e);
		if (!this.gameStarted) {
			this.mouseDown = false;
		}
	}
	
	// Mouse cursor moved over big game canvas
	onMouseMove(e) {
		const pos = this.eventToXY(e);
		if (!this.gameStarted && this.mouseDown) {
			if (!this.compareXY(pos, this.mouseOnCell)) {
				this.mouseOnCell = pos;
				this.cells.flip(pos.x, pos.y);
			}
		}
	}
	
	// Render function for small invisible canvas
	renderFrame() {
		let imgdata = this.ctx.createImageData(this.gameWidth, this.gameHeight);
		for (let i = 0; i < imgdata.data.length / 4; i++) {
			const cellValue = this.cells.data[i];
			const cellColor = (cellValue) ? 0 : 255;  // black if cell is alive, white otherwise
			
			// update cell color on canvas
			imgdata.data[4*i] = (cellValue == 2) ? 255 : cellColor; // red if cellValue == 2 (if cell state changed)
			imgdata.data[4*i+1] = cellColor;
			imgdata.data[4*i+2] = cellColor;
			imgdata.data[4*i+3] = 255;
		}
		this.ctx.putImageData(imgdata, 0, 0);
	}
	
	// Render function for big canvas
	renderZoom() {
		this.ctxZoom.drawImage(this.canvas, 0, 0, this.zoomWidth, this.zoomHeight);
		this.drawGrid();
	}
	
	// Draws grid on big canvas (this.canvasZoom)
	drawGrid() {
		this.ctxZoom.strokeStyle = 'lightgrey';
		this.ctxZoom.beginPath();
		
		const gridWidth = this.zoomWidth / this.gameWidth;
		const gridHeight = this.zoomHeight / this.gameHeight;
		
		// vertical lines
		for (let x = 0; x < this.zoomWidth; x += gridWidth) {
			this.ctxZoom.moveTo(x, 0);
			this.ctxZoom.lineTo(x, this.zoomHeight);
		}
		
		// horizontal lines
		for (let y = 0; y < this.zoomHeight; y += gridHeight) {
			this.ctxZoom.moveTo(0, y);
			this.ctxZoom.lineTo(this.zoomWidth, y);
		}
		
		this.ctxZoom.stroke();
	}
	
	// Main render loop
	// called by this.renderInterval
	render() {
		// draw game image on small invisible canvas
		this.renderFrame();
		// resize game image (make cells way bigger), then draw grid on top
		this.renderZoom();
	}
	
	// Main game loop
	// called by this.gameInterval
	gameStep() {
		this.cells.nextGeneration();
		if (!this.cells.changed) {
			clearInterval(this.gameInterval);
		}
		if (this.aliveChart) {
			this.aliveChart.update(this.cells.countAlive());
		}
	}
	
	// Event for START GAME button
	startGame() {
		if (!this.gameStarted) {
			this.gameStarted = true;
			this.cells.saveToStorage();
			
			this.gameInterval = setInterval(this.gameStep.bind(this), this.gameDelay);
			
			if (this.aliveChart) {
				this.aliveChart.restart();
			}
		}
	}
	
	// Event for STOP GAME button
	stopGame() {
		if (this.gameStarted) {
			clearInterval(this.gameInterval);
			this.gameStarted = false;
			this.cells.loadFromStorage();
		}
	}
}


const gameSettings = {
	canvas: document.getElementById("game"),
	zoomCanvas: document.getElementById("gamezoom"),
	speedCounter: document.getElementById("gameSpeed")
};

let game = new Game(gameSettings);

game.addButton("start", document.getElementById("startGame"));
game.addButton("stop", document.getElementById("stopGame"));
game.addButton("speed-", document.getElementById("speedMinus"));
game.addButton("speed+", document.getElementById("speedPlus"));
game.addButton("clear", document.getElementById("clearGame"));

game.addChart(document.getElementById("chart"));