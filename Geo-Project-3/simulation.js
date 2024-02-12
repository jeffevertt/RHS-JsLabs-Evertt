
class Ball {
    constructor(x, y, vx, vy, r, color) {
		// Member vars...
        this.position = new vec2(x, y);			// In coordframe units
		this.velocity = new vec2(vx, vy);		// In coordframe units
		this.radius = r;
		this.raphaelObject = raphael.circle(toPixelsX(this.position.x), toPixelsY(this.position.y), this.radius * pixelsPerUnit);
        this.raphaelObject.attr({stroke: 'black', 'stroke-width': 2, fill: color});
    }

	destroy() {
		if (this.raphaelObject != null) {
			this.raphaelObject.remove();
			this.raphaelObject = null;
		}
	}
	
	createCodeStruct() {
		return { 
			position: new vec2(this.position.x, this.position.y), 
			velocity: new vec2(this.velocity.x, this.velocity.y), 
			radius: this.radius
		};
	}
	
	copyFromCodeObject(other) {
		if ((this.position.x != other.position.x) || (this.position.y != other.position.y)) {
			this.position = other.position;
			this.raphaelObject.attr({cx: toPixelsX(this.position.x), cy: toPixelsY(this.position.y)});
		}
		if ((this.velocity.x != other.velocity.x) || (this.velocity.y != other.velocity.y)) {
			this.velocity = other.velocity;
		}
		if (this.radius != other.radius) {
			this.radius = other.radius;
			this.raphaelObject.attr({r: this.radius * pixelsPerUnit});
		}
	}
	
	update(deltaTime) {
		this.position = vec2.add(this.position, vec2.multiply(this.velocity, deltaTime));
		this.raphaelObject.attr({cx: toPixelsX(this.position.x), cy: toPixelsY(this.position.y)});
	}
}

class Wall {
    constructor(x, y, dx, dy, nx, ny) {
		// Member vars...
        this.point = new vec2(x, y);				// In coordframe units
		this.direction = (new vec2(dx, dy)).unit();
		this.normal = (new vec2(nx, ny)).unit();
		this.angle = atan2(dy, dx);
		
		// Create the polygon...
		let rectUL = toCoordFrame(new vec2(field.attr("x") + fieldStrokeWidth, field.attr("y") + fieldStrokeWidth));
		let rectLR = new vec2(rectUL.x + (field.attr("width") - fieldStrokeWidth * 2) / pixelsPerUnit, rectUL.y - (field.attr("height") - fieldStrokeWidth * 2) / pixelsPerUnit)
		this.raphaelObject = raphael.path(createPolygonFromClippedRectangle(rectUL, rectLR, this.point, this.direction, this.normal));
        this.raphaelObject.attr({fill: 'darkslategray', stroke: 'black', 'stroke-width': 2});
    }

	destroy() {
		if (this.raphaelObject != null) {
			this.raphaelObject.remove();
			this.raphaelObject = null;
		}
	}
	
	createCodeStruct() {
		return { 
			point: new vec2(this.point.x, this.point.y), 
			direction: new vec2(this.direction.x, this.direction.y), 
			normal: new vec2(this.normal.x, this.normal.y), 
			angle: this.angle 
		};
	}
}

class SimulationManager {
	constructor() {
		// Consts...
		this.ballColors = [ 'blue', 'darkgreen', 'magenta', 'cadetblue', 'cornsilk', 'deeppink', 'darksalmon', 'darkorchid', 'goldenrod', 'indigo', 'khaki', 'greenyellow', 'orange' ];
		this.nextBallColor = 0;

		// Member variables...
		this.balls = [];
		this.walls = [];
	}
	
	createBall(x, y, vx, vy, r) {
		let ball = new Ball(x, y, vx, vy, r, this.ballColors[this.nextBallColor % this.ballColors.length]);
		this.balls.push(ball);
		
		++this.nextBallColor;
	}
	
	destroyBall(ball) {
		const index = this.balls.indexOf(ball);
		if (index > -1) {
			ball.destroy();
			this.balls.splice(index, 1);
		}
	}
	
	createWall(x, y, dx, dy, nx, ny) {
		let wall = new Wall(x, y, dx, dy, nx, ny);
		this.walls.push(wall);
	}
	
	destroyWall(wall) {
		const index = this.walls.indexOf(wall);
		if (index > -1) {
			wall.destroy();
			this.walls.splice(index, 1);
		}
	}
	
	destroyAll() {
		for (let i = 0; i < this.balls.length; i++) { 
			this.balls[i].destroy();
		}
		this.balls = [];
		for (let i = 0; i < this.walls.length; i++) { 
			this.walls[i].destroy();
		}
		this.walls = [];
		
		this.nextBallColor = 0;
	}
	
	update(deltaTime) {
		// Go through and update all the balls first...
		for (let i = 0; i < this.balls.length; ++i) { 
			// Update the ball...
			this.balls[i].update(deltaTime); 
		}
	}
	
	doCollisionCode(codeBallWall, codeBallBall) {
		// Loop through all the ball-wall combos first...
		for (let i = 0; i < this.balls.length; ++i) {
			for (let j = 0; j < this.walls.length; ++j) {
				ball = this.balls[i].createCodeStruct();
				wall = this.walls[j].createCodeStruct();
				if (!executeCode(codeBallWall)) {
					return false;
				}
				this.balls[i].copyFromCodeObject(ball);
			}
		}
		
		// Loop through all the ball combos first (note: only want to call unique pairs once)...
		for (let i = 0; i < this.balls.length; ++i) {
			for (let j = i + 1; j < this.balls.length; ++j) {
				ball = this.balls[i].createCodeStruct();
				other = this.balls[j].createCodeStruct();
				if (!executeCode(codeBallBall)) {
					return false;
				}
				this.balls[i].copyFromCodeObject(ball);
				this.balls[j].copyFromCodeObject(other);
			}
		}

		return true;
	}
	
	cullNotInField(field) {
		let i = 0;
		while (i < this.balls.length) { 
			if (!inRect(field, this.balls[i].raphaelObject)) {
				this.destroyBall(this.balls[i]);
				continue;
			}
			++i;
		}
	}
	
	shouldStopSimulation() {
		for (let i = 0; i < this.balls.length; ++i) {
			if ((this.balls[i].velocity.x != 0) || (this.balls[i].velocity.y != 0)) {
				return false;
			}
		}
		return true;
	}
}
