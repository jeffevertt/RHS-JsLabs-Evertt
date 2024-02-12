
// Matrix container/chain, support string expression entries as well...
class mat3x3c {
	constructor(list3x3 = []) {
		this.mats = list3x3; // Contains mat3x3
	}
	
	push(mat) {
		this.insertEnd(mat);
	}
	insertEnd(mat) {
		this.mats.push(mat);
	}
	insertFront(mat) {
		this.mats.unshift(mat);
	}
	
	evalMat3x3(idx) {
		// Make a copy...
		let mat = mat3x3.copy(this.mats[idx]);
		
		// Eval any string expressions...
		if (typeof mat.m00 === 'string') mat.m00 = sim.evalUserExpression(mat.m00);
		if (typeof mat.m01 === 'string') mat.m01 = sim.evalUserExpression(mat.m01);
		if (typeof mat.m02 === 'string') mat.m02 = sim.evalUserExpression(mat.m02);
		if (typeof mat.m10 === 'string') mat.m10 = sim.evalUserExpression(mat.m10);
		if (typeof mat.m11 === 'string') mat.m11 = sim.evalUserExpression(mat.m11);
		if (typeof mat.m12 === 'string') mat.m12 = sim.evalUserExpression(mat.m12);
		if (typeof mat.m20 === 'string') mat.m20 = sim.evalUserExpression(mat.m20);
		if (typeof mat.m21 === 'string') mat.m21 = sim.evalUserExpression(mat.m21);
		if (typeof mat.m22 === 'string') mat.m22 = sim.evalUserExpression(mat.m22);
		
		return mat;
	}
	
	toMat3x3() { // returns mat3x3
		if (this.mats.length == 0) {
			return mat3x3.identity();
		}
		// Ok, now we can do the multiply (combine left to right)...
		let ret = this.evalMat3x3(0);
		for (let i = 1; i < this.mats.length; ++i) {
			ret.multiply(this.evalMat3x3(i));
		}
		return ret;
	}
	
	transform(pt) { 		// pt:vec3, returns vec3
		let mat = toMat3x3();
		return mat.transform(pt);
	}
	
	transformPoint(pt) { 	// pt:vec3, returns vec2
		let mat = toMat3x3();
		return mat.transformPoint(pt);
	}

	clear() {
		this.mats = [];
	}
}

class Var {
	constructor(name, min, max, init, period) {
		this.name = name;
		this.min = min;
		this.max = max;
		this.init = init;
		this.period = period;
		
		this.t = Math.max(Math.min((init - min) / (max - min), 1), 0);
	}
	
	getValue() {
		let value = this.min + (this.max - this.min) * Math.min(this.t, 1);
		return value;
	}
	
	update(deltaTime) {
		let inc = deltaTime / this.period;
		this.t += inc;
		let loopCount = Math.floor(this.t);
		this.t -= loopCount;
	}
}

class Planet {
	constructor(radius, localToWorld, color1, color2 = 'black') { //radius:float, localToWorld:mat3x3c or mat3x3, color1:string, color2:string
		this.radius = radius;
		this.localToWorld = localToWorld;
		this.color1 = color1;
		this.color2 = color2;
		this.gfx = null;
		this.textureUrl = null;
		
		// Graphics...
		this.createGfx();
	}
	
	getPos() {
		let mat = this.localToWorld;
		if (this.localToWorld.mats != undefined) {
			mat = this.localToWorld.toMat3x3();
		}
		let pos = mat.transformPoint(new vec3(0,0,1));
		return pos;
	}
	
	getBasisX() {
		let mat = this.localToWorld;
		if (this.localToWorld.mats != undefined) {
			mat = this.localToWorld.toMat3x3();
		}
		return mat.basisX();
	}
	
	createGfx() {
		this.resetGfx();
		
		let pos = this.getPos();
		if (this.textureUrl != null) {
			let radiusPixels = toPixelsLength(this.radius);
			this.gfx = raphael.image(this.textureUrl, toPixelsX(pos.x) - radiusPixels, toPixelsY(pos.y) - radiusPixels, radiusPixels * 2, radiusPixels * 2);
			this.gfx.attr({fill: this.color1, stroke: this.color2, 'stroke-width': 1});
			
			let basisX = this.getBasisX();
			let angle = -Math.atan2(basisX.y, basisX.x);
			this.gfx.attr({ transform:"R"+R2D(angle)+","+toPixelsX(pos.x)+","+toPixelsY(pos.y) });
		}
		else {
			this.gfx = raphael.circle(toPixelsX(pos.x), toPixelsY(pos.y), toPixelsLength(this.radius));
			this.gfx.attr({fill: this.color1, stroke: this.color2, 'stroke-width': 1});
		}
	}
	resetGfx() {
		if (this.gfx != null) {
			this.gfx.remove();
			this.gfx = null;
		}
	}
	updateGfx() {
		if (this.gfx != null) {
			let pos = this.getPos();
			if (this.textureUrl != null) {
				this.gfx.attr({x:toPixelsX(pos.x) - toPixelsLength(this.radius), y:toPixelsY(pos.y) - toPixelsLength(this.radius)});
				
				let basisX = this.getBasisX();
				let angle = -Math.atan2(basisX.y, basisX.x);
				this.gfx.attr({ transform:"R"+R2D(angle)+","+toPixelsX(pos.x)+","+toPixelsY(pos.y) });
			}
			else {
				this.gfx.attr({cx:toPixelsX(pos.x), cy:toPixelsY(pos.y)});
			}
		}
	}
	
	setTexture(pngFilename) {
		this.textureUrl = './textures/' + pngFilename;
		this.resetGfx();
		this.createGfx();
	}
	
	update(deltaTime) {
		this.updateGfx();
	}
}

class Simulation {
	constructor() {
		// Consts...
		this.fixedTimeStep = 1/60;
		
		// Member variables...
		this.planets = [];
		this.vars = [];
		this.timeToSim = 0;
	}
	
	reset() {
		for (let i = 0; i < this.planets.length; ++i) {
			this.planets[i].resetGfx();
		}
		this.planets = [];
		this.vars = [];
		this.timeToSim = 0;
	}
	
	addPlanet(planet) {
		if (planet == null) {
			return;
		}
		this.planets.push(planet);
	}
	
	addVar(variable) {
		if (variable == null) {
			return;
		}
		this.vars.push(variable);
		
		// Sort vars by length of string, longest to shortest to avoid subtrings replacements early...
		this.vars.sort((a,b) => (a.name.length > b.name.length) ? -1 : (a.name.length < b.name.length) ? 1 : 0);
	}
	
	getVarValue(name) {
		for (let i = 0; i < this.vars.length; ++i) {
			if (this.vars[i].name == name) {
				return this.vars[i].getValue();
			}
		}
		return undefined;
	}
	
	evalUserExpression(str) {
		// Make a copy...
		let strLcl = (' ' + str).slice(1);
		
		// Replace any variables...
		for (let i = 0; i < this.vars.length; ++i) {
			if (strLcl.includes(this.vars[i].name)) {
				let varValue = this.vars[i].getValue();
				strLcl = strLcl.replaceAll(this.vars[i].name, varValue);
			}
		}
		
		// Eval and return...
		return eval(strLcl);
	}
	
	createGfx() {
		for (let i = 0; i < this.planets.length; ++i) {
			this.planets[i].createGfx();
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
		for (let i = 0; i < this.planets.length; ++i) {
			this.planets[i].update(deltaTime);
		}
		for (let i = 0; i < this.vars.length; ++i) {
			this.vars[i].update(deltaTime);
		}
		return true;
	}
}

// Script exposed functions...
function addPlanet(radius, list3x3, color1, color2 = 'black') {
	if (list3x3 instanceof mat3x3) {
		list3x3 = [ list3x3 ];
	}
	let planet = new Planet(radius, new mat3x3c(list3x3), color1, color2);
	sim.addPlanet(planet);
	return planet;
}
function addVar(name, min = 0, max = 360, init = 0, period = 1) {
	let variable = new Var(name, min, max, init, period);
	sim.addVar(variable);
	return variable;
}
