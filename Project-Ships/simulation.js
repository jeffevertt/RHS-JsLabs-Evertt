
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
				if (circleIntersect(target.pos, target.targetRadius, this.pos, this.radius)) {
					// Tell the target about it...
					target.onHitByAmmo(this.playerIdx);
					
					// That's it for us...
					this.timeTillDeath = Math.max(this.timeTillDeath, 0.0001);
				}
			}
			
			// Check for hitting ships...
			for (let i = 0; i < simMan.ships.length; ++i) {
				let ship = simMan.ships[i];
				if (this.playerIdx == ship.playerIdx) {
					continue;
				}
				if ((this.playerIdx != ship.playerIdx) && // Don't let someone hit themselves
				    circleIntersect(ship.pos, ship.shipShellRadius, this.pos, this.radius)) {
					// Award points...
					awardPoints(25, this.playerIdx);
					log("(hit ship: score +25)");
					
					// Kick the ship back (if you can)...
					ship.kickBackShip(vec2.subtract(ship.pos, this.pos).unit());
					
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
	constructor(pos, vel) {
		// Consts...
		this.targetRadius = 0.5;
		this.trgBodySizeXn = -0.375;
		this.trgBodySizeXp = 0.425;
		this.trgBodySizeY = 0.35;
		this.trgBodyInnerScale = 0.65;
		this.trgBodyInnerScaleXn = 0.8;

		// Setup...
		let dir = vel.unit();
		
		// Member vars...
        this.pos = pos;
		this.vel = vel;
		this.scale = 1;
		this.timeTillDeath = 0;
		this.gfxOuter = raphael.path("M" + (this.trgBodySizeXn * pixelsPerUnit) + "," + (-this.trgBodySizeY * pixelsPerUnit) + "L" + (this.trgBodySizeXn * pixelsPerUnit) + "," + (this.trgBodySizeY * pixelsPerUnit) + "L" + (this.trgBodySizeXp * pixelsPerUnit) + ",0Z");
		this.gfxInner = raphael.path("M" + (this.trgBodySizeXn * this.trgBodyInnerScaleXn * pixelsPerUnit) + "," + (-this.trgBodySizeY * this.trgBodyInnerScale * pixelsPerUnit) + "L" + (this.trgBodySizeXn * this.trgBodyInnerScaleXn * pixelsPerUnit) + "," + (this.trgBodySizeY * this.trgBodyInnerScale * pixelsPerUnit) + "L" + (this.trgBodySizeXp * this.trgBodyInnerScale * pixelsPerUnit) + ",0Z");
		this.gfxOuter.attr({stroke: 'lightsteelblue', 'stroke-width': 2, fill: 'red'});
		this.gfxInner.attr({stroke: 'black', 'stroke-width': 2, fill: 'hotpink'});
		this.updateRaphaelObjects();
		
		// Set draw order...
		this.gfxOuter.insertAfter(field);
		this.gfxInner.insertAfter(this.gfxOuter);
    }

	destroy() {
		if (this.gfxOuter != null) {
			this.gfxOuter.remove();
			this.gfxOuter = null;
		}
		if (this.gfxInner != null) {
			this.gfxInner.remove();
			this.gfxInner = null;
		}
	}
	
	updateRaphaelObjects() {
		// Setup...
		let angle = -this.vel.angle();
		let transformString = "T"+toPixelsX(this.pos.x)+","+toPixelsY(this.pos.y)+"R"+angle+","+toPixelsX(this.pos.x)+","+toPixelsY(this.pos.y)+"S"+this.scale;
		
		// Then, use the transform command to offset & rotate around the center point...
		this.gfxOuter.attr({ transform:transformString });
		this.gfxInner.attr({ transform:transformString });
	}	
	
	createCodeStruct() {
		return { 
			pos: new vec2(this.pos.x, this.pos.y),
			vel: new vec2(this.vel.x, this.vel.y),
		};
	}
	
	onHitByAmmo(playerIdx) {
		// Trigger death spiral...
		this.timeTillDeath = Math.max(this.timeTillDeath, 0.0001);
		
		// Give up the points...
		awardPoints(25, playerIdx);
		log("(hit target: score +25)");
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
		// If no longer on the field, we're done...
		if (!isInsideField(this.pos)) {
			this.timeTillDeath = Math.max(this.timeTillDeath, 0.001);
		}
		
		// If dieing, continue...
		if (this.timeTillDeath > 0) {
			// Update it...
			this.timeTillDeath = Math.min(this.timeTillDeath + deltaTime * 2.0, 1.0);
			
			// Scale it down...
			this.scale = Math.max(1.0 - this.timeTillDeath, 0.001);
		}
		
		// Update position...
		this.pos.add(vec2.multiply(this.vel, deltaTime));
		this.updateRaphaelObjects();
	}
}

class PowerUp {
	constructor(pos, value = 3) {
		// Consts...
		this.powerUpWH = 0.8;
		
		// Member vars...
        this.pos = pos;
		this.value = value;
		this.timeTillDeath = 0;
		this.raphaelObject = raphael.rect(toPixelsX(this.pos.x - this.powerUpWH/2), toPixelsY(this.pos.y + this.powerUpWH/2), toPixelsLength(this.powerUpWH), toPixelsLength(this.powerUpWH), 3);
		this.raphaelObject.attr({stroke: 'lightsteelblue', 'stroke-width': 3, fill: 'gold'});
		this.raphaelObject.insertAfter(field);
		
		// Text...
		let powerupText = "" + value;
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
			value: this.value,
		};
	}	
	
	onCollected(ship) {
		// Trigger death spiral...
		this.timeTillDeath = Math.max(this.timeTillDeath, 0.0001);
		
		// Give the powerup value...
		ship.ammo += this.value;
		ship.shipMoveSpeed *= 1 + this.value * 0.005;
		ship.maxRange *= 1 + this.value * 0.01;

		// Points...
		awardPoints(5, ship.playerIdx);
		log("(powerup: score +5, ammo=" + ship.ammo + ")");		
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
			// Check for ships collecting us...
			for (let i = 0; i < simMan.ships.length; ++i) {
				let ship = simMan.ships[i];
				if (circleContainsPoint(this.pos, this.powerUpWH, ship.pos)) {
					// React to it...
					this.onCollected(ship);
					
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
		this.ships = [];
		this.targets = [];
		this.powerups = [];
		
		// Timers...
		this.timeSinceSpawnedPowerup = 10000;
		this.timeSinceSpawnedTarget = 10000;
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
	
	createShip(playerIdx, pos, dir, ammoMaxRange) {
		let ship = new Ship(playerIdx, pos, dir, ammoMaxRange);
		ship.create();
		ship.updateRaphaelObjects();
		this.ships.push(ship);
		return ship;
	}
	
	destroyShip(ship) {
		const index = this.ships.indexOf(ship);
		if (index > -1) {
			ship.destroy();
			this.ships.splice(index, 1);
		}
	}
	
	createTarget(pos, vel) {
		let target = new Target(pos, vel);
		this.targets.push(target);
		this.timeSinceSpawnedTarget = 0.0;
	}
	
	destroyTarget(target) {
		const index = this.targets.indexOf(target);
		if (index > -1) {
			target.destroy();
			this.targets.splice(index, 1);
		}
	}
	
	createPowerUp(pos, value) {
		let powerup = new PowerUp(pos, value);
		this.powerups.push(powerup);
		this.timeSinceSpawnedPowerup = 0.0;
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
		for (let i = 0; i < this.ships.length; i++) { 
			this.ships[i].destroy();
		}
		this.ships = [];
		for (let i = 0; i < this.targets.length; i++) { 
			this.targets[i].destroy();
		}
		this.targets = [];
		for (let i = 0; i < this.powerups.length; i++) { 
			this.powerups[i].destroy();
		}
		this.powerups = [];
	}
	
	calcMinDstFromAShip(pos) {
		let minDst = 10000000;
		for (let i = 0; i < this.ships.length; i++) { 
			let thisDst = pos.distance(this.ships[i].pos);
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
	
	shouldSpawnPowerup(maxPowerUps) {
		if (this.powerups.length >= maxPowerUps) {
			return false;
		}
		return true;
	}

	shouldSpawnTarget(maxTargets) {
		if (this.targets.length >= maxTargets) {
			return false;
		}
		return true;
	}
	
	update(deltaTime) {
		// Objects...
		for (let i = 0; i < this.ammos.length; ++i) { 
			this.ammos[i].update(deltaTime); 
		}
		for (let i = 0; i < this.ships.length; ++i) { 
			this.ships[i].update(deltaTime); 
		}
		for (let i = 0; i < this.targets.length; ++i) { 
			this.targets[i].update(deltaTime); 
		}
		for (let i = 0; i < this.powerups.length; ++i) { 
			this.powerups[i].update(deltaTime); 
		}
		
		// Timers...
		this.timeSinceSpawnedPowerup += deltaTime;
		this.timeSinceSpawnedTarget += deltaTime;
	}
	
	execCode(playerIdx, code) {
		queuedCodeCommands = [];
		let theShip = null, otherShip = null;
		for (let i = 0; i < this.ships.length; ++i) {
			theShip = (this.ships[i].playerIdx == playerIdx) ? this.ships[i] : theShip;
			otherShip = (this.ships[i].playerIdx != playerIdx) ? this.ships[i] : otherShip;
		}
		ship = (theShip != null) ? theShip.createCodeStruct() : null;
		other = (otherShip != null) ? otherShip.createCodeStruct() : null;
		currentPlayerIdx = playerIdx;
		target = (this.targets.length > 0) ? this.targets[0].createCodeStruct() : null;
		targets = [];
		for (let i = 0; i < this.targets.length; ++i) {
			targets.push( this.targets[i].createCodeStruct() );
		}
		powerup = (this.powerups.length > 0) ? this.powerups[0].createCodeStruct() : null;
		powerups = [];
		for (let i = 0; i < this.powerups.length; ++i) {
			powerups.push( this.powerups[i].createCodeStruct() );
		}
		if (!executeCode(code)) {
			return false;
		}
		this.execCodeRequestedShipCommands(theShip);

		return true;
	}
	
	execCodeRequestedShipCommands(ship) {
		if ((queuedCodeCommands == null) || (queuedCodeCommands == undefined)) {
			return;
		}
		for (let i = 0; i < queuedCodeCommands.length; ++i) {
			let cmd = queuedCodeCommands[i];
			if ((cmd.cmd == null) || (cmd.param == null) ||
			    ((cmd.cmd.toLowerCase() == ShipCmd_Shoot.type) && ((cmd.param.x == null) || (cmd.param.x == undefined))))
			{
				log("INVALID COMMAND: missing or invalid parameters");
				throw new Error('INVALID COMMAND: missing or invalid parameters');
				return;
			}
			let shipCmd = null;
			let skipThisCmd = false;
			switch (cmd.cmd.toLowerCase()) {
				case ShipCmd_Thrust.type.toLowerCase() :
					if (Math.max(cmd.param, 0) < 0.001) {
						log("INVALID THRUST: Invalid distance");
						//throw new Error('INVALID THRUST:Invalid distance');
						//return;
						skipThisCmd = true;
					}
					shipCmd = new ShipCmd_Thrust(cmd.param);
					break;
				case ShipCmd_ThrustLeft.type.toLowerCase() :
					if (Math.abs(cmd.param) < 0.001) {
						log("INVALID THRUST LEFT: Zero angle");
						//throw new Error('INVALID THRUST LEFT: Zero angle');
						//return;
						skipThisCmd = true;
					}
					shipCmd = new ShipCmd_ThrustLeft(cmd.param);
					break;
				case ShipCmd_ThrustRight.type.toLowerCase() : 
					if (Math.abs(cmd.param) < 0.001) {
						log("INVALID THRUST RIGHT: Zero angle");
						//throw new Error('INVALID THRUST RIGHT: Zero angle');
						//return;
						skipThisCmd = true;
					}
					shipCmd = new ShipCmd_ThrustRight(cmd.param);
					break;
				case ShipCmd_Shoot.type.toLowerCase() : 
					if (ship.ammo <= 0) {
						log("SHOT FAILED: No Ammo!");
						return;
					}
					ship.ammo -= 1;
					shipCmd = new ShipCmd_Shoot(cmd.param);
					break;
				default :
					log("INVALID COMMAND: " + cmd.cmd);
					throw new Error("INVALID COMMAND: " + cmd.cmd);
					return;
			}
			if (!skipThisCmd) {
				ship.execCommand(shipCmd);
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
		for (let i = 0; i < this.ships.length; ++i) {
			if (this.ships[i].playerIdx != playerIdx) {
				continue;
			}
			if (this.ships[i].hasCommand()) {
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
