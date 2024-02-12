
class Ball {
    constructor(pos, vel, radius) {
		// Member vars...
		this.startPos = pos;
        this.pos = pos;
		this.vel = vel;
		this.radius = radius;
		this.raphaelObject = raphael.circle(toPixelsX(this.pos.x), toPixelsY(this.pos.y), this.radius * pixelsPerUnit);
        this.raphaelObject.attr({stroke: 'black', 'stroke-width': 1, fill: "gold"});
		this.timeAlive = 0;
		this.deathTimer = 0;
    }

	destroy() {
		if (this.raphaelObject != null) {
			this.raphaelObject.remove();
			this.raphaelObject = null;
		}
	}
	
	createCodeStruct() {
		return { 
			pos: new vec2(this.pos.x, this.pos.y), 
			vel: new vec2(this.vel.x, this.vel.y), 
			rad: this.radius,
		};
	}
	
	shouldBeCulled() {
		// Check if on field...
		if (!inRect(field, this.raphaelObject)) {
			return true;
		}
		
		// Check death timer...
		if (this.deathTimer >= 1) {
			return true;
		}
		
		return false;
	}
	
	update(deltaTime) {
		// Timer...
		let prevTimeAlive = this.timeAlive;
		this.timeAlive += deltaTime;
		if ((prevTimeAlive < 5) &&  (this.timeAlive >= 5)) {
			this.deathTimer = Math.max(this.deathTimer, 0.001);
		}
		
		// Death timer...
		if (this.deathTimer > 0) {
			this.deathTimer = Math.min(this.deathTimer + deltaTime * 5, 1.0);
			this.raphaelObject.attr({r: (this.radius * Math.max(1 - this.deathTimer, 0.0001) * pixelsPerUnit)});
		}
		
		// Update position...
		this.pos = vec2.add(this.pos, vec2.multiply(this.vel, deltaTime));
		this.vel = vec2.add(this.vel, vec2.multiply(gravity, deltaTime));
		//this.vel = vec2.multiply(this.vel, Math.max(1 - deltaTime * 2, 0.9)); // Damp...
		this.raphaelObject.attr({cx: toPixelsX(this.pos.x), cy: toPixelsY(this.pos.y)});
	}
}

class Box {
	constructor(pos, halfDimX, halfDimY, boxColor = "teal", angVel = 0) {
		// Member vars...
        this.pos = pos;
		this.halfWidth = halfDimX.length();
		this.halfHeight = halfDimY.length();
		this.basisX = halfDimX.unit();
		this.basisY = halfDimY.unit();
		this.angVel = angVel;
		this.raphaelObject = raphael.rect(toPixelsX(this.pos.x - this.halfWidth), toPixelsY(this.pos.y + this.halfHeight), toPixelsLength(this.halfWidth * 2), toPixelsLength(this.halfHeight * 2));
        this.raphaelObject.attr({stroke: 'black', 'stroke-width': 2, fill: boxColor});
		this.updateRectRotation();
    }

	destroy() {
		if (this.raphaelObject != null) {
			this.raphaelObject.remove();
			this.raphaelObject = null;
		}
	}
	
	createCodeStruct() {
		return { 
			pos: new vec2(this.pos.x, this.pos.y), 
			vel: new vec2(0, 0), 
			halfDims: new vec2(this.halfWidth, this.halfHeight), 
			basisX: new vec2(this.basisX.x, this.basisX.y), 
			basisY: new vec2(this.basisY.x, this.basisY.y), 
		};
	}
	
	shouldBeCulled() {
		return false;
	}
	
	updateRectRotation() {
		let angle = this.basisX.angle();
		let rotateString = "R"+(-angle)+","+toPixelsX(this.pos.x)+","+toPixelsY(this.pos.y);
		this.raphaelObject.attr({ transform:rotateString });
	}
	
	update(deltaTime) {
		// Maybe rotate...
		if (this.angVel != 0) {
			// Update our rotation...
			let thisRotation = this.angVel * deltaTime;
			this.basisX.rotate(thisRotation);
			this.basisY.rotate(thisRotation);
			
			// Update the graphics...
			this.updateRectRotation();
		}
	}
}

class SimulationManager {
	constructor() {
		// Member variables...
		this.balls = [];
		this.boxes = [];
	}
	
	createBall(pos, vel, radius) {
		let ball = new Ball(pos, vel, radius);
		this.balls.push(ball);
	}
	
	destroyBall(ball) {
		const index = this.balls.indexOf(ball);
		if (index > -1) {
			ball.destroy();
			this.balls.splice(index, 1);
		}
	}
	
	createBox(pos, halfDimX, halfDimY, boxColor = "teal", angVel = 0) {
		let box = new Box(pos, halfDimX, halfDimY, boxColor, angVel);
		this.boxes.push(box);
		return box;
	}
	
	destroyBox(box) {
		const index = this.tanks.indexOf(box);
		if (index > -1) {
			box.destroy();
			this.boxes.splice(index, 1);
		}
	}
	
	getBallTargetPos() {
		let box = (this.boxes.length > 0) ? this.boxes[0] : null;
		let boxPos = (box == null) ? new vec2(0, 0) : box.pos;
		return boxPos;
	}
	
	destroyAll() {
		for (let i = 0; i < this.balls.length; i++) { 
			this.balls[i].destroy();
		}
		this.balls = [];
		for (let i = 0; i < this.boxes.length; i++) { 
			this.boxes[i].destroy();
		}
		this.boxes = [];
	}
	
	update(deltaTime) {
		for (let i = 0; i < this.balls.length; ++i) { 
			this.balls[i].update(deltaTime); 
		}
		for (let i = 0; i < this.boxes.length; ++i) { 
			this.boxes[i].update(deltaTime); 
		}
	}
	
	execCode(code) {
		if (this.boxes.length < 1) {
			log("error: must have at least one box");
			return;
		}
		for (let i = 0; i < this.balls.length; ++i) {
			box = this.boxes[0].createCodeStruct();
			ball = this.balls[i].createCodeStruct();
			if (!executeCode(code)) {
				return false;
			}
			this.balls[i].pos = ball.pos;
			this.balls[i].vel = ball.vel;
		}

		return true;
	}
		
	cullNotInField(field) {
		// Balls...
		let i = 0;
		while (i < this.balls.length) { 
			if (this.balls[i].shouldBeCulled()) {
				this.destroyBall(this.balls[i]);
				continue;
			}
			++i;
		}
	}
	
	isAnyActionHappening() {
		return (this.balls.length > 0);
	}
}
