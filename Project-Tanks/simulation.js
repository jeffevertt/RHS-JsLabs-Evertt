
class Ammo {
    constructor(playerIdx, pos, dir, maxRange) {
		// Consts...
		this.playerIdx = playerIdx;
		this.ammoSpeed = 8;
		this.ammoRadius = 0.15;
		
		// Member vars...
		this.startPos = pos;
        this.pos = pos;
		this.maxRange = maxRange;
		this.velocity = vec2.multiply(dir.unit(), this.ammoSpeed);
		this.radius = this.ammoRadius;
		this.raphaelObject = raphael.circle(toPixelsX(this.pos.x), toPixelsY(this.pos.y), this.radius * pixelsPerUnit);
        this.raphaelObject.attr({stroke: 'black', 'stroke-width': 2, fill: "darkred"});
		this.timeTillDeath = 0;
    }

	destroy() {
		if (this.raphaelObject != null) {
			this.raphaelObject.remove();
			this.raphaelObject = null;
		}
	}
	
	shouldBeCulled() {
		// Check if on field...
		if (!inRect(field, this.raphaelObject)) {
			return true;
		}
		
		// Check death timer...
		if (this.timeTillDeath >= 1) {
			return true;
		}
		
		return false;
	}
	
	update(deltaTime) {
		// If dieing, continue...
		if (this.timeTillDeath > 0) {
			// Update it...
			this.timeTillDeath = Math.min(this.timeTillDeath + deltaTime * 10.0, 1.0);
			
			// Scale it down...
			this.radius = this.ammoRadius * Math.max(1.0 - this.timeTillDeath, 0.001);
			this.raphaelObject.attr("r", this.radius * pixelsPerUnit);
		}
		else {
			// Update position...
			this.pos = vec2.add(this.pos, vec2.multiply(this.velocity, deltaTime));
			this.raphaelObject.attr({cx: toPixelsX(this.pos.x), cy: toPixelsY(this.pos.y)});

			// Check for hitting targets...
			for (let i = 0; i < simMan.targets.length; ++i) {
				let target = simMan.targets[i];
				if (circleIntersect(target.pos, target.radius, this.pos, this.radius)) {
					// Tell the target about it...
					target.onHitByAmmo(this.playerIdx);
					
					// That's it for us...
					this.timeTillDeath = Math.max(this.timeTillDeath, 0.0001);
				}
			}
			
			// Check for hitting tanks...
			for (let i = 0; i < simMan.tanks.length; ++i) {
				let tank = simMan.tanks[i];
				if ((this.playerIdx != tank.playerIdx) && // Don't let someone hit themselves
					(circleIntersect(tank.pos, tank.tankBodySize/2, this.pos, this.radius))) {
					// Award points...
					awardPoints(25, this.playerIdx);
					log("(hit tank: score +25)");
					
					// Kick the tank back (if you can)...
					tank.kickBackTank(vec2.subtract(tank.pos, this.pos).unit());
					
					// That's it for us...
					this.timeTillDeath = Math.max(this.timeTillDeath, 0.0001);
				}
			}
			
			// Check max range...
			if ((vec2.subtract(this.pos, this.startPos)).lengthSqr() >= (this.maxRange * this.maxRange)) {
				// That's it for us...
				this.timeTillDeath = Math.max(this.timeTillDeath, 0.0001);
			}
		}
	}
}

class Target {
	constructor(pos) {
		// Consts...
		this.targetRadius = 0.4;
		
		// Member vars...
        this.pos = pos;
		this.radius = this.targetRadius;
		this.timeTillDeath = 0;
		this.raphaelObjects = [];
		this.raphaelObjects.push(raphael.circle(toPixelsX(this.pos.x), toPixelsY(this.pos.y), this.radius * pixelsPerUnit).attr({'stroke-width': 2, fill: "red"}));
		this.raphaelObjects.push(raphael.circle(toPixelsX(this.pos.x), toPixelsY(this.pos.y), this.radius * 0.666 * pixelsPerUnit).attr({'stroke-width': 0, fill: "white"}));
		this.raphaelObjects.push(raphael.circle(toPixelsX(this.pos.x), toPixelsY(this.pos.y), this.radius * 0.333 * pixelsPerUnit).attr({'stroke-width': 0, fill: "red"}));
		
		// Set draw order...
		for (let i = this.raphaelObjects.length - 1; i >= 0; --i) {
			this.raphaelObjects[i].insertAfter(field);
		}
    }

	destroy() {
		for (let i = 0; i < this.raphaelObjects.length; ++i) {
			if (this.raphaelObjects[i] != null) {
				this.raphaelObjects[i].remove();
				this.raphaelObjects[i] = null;
			}
		}
		this.raphaelObjects = [];
	}
	
	createCodeStruct() {
		return { 
			pos: new vec2(this.pos.x, this.pos.y), 
		};
	}
	
	onHitByAmmo(playerIdx) {
		// Trigger death spiral...
		this.timeTillDeath = Math.max(this.timeTillDeath, 0.0001);
		
		// Give up the points...
		awardPoints(20, playerIdx);
		log("(hit target: score +20)");
	}
	
	isDying() {
		return (this.timeTillDeath > 0);
	}
	
	shouldBeCulled() {
		// Check death timer...
		if (this.timeTillDeath >= 1) {
			return true;
		}
		
		return false;
	}
	
	update(deltaTime) {
		// If dieing, continue...
		if (this.timeTillDeath > 0) {
			// Update it...
			this.timeTillDeath = Math.min(this.timeTillDeath + deltaTime * 2.0, 1.0);
			
			// Scale it down...
			this.radius = this.targetRadius * Math.max(1.0 - this.timeTillDeath, 0.001);
			for (let i = 0; i < this.raphaelObjects.length; ++i) {
				this.raphaelObjects[i].attr("r", this.radius * (1 - i/3) * pixelsPerUnit);
			}
		}
	}
}

class PowerUp {
	constructor(pos, type = "P") {
		// Consts...
		this.powerUpWH = 0.8;
		
		// Member vars...
        this.pos = pos;
		this.type = type;
		this.timeTillDeath = 0;
		this.raphaelObject = raphael.rect(toPixelsX(this.pos.x - this.powerUpWH/2), toPixelsY(this.pos.y + this.powerUpWH/2), toPixelsLength(this.powerUpWH), toPixelsLength(this.powerUpWH), 3);
		this.raphaelObject.attr({stroke: 'Indigo', 'stroke-width': 3, fill: "yellow"});
		this.raphaelObject.insertAfter(field);
		
		// Text...
		let powerupText = type;
		this.raphaelText = raphael.text(toPixelsX(this.pos.x), toPixelsY(this.pos.y), powerupText)
		this.raphaelText.attr({ "text-anchor": "middle", "font-size": pixelsPerUnit/2, "font-family": "Arial, sans-serif", "font-weight": "bold", "fill": "black" });
		this.raphaelText.insertAfter(this.raphaelObject);
    }

	destroy() {
		if (this.raphaelObject != null) {
			this.raphaelObject.remove();
			this.raphaelObject = null;
		}
		if (this.raphaelText != null) {
			this.raphaelText.remove();
			this.raphaelText = null;
		}
	}
	
	createCodeStruct() {
		return { 
			pos: new vec2(this.pos.x, this.pos.y), 
			type: this.type,
		};
	}	
	
	onCollected(tank) {
		// Trigger death spiral...
		this.timeTillDeath = Math.max(this.timeTillDeath, 0.0001);
		
		// Give up the points...
		switch (this.type) {
			case "S" : // Speed
				tank.tankMoveSpeed *= 1.15;
				tank.tankTurnSpeed *= 1.15;
				log("(powerup: speed +15%)");
				break;
			case "R" : // Shot range
				tank.ammoMaxRange *= 1.25;
				log("(powerup: range +25%)");
				break;
			case "P" : // Points
				awardPoints(25, tank.playerIdx);
				log("(powerup: score +25)");
				break;
			default :
				throw new Error("Invalid powerup type = " + type);
		}
	}
	
	isDying() {
		return (this.timeTillDeath > 0);
	}
	
	shouldBeCulled() {
		// Check death timer...
		if (this.timeTillDeath >= 1) {
			return true;
		}
		
		return false;
	}
	
	update(deltaTime) {
		// If dieing, continue...
		if (this.timeTillDeath > 0) {
			// Update it...
			this.timeTillDeath = Math.min(this.timeTillDeath + deltaTime * 2.0, 1.0);
			
			// Scale it down...
			let scale = Math.max(1.0 - this.timeTillDeath, 0.001);
			this.raphaelObject.transform("S"+scale+","+scale);
			this.raphaelText.transform("S"+scale+","+scale);
		}
		else {
			// Check for tanks collecting us...
			for (let i = 0; i < simMan.tanks.length; ++i) {
				let tank = simMan.tanks[i];
				if (circleContainsPoint(this.pos, this.powerUpWH, tank.pos)) {
					// React to it...
					this.onCollected(tank);
					
					// That's it for us...
					this.timeTillDeath = Math.max(this.timeTillDeath, 0.0001);
				}
			}
		}
	}
}

class SimulationManager {
	constructor() {
		// Member variables...
		this.ammos = [];
		this.tanks = [];
		this.targets = [];
		this.powerups = [];
	}
	
	createAmmo(playerIdx, pos, dir, maxRange) {
		let ammo = new Ammo(playerIdx, pos, dir, maxRange);
		this.ammos.push(ammo);
	}
	
	destroyAmmo(ammo) {
		const index = this.ammos.indexOf(ammo);
		if (index > -1) {
			ammo.destroy();
			this.ammos.splice(index, 1);
		}
	}
	
	createTank(playerIdx, pos, dir, ammoMaxRange) {
		let tank = new Tank(playerIdx, pos, dir, ammoMaxRange);
		tank.create();
		tank.updateRaphaelObjects();
		this.tanks.push(tank);
		return tank;
	}
	
	destroyTank(tank) {
		const index = this.tanks.indexOf(tank);
		if (index > -1) {
			tank.destroy();
			this.tanks.splice(index, 1);
		}
	}
	
	createTarget(pos, dir) {
		let target = new Target(pos);
		this.targets.push(target);
	}
	
	destroyTarget(target) {
		const index = this.targets.indexOf(target);
		if (index > -1) {
			target.destroy();
			this.targets.splice(index, 1);
		}
	}
	
	createPowerUp(pos, type) {
		let powerup = new PowerUp(pos, type);
		this.powerups.push(powerup);
	}
	
	destroyPowerUp(powerup) {
		const index = this.powerups.indexOf(powerup);
		if (index > -1) {
			powerup.destroy();
			this.powerups.splice(index, 1);
		}
	}
	
	destroyAll() {
		for (let i = 0; i < this.ammos.length; i++) { 
			this.ammos[i].destroy();
		}
		this.ammos = [];
		for (let i = 0; i < this.tanks.length; i++) { 
			this.tanks[i].destroy();
		}
		this.tanks = [];
		for (let i = 0; i < this.targets.length; i++) { 
			this.targets[i].destroy();
		}
		this.targets = [];
		for (let i = 0; i < this.powerups.length; i++) { 
			this.powerups[i].destroy();
		}
		this.powerups = [];
	}
	
	calcMinDstFromATank(pos) {
		let minDst = 10000000;
		for (let i = 0; i < this.tanks.length; i++) { 
			let thisDst = pos.distance(this.tanks[i].pos);
			minDst = Math.min(minDst, thisDst);
		}
		return minDst;
	}
	
	calcMinDstFromATarget(pos) {
		let minDst = 10000000;
		for (let i = 0; i < this.targets.length; i++) { 
			let thisDst = pos.distance(this.targets[i].pos);
			minDst = Math.min(minDst, thisDst);
		}
		return minDst;
	}
	
	calcMinDstFromAPowerUp(pos) {
		let minDst = 10000000;
		for (let i = 0; i < this.powerups.length; i++) { 
			let thisDst = pos.distance(this.powerups[i].pos);
			minDst = Math.min(minDst, thisDst);
		}
		return minDst;
	}
	
	update(deltaTime) {
		for (let i = 0; i < this.ammos.length; ++i) { 
			this.ammos[i].update(deltaTime); 
		}
		for (let i = 0; i < this.tanks.length; ++i) { 
			this.tanks[i].update(deltaTime); 
		}
		for (let i = 0; i < this.targets.length; ++i) { 
			this.targets[i].update(deltaTime); 
		}
		for (let i = 0; i < this.powerups.length; ++i) { 
			this.powerups[i].update(deltaTime); 
		}
	}
	
	execCode(playerIdx, code) {
		queuedCodeCommands = [];
		let theTank = null, otherTank = null;
		for (let i = 0; i < this.tanks.length; ++i) {
			theTank = (this.tanks[i].playerIdx == playerIdx) ? this.tanks[i] : theTank;
			otherTank = (this.tanks[i].playerIdx != playerIdx) ? this.tanks[i] : otherTank;
		}
		tank = (theTank != null) ? theTank.createCodeStruct() : null;
		other = (otherTank != null) ? otherTank.createCodeStruct() : null;
		currentPlayerIdx = playerIdx;
		target = (this.targets.length > 0) ? this.targets[0].createCodeStruct() : null;
		powerup = (this.powerups.length > 0) ? this.powerups[0].createCodeStruct() : null;
		if (!executeCode(code)) {
			return false;
		}
		this.execCodeRequestedTankCommands(theTank);

		return true;
	}
	
	execCodeRequestedTankCommands(tank) {
		if ((queuedCodeCommands == null) || (queuedCodeCommands == undefined)) {
			return;
		}
		for (let i = 0; i < queuedCodeCommands.length; ++i) {
			let cmd = queuedCodeCommands[i];
			if ((cmd.cmd == null) || (cmd.paramDir == null) ||
				(cmd.paramDir.x == null) || (cmd.paramDir.x == undefined) ||
				(cmd.paramDir.y == null) || (cmd.paramDir.y == undefined))
			{
				log("INVALID COMMAND: missing or invalid parameters");
				throw new Error('INVALID COMMAND: missing or invalid parameters');
				return;
			}
			let tankCmd = null;
			let skipThisCmd = false;
			switch (cmd.cmd.toLowerCase()) {
				case TankCmd_Move.type :
					if ((Math.abs(cmd.paramDir.x) > 0.000001) && (Math.abs(cmd.paramDir.y) > 0.000001)) {
						log("INVALID MOVE: Tanks move only horizontally & vertically");
						throw new Error('INVALID MOVE: Tanks move only horizontally & vertically');
						return;
					}
					if (vec2.lengthSqr(cmd.paramDir) < 0.001) {
						log("INVALID MOVE: Zero distance");
						//throw new Error('INVALID MOVE: Zero distance');
						//return;
						skipThisCmd = true;
					}
					tankCmd = new TankCmd_Move(cmd.paramDir);
					break;
				case TankCmd_Turn.type : 
					tankCmd = new TankCmd_Turn(cmd.paramDir);
					break;
				case TankCmd_Shoot.type : 
					if (vec2.lengthSqr(cmd.paramDir) < 0.001) {
						log("INVALID SHOT: Zero direction vector");
						//throw new Error('INVALID SHOT: Zero direction vector');
						//return;
						skipThisCmd = true;
					}
					tankCmd = new TankCmd_Shoot(cmd.paramDir);
					break;
				default :
					log("INVALID COMMAND: " + cmd.cmd);
					throw new Error("INVALID COMMAND: " + cmd.cmd);
					return;
			}
			if (!skipThisCmd) {
				tank.execCommand(tankCmd);
			}
		}
		queuedCodeCommands = [];
	}
	
	cullNotInField(field) {
		// Ammo...
		let i = 0;
		while (i < this.ammos.length) { 
			if (this.ammos[i].shouldBeCulled()) {
				this.destroyAmmo(this.ammos[i]);
				continue;
			}
			++i;
		}
		
		// Targets...
		i = 0;
		while (i < this.targets.length) { 
			if (this.targets[i].shouldBeCulled()) {
				this.destroyTarget(this.targets[i]);
				continue;
			}
			++i;
		}

		// PowerUps...
		i = 0;
		while (i < this.powerups.length) { 
			if (this.powerups[i].shouldBeCulled()) {
				this.destroyPowerUp(this.powerups[i]);
				continue;
			}
			++i;
		}
	}
	
	isReadyToAskCodeForNextCommand(playerIdx) {
		for (let i = 0; i < this.tanks.length; ++i) {
			if (this.tanks[i].playerIdx != playerIdx) {
				continue;
			}
			if (this.tanks[i].hasCommand()) {
				return false;
			}
		}
		for (let i = 0; i < this.powerups.length; ++i) {
			if (this.powerups[i].isDying()) {
				return false;
			}
		}
		for (let i = 0; i < this.targets.length; ++i) {
			if (this.targets[i].isDying()) {
				return false;
			}
		}		
		if (this.ammos.length > 0) { // Count an active shot as busy...
			return false;
		}
		return true;
	}
	
	isAnyActionHappening() {
		if (!this.isReadyToAskCodeForNextCommand()) {
			return true;
		}
		for (let i = 0; i < this.ammos.length; ++i) {
			if ((this.ammos[i].velocity.x != 0) || (this.ammos[i].velocity.y != 0)) {
				return true;
			}
		}
		for (let i = 0; i < this.targets.length; ++i) {
			if (this.targets[i].isDying()) {
				return true;
			}
		}		
		for (let i = 0; i < this.powerups.length; ++i) {
			if (this.powerups[i].isDying()) {
				return true;
			}
		}		
		return false;
	}
}
