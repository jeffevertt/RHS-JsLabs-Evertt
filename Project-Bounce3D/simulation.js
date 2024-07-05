
class Ball {
    constructor(pos, vel, r, color) {
        // Member vars...
        this.position = pos;                // In coordframe units (3D pos)
        this.velocity = vel;                // In coordframe units (3D vel)
        this.radius = r;
        this.color = color;
        this.raphaelObject = raphael.circle(worldTo2D(this.position).x, worldTo2D(this.position).y, this.radius * scaleAtPos(this.position) * pixelsPerUnit);
        this.raphaelObject.attr({stroke: 'black', 'stroke-width': 2, fill: color});
    }

    destroy() {
        if (this.raphaelObject != null) {
            this.raphaelObject.remove();
            this.raphaelObject = null;
        }
    }

    createCodeStructBall() {
        return { 
            position: new vec3(this.position.x, this.position.y, this.position.z), 
            velocity: new vec3(this.velocity.x, this.velocity.y, this.velocity.z), 
            radius: this.radius
        };
    }

    createCodeStructWall(idx) {
        if (idx == 0)      return { point: new vec3(-worldBoxHalfSize.x, worldBoxHalfSize.y, 0), direction: vec3.forward(), normal: vec3.right() };
        else if (idx == 1) return { point: new vec3( worldBoxHalfSize.x, worldBoxHalfSize.y, 0), direction: vec3.backward(), normal: vec3.left() };
        else if (idx == 2) return { point: new vec3(-worldBoxHalfSize.x, worldBoxHalfSize.y, 0), direction: vec3.right(), normal: vec3.forward() };
        else if (idx == 3) return { point: new vec3( worldBoxHalfSize.x, worldBoxHalfSize.y, 2 * worldBoxHalfSize.z), direction: vec3.left(), normal: vec3.backward() };
        else if (idx == 4) return { point: new vec3(-worldBoxHalfSize.x, worldBoxHalfSize.y, 0), direction: vec3.left(), normal: vec3.down() };
        else if (idx == 5) return { point: new vec3( worldBoxHalfSize.x,-worldBoxHalfSize.y, 0), direction: vec3.right(), normal: vec3.up() };
    }    
    
    copyFromCodeObjectBall(other) {
        if ((this.position.x != other.position.x) || (this.position.y != other.position.y) || (this.position.z != other.position.z)) {
            this.position = other.position;
        }
        if ((this.velocity.x != other.velocity.x) || (this.velocity.y != other.velocity.y) || (this.velocity.z != other.velocity.z)) {
            this.velocity = other.velocity;
        }
    }    
    
    update(deltaTime, codeBallWall) {
        // Vel/Pos update...
        this.position = vec3.add(this.position, vec3.multiply(this.velocity, deltaTime));

        // Code ball/wall & ball/paddle
        ball = this.createCodeStructBall();
        for (let j = 0; j < 6; j++) {
            wall = this.createCodeStructWall(j);
            if (!executeCode(codeBallWall)) {
                return false;
            }
        }
        this.copyFromCodeObjectBall(ball);

        // Update graphics...
        let pos2D = worldTo2D(this.position);
        this.raphaelObject.attr({cx: toPixelsX(pos2D.x), cy: toPixelsY(pos2D.y)});

        // Color update (inside/outside of world)...
        if (isInsideWorld(this.position)) {
            this.raphaelObject.attr({fill: this.color, stroke: 'black', 'stroke-width': 2});
        }
        else {
            this.raphaelObject.attr({fill: 'lightgray', stroke: 'darkgray', 'stroke-width': 1}).toBack();
            field.toBack();
        }

        // And its size...
        let radScale = scaleAtPos(this.position);
        this.raphaelObject.attr({r: this.radius * radScale * pixelsPerUnit });

        return true;
    }
}

class Simulation {
    constructor() {
        // Consts...
        this.ballColors = [ 'blue', 'darkgreen', 'magenta', 'cadetblue', 'cornsilk', 'deeppink', 'darksalmon', 'darkorchid', 'goldenrod', 'indigo', 'khaki', 'greenyellow', 'orange' ];
        this.nextBallColor = 0;        
        
        // Member variables...
        this.timeToSim = 0;
        this.lines = [];
        this.balls = [];
    }
    
    reset() {
        this.timeToSim = 0;
        this.destroyAll();
    }

    createBall(pos, vel, r) {
        let ball = new Ball(pos, vel, r, this.ballColors[this.nextBallColor % this.ballColors.length]);
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
    
    createLine(start, end, colorRgb = new vec3(0, 0, 139)) {
        let gfxLine = raphael.path(["M", toPixelsX(start.x), toPixelsY(start.y), "L", toPixelsX(end.x), toPixelsY(end.y)]);
        let colorHex = RGBV3ToHex(colorRgb);
        let lineWidth = scaleAtPos(vec3.average(start, end)) * pixelsPerUnit * 0.25;
        gfxLine.attr({stroke: colorHex, 'stroke-width': lineWidth, fill: colorHex}).toBack();
        this.lines.push(gfxLine);
        return gfxLine;
    }

    destroyLine(line) {
        const index = this.lines.indexOf(line);
        if (index > -1) {
            line.destroy();
            this.line.splice(index, 1);
        }
    }

    destroyAllLines() {
        for (let i = 0; i < this.lines.length; i++) { 
            this.lines[i].remove();
        }
        this.lines = [];       
    }

    destroyAll() {
        for (let i = 0; i < this.balls.length; i++) { 
            this.balls[i].destroy();
        }
        this.balls = [];
        for (let i = 0; i < this.lines.length; i++) { 
            this.lines[i].remove();
        }
        this.lines = [];
        
        this.nextBallColor = 0;
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
        return false;
    }
    
    update(deltaTime, codeBallWall) {
        for (let i = 0; i < this.balls.length; ++i) { 
            if (!this.balls[i].update(deltaTime, codeBallWall)) {
                return false;
            }
        }
        return true;
    }
}

