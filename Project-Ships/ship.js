
class ShipCmd_Thrust {
	static type = "thrust";
	constructor(dst) {
		this.type = ShipCmd_Thrust.type;
		this.dst = dst;
		this.progress = 0;
	}
	cmdStrText() {
		return this.type + ": dst=" + (Math.round(this.dst * 10) / 10);
	}
}
class ShipCmd_ThrustLeft {
	static type = "thrustLeft";
	constructor(angle) {
		this.type = ShipCmd_ThrustLeft.type;
		this.angle = angle;
		this.progress = 0;
	}
	cmdStrText() {
		return this.type + ": angle=" + (Math.round(this.angle * 10) / 10);
	}
}
class ShipCmd_ThrustRight {
	static type = "thrustRight";
	constructor(angle) {
		this.type = ShipCmd_ThrustRight.type;
		this.angle = angle;
		this.progress = 0;
	}
	cmdStrText() {
		return this.type + ": angle=" + (Math.round(this.angle * 10) / 10);
	}
}
class ShipCmd_Shoot {
	static type = "shoot";
	constructor(dir) {
		this.type = ShipCmd_Shoot.type;
		this.dir = dir.unit();
		this.progress = 0;
	}
	cmdStrText() {
		return this.type;
	}
}

class Ship {
    constructor(playerIdx, pos, dir, ammoMaxRange) {
		// Variables...
		this.playerIdx = playerIdx;
        this.pos = pos;
        this.dir = dir;
		this.vel = vec2.zero();
		this.ammo = 0;
		this.ammoMaxRange = ammoMaxRange;
		this.timeLastShot = Date.now();
		
		this.shipShell = null;
		this.shipBody = null;
		this.shipBodyInner = null;
		this.shipThrustLeft = null;
		this.shipThrustRight = null;
		
		this.activeCommand = null;
		this.queuedCommands = [];
		
		// Config...
		this.shipMoveSpeed = (currentLevel > 1) ? 6 : 4; 	// units per second
		this.shipTurnSpeed = (currentLevel > 1) ? 180 : 60; // degrees per second
    }
	
	create() {
		// Consts...
		this.shipShellRadius = 0.5;
		this.shipBodySizeXn = -0.3;
		this.shipBodySizeXp = 0.55;
		this.shipBodySizeY = 0.5;
		this.shipBodyInnerScale = 0.5;
		this.shipThrustWidth = 0.3;
		this.shipThrustLength = 0.15;
		this.shipThrustOffX = this.shipBodySizeXn - this.shipThrustLength;
		this.shipThrustOffY = 0.3;
		this.shipThrustColorOff = 'darkslateblue';
		this.shipThrustColorOn = 'yellow';
		
		// Create the Raphael objects...
		this.shipShell = raphael.circle(0, 0, this.shipShellRadius * pixelsPerUnit);
		this.shipBody = raphael.path("M" + (this.shipBodySizeXn * pixelsPerUnit) + "," + (-this.shipBodySizeY * pixelsPerUnit) + "L" + (this.shipBodySizeXn * pixelsPerUnit) + "," + (this.shipBodySizeY * pixelsPerUnit) + "L" + (this.shipBodySizeXp * pixelsPerUnit) + ",0Z");
		this.shipBodyInner = raphael.path("M" + (this.shipBodySizeXn * this.shipBodyInnerScale * pixelsPerUnit) + "," + (-this.shipBodySizeY * this.shipBodyInnerScale * pixelsPerUnit) + "L" + (this.shipBodySizeXn * this.shipBodyInnerScale * pixelsPerUnit) + "," + (this.shipBodySizeY * this.shipBodyInnerScale * pixelsPerUnit) + "L" + (this.shipBodySizeXp * this.shipBodyInnerScale * pixelsPerUnit) + ",0Z");
		this.shipThrustLeft = raphael.rect((this.shipThrustOffX * pixelsPerUnit), (-(this.shipThrustOffY + this.shipThrustWidth/2) * pixelsPerUnit), toPixelsLength(this.shipThrustLength), toPixelsLength(this.shipThrustWidth), 1);
		this.shipThrustRight = raphael.rect((this.shipThrustOffX * pixelsPerUnit), ((this.shipThrustOffY - this.shipThrustWidth/2) * pixelsPerUnit), toPixelsLength(this.shipThrustLength), toPixelsLength(this.shipThrustWidth), 1);

		// Colors/strokes...
		let isSecondShip = simMan.ships.length > 0;
		this.shipShell.attr({stroke: isSecondShip ? 'slateblue' : 'mediumaquamarine', 'stroke-width': 3});
        this.shipBody.attr({stroke: isSecondShip ? 'darkblue' : 'darkgreen', 'stroke-width': 2, fill: isSecondShip ? 'lightblue' : 'lightgreen'});
		this.shipBodyInner.attr({fill: isSecondShip ? 'darkblue' : 'darkgreen'});
		this.shipThrustLeft.attr({stroke: 'black', 'stroke-width': 2, fill: this.shipThrustColorOff});
		this.shipThrustRight.attr({stroke: 'black', 'stroke-width': 2, fill: this.shipThrustColorOff});
	}
	
	destroy() {
		if (this.shipShell != null) {
			this.shipShell.remove();
			this.shipShell = null;
		}
		if (this.shipBody != null) {
			this.shipBody.remove();
			this.shipBody = null;
		}
		if (this.shipBodyInner != null) {
			this.shipBodyInner.remove();
			this.shipBodyInner = null;
		}
		if (this.shipThrustLeft != null) {
			this.shipThrustLeft.remove();
			this.shipThrustLeft = null;
		}
		if (this.shipThrustRight != null) {
			this.shipThrustRight.remove();
			this.shipThrustRight = null;
		}
	}
	
	forward() {
		return this.dir;
	}
	
	right() {
		return new vec2(this.dir.y, -this.dir.x);
	}
	
	createCodeStruct() {
		let dirRight = this.right();
		return { 
			pos: new vec2(this.pos.x, this.pos.y), 
			dir: new vec2(this.dir.x, this.dir.y), 
			right: new vec2(dirRight.x, dirRight.y),
			vel: new vec2(this.vel.x, this.vel.y),
			speedLinear: this.shipMoveSpeed,
			speedAngular: this.shipTurnSpeed,
			shotRange: this.ammoMaxRange,
			shotAmmo: this.ammo,
			exec: (command, parameter) => {
				// Queue it (we'll do it right after this)...
				queuedCodeCommands.push({ cmd:command, param:parameter });
			}
		};
	}
	
	ammoSpawnLocation() {
		return this.toWorld(new vec2(this.shipShellRadius, 0));
	}
	
	kickBackShip(dir) {
		// If we are in the middle of a thrust, stop it...
		if ((this.activeCommand != null) && (this.activeCommand.type == ShipCmd_Thrust.type)) {
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
		
		// Check for ship overlap...
		let otherShip = (simMan.ships.length > 1) ? ((simMan.ships[0] == this) ? simMan.ships[1] : simMan.ships[0]) : null;
		if ((otherShip != null) && circleIntersect(this.pos, this.shipBodySize/2, otherShip.pos, otherShip.shipBodySize/2)) {
			this.pos = vec2.add(this.pos, vec2.multiply(dir, 0.1));
			otherShip.pos = vec2.add(otherShip.pos, vec2.multiply(dir, -0.1));
		}
	}	
	
	toWorld(pt) {
		return vec2.add(vec2.add(this.pos, vec2.multiply(this.forward(), pt.x)), vec2.multiply(this.dir, pt.y));
	}
	
	updateRaphaelObjects() {
		// Setup...
		let angle = -this.dir.angle();
		
		// Then, use the transform command to offset & rotate around the center point...
		let transformString = "T"+toPixelsX(this.pos.x)+","+toPixelsY(this.pos.y)+"R"+angle+","+toPixelsX(this.pos.x)+","+toPixelsY(this.pos.y);
		this.shipShell.attr({ transform:transformString });
		this.shipBody.attr({ transform:transformString });
		this.shipBodyInner.attr({ transform:transformString });
		this.shipThrustLeft.attr({ transform:transformString });
		this.shipThrustRight.attr({ transform:transformString });
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
		
		// If it's a shoot, might need to do a turn first...
		let needToTurnFirst = false;
		let nextCommand = this.queuedCommands[0];
		if (nextCommand.type == ShipCmd_Shoot.type) {
			let shotDir = nextCommand.dir.unit();
			if (vec2.dot(this.dir.unit(), shotDir) < 0.999) {
				let dotRight = dot(shotDir, this.right());
				let angle = shotDir.angle() - this.dir.angle()
				if (dotRight > 0) {
					nextCommand = new ShipCmd_ThrustLeft(-angle);
				} else {
					nextCommand = new ShipCmd_ThrustRight(angle);
				}
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
			log("--> " + this.activeCommand.cmdStrText());
		}
		
		// Setup next new command (save off starting information)...
		this.activeCommand.startPos = this.pos;
		this.activeCommand.startDir = this.dir;
		
		// Make it cost something...
		let pointCost = -1;
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
			case ShipCmd_Thrust.type : {
				// Setup...
				let moveVec = multiply(this.activeCommand.startDir, this.activeCommand.dst);
				let moveDst = this.activeCommand.dst;
				let moveTravelTime = moveDst / this.shipMoveSpeed;
				
				// Update the active command...
				this.activeCommand.progress = Math.min(this.activeCommand.progress + deltaTime / moveTravelTime, 1);
				this.pos = vec2.add(this.activeCommand.startPos, vec2.multiply(moveVec, this.activeCommand.progress));
				this.shipThrustLeft.attr({stroke: 'black', 'stroke-width': 2, fill: this.shipThrustColorOn});
				this.shipThrustRight.attr({stroke: 'black', 'stroke-width': 2, fill: this.shipThrustColorOn});
				this.vel = vec2.multiply(this.dir, (moveDst / moveTravelTime));
				
				// Check for ship overlap...
				let otherShip = (simMan.ships.length > 1) ? ((simMan.ships[0] == this) ? simMan.ships[1] : simMan.ships[0]) : null;
				if ((otherShip != null) && circleIntersect(this.pos, this.shipShellRadius/2, otherShip.pos, otherShip.shipShellRadius/2)) {
					let deltaVec = vec2.subtract(this.pos, otherShip.pos).unit();
					this.pos = vec2.add(this.pos, vec2.multiply(deltaVec, 0.1));
					this.activeCommand.progress = 1;
				}
				
				// Keep in bounds...
				if (this.pos.x <= this.shipShellRadius/2) {
					this.pos = vec2.add(this.pos, vec2.multiply(vec2.right(), 0.1));
					this.activeCommand.progress = 1;
				}
				if (this.pos.y <= this.shipShellRadius/2) {
					this.pos = vec2.add(this.pos, vec2.multiply(vec2.up(), 0.1));
					this.activeCommand.progress = 1;
				}
				if (this.pos.x >= toCoordFrameLength(canvasSize.w)-this.shipShellRadius/2) {
					this.pos = vec2.add(this.pos, vec2.multiply(vec2.left(), 0.1));
					this.activeCommand.progress = 1;
				}
				if (this.pos.y >= toCoordFrameLength(canvasSize.h)-this.shipShellRadius/2) {
					this.pos = vec2.add(this.pos, vec2.multiply(vec2.down(), 0.1));
					this.activeCommand.progress = 1;
				}
				
				// And...check for done...
				if (this.activeCommand.progress == 1) {
					this.vel = vec2.zero();
					this.shipThrustLeft.attr({stroke: 'black', 'stroke-width': 2, fill: this.shipThrustColorOff});
					this.shipThrustRight.attr({stroke: 'black', 'stroke-width': 2, fill: this.shipThrustColorOff});
					this.finishActiveCommand();
				}
			} break;
			case ShipCmd_ThrustLeft.type : {
				// Setup...
				let angleDelta = -(this.activeCommand.angle < 0 ? this.activeCommand.angle + 360 : this.activeCommand.angle);
				let moveTravelTime = Math.abs(angleDelta) / this.shipTurnSpeed;
				
				// Update the active command...
				this.activeCommand.progress = Math.min(this.activeCommand.progress + deltaTime / moveTravelTime, 1);
				this.dir = vec2.rotate(this.activeCommand.startDir, angleDelta * this.activeCommand.progress).unit();
				this.shipThrustLeft.attr({stroke: 'black', 'stroke-width': 2, fill: this.shipThrustColorOn});
				
				// And...check for done...
				if (this.activeCommand.progress == 1) {
					this.shipThrustLeft.attr({stroke: 'black', 'stroke-width': 2, fill: this.shipThrustColorOff});
					this.finishActiveCommand();
				}				
			} break;
			case ShipCmd_ThrustRight.type : {
				// Setup...
				let angleDelta = (this.activeCommand.angle < 0 ? this.activeCommand.angle + 360 : this.activeCommand.angle);
				let moveTravelTime = Math.abs(angleDelta) / this.shipTurnSpeed;
				
				// Update the active command...
				this.activeCommand.progress = Math.min(this.activeCommand.progress + deltaTime / moveTravelTime, 1);
				this.dir = vec2.rotate(this.activeCommand.startDir, angleDelta * this.activeCommand.progress).unit();
				this.shipThrustRight.attr({stroke: 'black', 'stroke-width': 2, fill: this.shipThrustColorOn});
				
				// And...check for done...
				if (this.activeCommand.progress == 1) {
					this.shipThrustRight.attr({stroke: 'black', 'stroke-width': 2, fill: this.shipThrustColorOff});
					this.finishActiveCommand();
				}				
			} break;
			case ShipCmd_Shoot.type : {
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
