
class TankCmd_Move {
	static type = "move";
	constructor(dir) {
		this.type = TankCmd_Move.type;
		this.dir = dir;
		this.progress = 0;
	}
}
class TankCmd_Turn {
	static type = "turn";
	constructor(dir) {
		this.type = TankCmd_Turn.type;
		this.dir = dir.unit();
		this.progress = 0;
	}
}
class TankCmd_Shoot {
	static type = "shoot";
	constructor(dir) {
		this.type = TankCmd_Shoot.type;
		this.dir = dir.unit();
		this.progress = 0;
	}
}

class Tank {
    constructor(playerIdx, pos, dir, ammoMaxRange) {
		// Variables...
		this.playerIdx = playerIdx;
        this.pos = pos;
        this.dir = dir;
		this.ammoMaxRange = ammoMaxRange;
		this.timeLastShot = Date.now();
		
		this.tankBody = null;
		this.tankTreadLeft = null;
		this.tankTreadRight = null;
		this.tankTurret = null;
		
		this.activeCommand = null;
		this.queuedCommands = [];
		
		// Config...
		this.tankMoveSpeed = 2.5;	// units per second
		this.tankTurnSpeed = 90;  	// degrees per second
    }
	
	create() {
		// Consts...
		this.tankBodySize = 0.75;
		this.tankTreadWidth = 0.1;
		this.tankTreadLength = 0.8;
		this.tankTurretInset = 0.15;
		this.tankTurretLength = 0.7;
		this.tankTurretWidth = 0.15;
		
		// Create the Raphael objects...
		this.tankBody = raphael.rect(0, 0, toPixelsLength(this.tankBodySize), toPixelsLength(this.tankBodySize), 3);
		this.tankTreadLeft = raphael.rect(0, 0, toPixelsLength(this.tankTreadLength), toPixelsLength(this.tankTreadWidth), 1);
		this.tankTreadRight = raphael.rect(0, 0, toPixelsLength(this.tankTreadLength), toPixelsLength(this.tankTreadWidth), 1);
		this.tankTurret = raphael.rect(0, 0, toPixelsLength(this.tankTurretLength), toPixelsLength(this.tankTurretWidth), 1);

		// Colors/strokes...
		let isSecondTank = simMan.tanks.length > 0;
        this.tankBody.attr({stroke: 'gray', 'stroke-width': 2, fill: isSecondTank ? 'lightblue' : 'lightgreen'});
		this.tankTreadLeft.attr({stroke: 'black', 'stroke-width': 2, fill: 'darkgray'});
		this.tankTreadRight.attr({stroke: 'black', 'stroke-width': 2, fill: 'darkgray'});
		this.tankTurret.attr({stroke: 'black', 'stroke-width': 2, fill: isSecondTank ? 'blue' : 'green'});
	}
	
	destroy() {
		if (this.tankBody != null) {
			this.tankBody.remove(); // destroy() ?
			this.tankBody = null;
		}
		if (this.tankTreadLeft != null) {
			this.tankTreadLeft.remove();
			this.tankTreadLeft = null;
		}
		if (this.tankTreadRight != null) {
			this.tankTreadRight.remove();
			this.tankTreadRight = null;
		}
		if (this.tankTurret != null) {
			this.tankTurret.remove();
			this.tankTurret = null;
		}
	}
	
	forward() {
		return this.dir;
	}
	
	right() {
		return new vec2(this.dir.y, -this.dir.x);
	}
	
	createCodeStruct() {
		return { 
			pos: new vec2(this.pos.x, this.pos.y), 
			dir: new vec2(this.dir.x, this.dir.y), 
			speedLinear: this.tankMoveSpeed,
			speedAngular: this.tankTurnSpeed,
			shotRange: this.ammoMaxRange,
			exec: (command, paramDirection) => {
				// Queue it (we'll do it right after this)...
				queuedCodeCommands.push({ cmd:command, paramDir:paramDirection });
			}
		};
	}
	
	ammoSpawnLocation() {
		return this.toWorld(new vec2(this.tankTurretLength - this.tankTurretInset + 0.1, 0));
	}
	
	kickBackTank(dir) {
		// If we are in the middle of a move, stop it...
		if ((this.activeCommand != null) && (this.activeCommand.type == TankCmd_Move.type)) {
			this.finishActiveCommand();
		}
		
		// Do the kick back...
		let kickBackLoc = clampToClosestHalfUnit(vec2.add(this.pos, vec2.multiply(dir.unit(), 1.414)));
		if (isInsideField(kickBackLoc, 0.25)) {
			this.pos = kickBackLoc;
			this.updateRaphaelObjects();
		}
		else {
			let kickBackLoc = vec2.add(this.pos, vec2.multiply(dir.unit(), 1.414 / 2));
			if (isInsideField(kickBackLoc, 0.25)) {
				this.pos = kickBackLoc;
				this.updateRaphaelObjects();
			}
		}
		
		// Check for tank overlap...
		let otherTank = (simMan.tanks.length > 1) ? ((simMan.tanks[0] == this) ? simMan.tanks[1] : simMan.tanks[0]) : null;
		if ((otherTank != null) && circleIntersect(this.pos, this.tankBodySize/2, otherTank.pos, otherTank.tankBodySize/2)) {
			this.pos = vec2.add(this.pos, vec2.multiply(dir, 0.1));
			otherTank.pos = vec2.add(otherTank.pos, vec2.multiply(dir, -0.1));
		}
	}	
	
	toWorld(pt) {
		return vec2.add(vec2.add(this.pos, vec2.multiply(this.forward(), pt.x)), vec2.multiply(this.dir, pt.y));
	}
	
	updateRaphaelObjects() {
		let angle = -this.dir.angle();
		let tankBodyPos = vec2.add(this.pos, new vec2(-this.tankBodySize/2, this.tankBodySize/2));
		let tankTreadLeftPos = vec2.add(this.pos, new vec2(-this.tankTreadLength/2, this.tankBodySize/2 + this.tankTreadWidth/2));
		let tankTreadRightPos = vec2.add(this.pos, new vec2(-this.tankTreadLength/2, -this.tankBodySize/2 + this.tankTreadWidth/2));
		let tankTurretPos = vec2.add(this.pos, new vec2(-this.tankTurretInset, this.tankTurretWidth/2));
		
		// Update them their positions...
		this.tankBody.attr({ x:toPixelsX(tankBodyPos.x), y:toPixelsY(tankBodyPos.y)});
		this.tankTreadLeft.attr({ x:toPixelsX(tankTreadLeftPos.x), y:toPixelsY(tankTreadLeftPos.y)});
		this.tankTreadRight.attr({ x:toPixelsX(tankTreadRightPos.x), y:toPixelsY(tankTreadRightPos.y)});
		this.tankTurret.attr({ x:toPixelsX(tankTurretPos.x), y:toPixelsY(tankTurretPos.y)});
		
		// Then, use the rotation command to rotate around the center point...
		let rotateString = "R"+angle+","+toPixelsX(this.pos.x)+","+toPixelsY(this.pos.y);
		this.tankBody.attr({ transform:rotateString });
		this.tankTreadLeft.attr({ transform:rotateString });
		this.tankTreadRight.attr({ transform:rotateString });
		this.tankTurret.attr({ transform:rotateString });
	}
	
	execCommand(command, insertFront = false) {
		// Queue it...
		if (insertFront) {
			this.queuedCommands.unshift(command);
		}
		else {
			this.queuedCommands.push(command);
		}
	}
	
	finishActiveCommand() {
		// Done with this one...
		this.activeCommand = null;
		
		// If no more, then exit out...
		if (this.queuedCommands.length == 0) {
			return;
		}
		
		// If it's a move or shoot, might need to do a turn first...
		let needToTurnFirst = false;
		let nextCommand = this.queuedCommands[0];
		if ((nextCommand.type == TankCmd_Move.type) || (nextCommand.type == TankCmd_Shoot.type)) {
			if (vec2.dot(this.dir.unit(), nextCommand.dir.unit()) < 0.999) {
				nextCommand = new TankCmd_Turn(nextCommand.dir.unit());
				needToTurnFirst = true;
			}
		}
		
		// Grab the next queued command...
		this.activeCommand = nextCommand;
		if (!needToTurnFirst) {
			this.queuedCommands.shift();
		}

		// Log it for the user...
		if (!needToTurnFirst) {
			log((needToTurnFirst ? "    " : "--> ") + this.activeCommand.type + ": dir=" + this.activeCommand.dir);
		}
		
		// Setup next new command (save off starting information)...
		this.activeCommand.startPos = this.pos;
		this.activeCommand.startDir = this.dir;
		
		// Make it cost something...
		let pointCost = (this.activeCommand.type == TankCmd_Shoot.type) ? -2 : -1;
		awardPoints(pointCost, this.playerIdx);
	}
	
	updateCommand(deltaTime) {
		if (this.activeCommand == null) {
			// Check for queued...
			if (this.queuedCommands.length > 0) {
				this.finishActiveCommand();
			}
			if (this.activeCommand == null) {
				return;
			}
		}
		switch (this.activeCommand.type) {
			case TankCmd_Move.type : {
				// Setup...
				let moveVec = this.activeCommand.dir;
				let moveDst = moveVec.length();
				let moveTravelTime = moveDst / this.tankMoveSpeed;
				
				// Update the active command...
				this.activeCommand.progress = Math.min(this.activeCommand.progress + deltaTime / moveTravelTime, 1);
				this.pos = vec2.add(this.activeCommand.startPos, vec2.multiply(moveVec, this.activeCommand.progress));
				
				// Check for tank overlap...
				let otherTank = (simMan.tanks.length > 1) ? ((simMan.tanks[0] == this) ? simMan.tanks[1] : simMan.tanks[0]) : null;
				if ((otherTank != null) && circleIntersect(this.pos, this.tankBodySize/2, otherTank.pos, otherTank.tankBodySize/2)) {
					let deltaVec = vec2.subtract(this.pos, otherTank.pos).unit();
					this.pos = vec2.add(this.pos, vec2.multiply(deltaVec, 0.1));
					this.activeCommand.progress = 1;
				}
				
				// Keep in bounds...
				if (this.pos.x <= this.tankBodySize/2) {
					this.pos = vec2.add(this.pos, vec2.multiply(vec2.right(), 0.1));
					this.activeCommand.progress = 1;
				}
				if (this.pos.y <= this.tankBodySize/2) {
					this.pos = vec2.add(this.pos, vec2.multiply(vec2.up(), 0.1));
					this.activeCommand.progress = 1;
				}
				if (this.pos.x >= toCoordFrameLength(canvasSize.w)-this.tankBodySize/2) {
					this.pos = vec2.add(this.pos, vec2.multiply(vec2.left(), 0.1));
					this.activeCommand.progress = 1;
				}
				if (this.pos.y >= toCoordFrameLength(canvasSize.h)-this.tankBodySize/2) {
					this.pos = vec2.add(this.pos, vec2.multiply(vec2.down(), 0.1));
					this.activeCommand.progress = 1;
				}
				
				// And...check for done...
				if (this.activeCommand.progress == 1) {
					this.finishActiveCommand();
				}
			} break;
			case TankCmd_Turn.type : {
				// Setup...
				let trgAngle = this.activeCommand.dir.angle();
				let angleDelta = minAngleToAngleDelta(this.activeCommand.startDir.angle(), trgAngle);
				let moveTravelTime = Math.abs(angleDelta) / this.tankTurnSpeed;
				
				// Update the active command...
				this.activeCommand.progress = Math.min(this.activeCommand.progress + deltaTime / moveTravelTime, 1);
				this.dir = vec2.rotate(this.activeCommand.startDir, angleDelta * this.activeCommand.progress).unit();
				
				// And...check for done...
				if (this.activeCommand.progress == 1) {
					this.finishActiveCommand();
				}				
			} break;
			case TankCmd_Shoot.type : {
				// Enforce a max shot period...
				let timeSinceShot = (Date.now() - this.timeLastShot) / 1000;
				if (timeSinceShot > 1) {
					// Shoot...
					simMan.createAmmo(this.playerIdx, this.ammoSpawnLocation(), this.dir, this.ammoMaxRange);
					
					// Save off last time...
					this.timeLastShot = Date.now();

					// And, that's it...
					this.finishActiveCommand();
				}
			} break;
		}
	}
	
	hasCommand() {
		return ((this.activeCommand != null) || (this.queuedCommands.length > 0)) ? true : false;
	}

    update(deltaTime) {
		// Command...
		if (deltaTime != 0) {
			this.updateCommand(deltaTime);
		}
		
		// Finally, sync the Raphael objects...
		this.updateRaphaelObjects();
	}
}
