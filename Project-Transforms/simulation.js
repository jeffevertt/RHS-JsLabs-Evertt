
class Simulation {
	constructor() {
		// Consts...
		this.fixedTimeStep = 1/60;
		
		// Member variables...
		this.timeToSim = 0;
		this.userGfx = [];
	}
	
	reset() {
		this.timeToSim = 0;
		this.resetUserGfx();
	}
	
	resetUserGfx() {
		for (let i = 0; i < this.userGfx.length; ++i) {
			if (this.userGfx[i] != null) {
				this.userGfx[i].remove();
				this.userGfx[i] = null;
			}
		}
		this.userGfx = [];
	}
	
	addUserLine(start, end, colorRgb = new vec3(0, 0, 139)) {
		let gfxLine = raphael.path(["M", toPixelsX(start.x), toPixelsY(start.y), "L", toPixelsX(end.x), toPixelsY(end.y)]);
		let colorHex = RGBV3ToHex(colorRgb);
		let lineWidth = 3; //((start.z == undefined) ? 1 : (clamp(avg(start.z, end.z), 0.5, 2))) * 3;
		gfxLine.attr({stroke: colorHex, 'stroke-width': lineWidth, fill: colorHex});
		this.userGfx.push(gfxLine);
		return gfxLine;
	}
	
	addUserLineInterp(start, end, colorRgb0 = new vec3(0, 0, 139), colorRgb1 = new vec3(139, 0, 0), subSegCount = 8) {
		for (let i = 0; i < subSegCount; ++i) {
			let t0 = i / subSegCount;
			let t1 = (i + 1) / subSegCount;
			let pos0 = vec3.lerp(start, end, t0);
			let pos1 = vec3.lerp(start, end, t1);
			let gfxLine = raphael.path(["M", toPixelsX(pos0.x), toPixelsY(pos0.y), "L", toPixelsX(pos1.x), toPixelsY(pos1.y)]);
			
			let tc = i / (subSegCount - 1);
			let colorInterpHex = RGBV3ToHex(vec3.lerp(colorRgb0, colorRgb1, tc));
			gfxLine.attr({stroke: colorInterpHex, 'stroke-width': 3, fill: colorInterpHex});
			
			this.userGfx.push(gfxLine);
		}
	}
	
	shouldStopSimulation() {
		return false;
	}
	
	update(deltaTime) {
		this.timeToSim += deltaTime;
		let numSteps = Math.floor(this.timeToSim / this.fixedTimeStep);
		numSteps = Math.min(numSteps, 5); // Clamp it to a max number of steps (slows down the sim, in this case)...
		for (let i = 0; i < numSteps; ++i) {
			this.timeToSim -= this.fixedTimeStep;
			if (!this.updateFixed(this.fixedTimeStep)) {
				return false;
			}
		}
		return true;
	}
		
	updateFixed(deltaTime) {
		// ...
		return true;
	}
}

// Script exposed functions...
function drawLine(start, end, colorRgb = new vec3(0, 0, 139)) {
	// Draws a 2D line on the canvas...
	sim.addUserLine(start, end, colorRgb);
}
function drawLineInterp(start, end, colorRgb0 = new vec3(0, 0, 139), colorRgb1 = new vec3(139, 0, 0)) {
	// Draws a 2D line on the canvas...
	sim.addUserLineInterp(start, end, colorRgb0, colorRgb1);
}
