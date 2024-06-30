
class Ball {
    constructor(x, y, vx, vy, r, color) {
        // Member vars...
        this.position = new vec2(x, y);            // In coordframe units
        this.velocity = new vec2(vx, vy);        // In coordframe units
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
        }
        if ((this.velocity.x != other.velocity.x) || (this.velocity.y != other.velocity.y)) {
            this.velocity = other.velocity;
        }
    }    
    
    update(deltaTime, codeBallWall, codeBallPaddle) {
        // Vel/Pos update...
        this.position = vec2.add(this.position, vec2.multiply(this.velocity, deltaTime));

        // Code ball/wall & ball/paddle
        ball = this.createCodeStruct();
        for (let i = 0; i < simMan.walls.length; ++i) {
            wall = simMan.walls[i].createCodeStruct();
            if (!executeCode(codeBallWall)) {
                return false;
            }
        }
        for (let i = 0; i < simMan.paddles.length; ++i) {
            paddle = simMan.paddles[i].createCodeStruct();
            if (!executeCode(codeBallPaddle)) {
                return false;
            }
        }
        this.copyFromCodeObject(ball);

        // Update graphics...
        this.raphaelObject.attr({cx: toPixelsX(this.position.x), cy: toPixelsY(this.position.y)});

        return true;
    }
}

class Paddle {
    constructor(x, y, h, w, normal, color) {
        // Member vars...
        this.position = new vec2(x, y);         // In coordframe units
        this.width = w;
        this.height = h;
        this.normal = normal;
        this.raphaelObject = raphael.rect(toPixelsX(this.position.x - this.width/2), toPixelsY(this.position.y + this.height/2), toPixelsLength(this.width), toPixelsLength(this.height), 3);
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
            direction: new vec2(0, this.normal.x > 0 ? 1 : -1),
            normal: new vec2(this.normal.x, this.normal.y), 
            width: this.width,
            height: this.height,
        };
    }

    update(deltaTime) {
        // keyboard input motion
        let moveSpeed = 15;
        if (this.normal.x > 0) {
            if (isKeyPressed(65)) {
                this.position.y += moveSpeed * deltaTime;
            }
            if (isKeyPressed(90)) {
                this.position.y -= moveSpeed * deltaTime;
            }
        }
        else {
            if (isKeyPressed(38)) {
                this.position.y += moveSpeed * deltaTime;
            }
            if (isKeyPressed(40)) {
                this.position.y -= moveSpeed * deltaTime;
            }
        }
        this.position.y = clamp(this.position.y, -fieldHalfHeight + this.height / 2, fieldHalfHeight - this.height / 2);

        // and update the graphics
        this.raphaelObject.attr({x: toPixelsX(this.position.x - this.width/2), y: toPixelsY(this.position.y + this.height/2)});

        return true;
    }
}

class Wall {
    constructor(x, y, dx, dy, nx, ny) {
        // Member vars...
        this.point = new vec2(x, y);                // In coordframe units
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
        this.paddles = [];
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

    createPaddle(x, y, h, w, normal) {
        let paddle = new Paddle(x, y, h, w, normal, 'yellow');
        this.paddles.push(paddle);
    }
    
    destroyPaddle(paddle) {
        const index = this.paddles.indexOf(paddle);
        if (index > -1) {
            paddle.destroy();
            this.paddles.splice(index, 1);
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
        for (let i = 0; i < this.paddles.length; i++) { 
            this.paddles[i].destroy();
        }
        this.paddles = [];
        for (let i = 0; i < this.walls.length; i++) { 
            this.walls[i].destroy();
        }
        this.walls = [];
        
        this.nextBallColor = 0;
    }
    
    update(deltaTime, codeBallWall, codeBallPaddle) {
        for (let i = 0; i < this.balls.length; ++i) { 
            if (!this.balls[i].update(deltaTime, codeBallWall, codeBallPaddle)) {
                return false;
            }
        }
        for (let i = 0; i < this.paddles.length; ++i) { 
            if (!this.paddles[i].update(deltaTime)) {
                return false;
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
