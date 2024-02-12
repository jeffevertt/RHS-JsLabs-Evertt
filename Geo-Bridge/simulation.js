
class LoadSphere {
	constructor(radius, mass, travelSpeed) {
		this.radius = radius;
		this.mass = mass;
		this.travelSpeed = travelSpeed;
		this.gfxObject = null;
		this.pos = null;
		this.vel = vec2.zero();
		this.posStart = null;
		this.motionVector = vec2.zero();
		this.bridge = null;
	}
	
	create(bridge) {
		// Save off the bridge...
		this.bridge = bridge;
		
		// Figure out the left/right-most position (fixed nodes only)...
		let leftMostX = 0, rightMostX = 0;
		for (let i = 0; i < bridge.verts.length; ++i) {
			let vert = bridge.verts[i];
			if (!this.bridge.vertHasFloorSegment(i)) {
				continue;
			}
			leftMostX = Math.min(leftMostX, vert.pos.x);
			rightMostX = Math.max(rightMostX, vert.pos.x);
		}
		this.pos = new vec2(leftMostX, this.radius);
		this.posStart = new vec2(this.pos.x, this.pos.y);
		this.motionVector = new vec2(rightMostX - leftMostX, 0);
		this.vel = vec2.zero();
		
		// Create the gfx object...
		this.gfxObject = raphael.circle(toPixelsX(this.pos.x), toPixelsY(this.pos.y), toPixelsLength(this.radius));
        this.gfxObject.attr({stroke: 'black', 'stroke-width': 2, fill: 'blue'});
		this.gfxObject.toBack();
		field.toBack();
	}
	
	term() {
		if (this.gfxObject != null) {
			this.gfxObject.remove();
			this.gfxObject = null;
		}
		this.bridge = null;
		this.vel = vec2.zero();
	}
	
	isTestFinished() {
		if (this.gfxObject == null) {
			return true;
		}
		if (!inRect(field, this.pos.x, this.pos.y, this.radius)) {
			return true;
		}
		if ((this.pos.x >= this.posStart.x + this.motionVector.x) && (this.bridge.verts.length > 0)) {
			return true;
		}
		return false;
	}
	
	updateGfx() {
		if (this.gfxObject == null) {
			return;
		}
		this.gfxObject.attr({cx: toPixelsX(this.pos.x), cy: toPixelsY(this.pos.y)});
	}
	
	updateTest(forceGravity, deltaTime) {
		if (this.isTestFinished() || (this.bridge == null)) {
			return;
		}
		
		// Motion (from velocity & just force it right)...
		this.vel.add(vec2.multiply(forceGravity, deltaTime));
		this.pos.add(vec2.multiply(this.vel, deltaTime));
		this.pos.add(vec2.multiply(vec2.right(), this.travelSpeed));
		
		// Figure out which nodes are contacting the load...
		let contactNodes = []; // { node:SimNode, percent:float }
		for (let i = 0; i < this.bridge.simNodes.length; ++i) {
			let node = this.bridge.simNodes[i];
			
			// Figure out if the load is touching it (all links out)...
			for (let j = 0; j < node.links.length; ++j) {
				let simLink = node.links[j];
				let otherNode = sim.bridge.simNodes[simLink.toNodeId];
				if (!simLink.isFloor) {
					continue;
				}
				if (otherNode.pos.x < node.pos.x) { // Nodes have both links, so we'd test twice without this...
					continue; 
				}
				let result = intersectSphereSegment(this.pos, this.radius, node.pos, vec2.subtract(otherNode.pos, node.pos));
				if (result.intersects) {
					// Push back out...
					let curDst = vec2.distance(this.pos, result.closestPoint);
					let pushDst = Math.max(this.radius - curDst, 0);
					let pushVec = vec2.multiply(vec2.subtract(this.pos, result.closestPoint).unit(), pushDst);
					this.pos.add(pushVec);
					
					// Add the nodes, push push them down once we figure out the number we have...
					contactNodes.push({ node:node, percent: 1-result.closestPointT });
					contactNodes.push({ node:otherNode, percent: result.closestPointT });
				}
			}
		}

		// Apply force to contacted nodes...
		if (contactNodes.length > 0) {
			// We're just going to distribute the load equally to all nodes (note that if a node may be in there multiple times & get m the load)...
			let sumOfContactNodeFactors = contactNodes.length / 2; //Note: pairs sum to one, so...
			let perNodeForce = vec2.multiply(forceGravity, this.mass / sumOfContactNodeFactors); 
			for (let i = 0; i < contactNodes.length; ++i) {
				let node = contactNodes[i].node;
				if (!node.fixed) {
					node.netForce.add(vec2.multiply(perNodeForce, contactNodes[i].percent));
				}
			}
		}
	}
}

class SimNodeLink {
	constructor(length, toNodeId, isFloor) {
		this.length = length;
		this.toNodeId = toNodeId;
		this.isFloor = isFloor;
		
		// Link stress/strain scalar (depending on length, gets stronger as it gets shorter - the scalar is smaller when this happens)...
		this.stressStrainScalar = Math.max(Math.min(1.5, this.length / 3), 0.5);
		
		// Track stress/strain forces...
		this.lastSim_dirOffset = 0;
		this.lastSim_latOffset = 0;
		this.maxSim_dirOffset = 0;
		this.maxSim_latOffset = 0;
	}
}

class SimNode {
	constructor(pos, nodeId, parentBridgeSegment, vertId = -1, fixed = false) {
		this.pos = vec2.copy(pos);
		this.posPrev = vec2.copy(pos);
		this.vel = vec2.zero();
		this.netForce = vec2.zero();
		this.nodeId = nodeId;
		this.parentBridgeSegment = parentBridgeSegment;
		this.vertId = vertId;
		this.fixed = fixed;
		this.links = [];
		this.timeOverMaxStress = 0;
		this.debugGfx = null;
	}
	
	addLink(toNodeId, isFloor) {
		let otherNode = sim.bridge.simNodes[toNodeId];
		let length = this.pos.distance(otherNode.pos);
		
		// Note that every link is bi-directional, both nodes get it...
		this.links.push(new SimNodeLink(length, toNodeId, isFloor));
		otherNode.links.push(new SimNodeLink(length, this.nodeId, isFloor));
	}
	getLinkToNode(toNodeId) {
		for (let i = 0; i < this.links.length; ++i) {
			if (this.links[i].toNodeId == toNodeId) {
				return this.links[i];
			}
		}
		return null;
	}
	removeLinkToNode(toNodeId) {
		for (let i = 0; i < this.links.length; ++i) {
			if (this.links[i].toNodeId == toNodeId) {
				this.links.splice(i, 1);
				return true;
			}
		}
		return false;
	}
	
	createDebugGfx() {
		this.debugGfx = raphael.circle(toPixelsX(this.pos.x), toPixelsY(this.pos.y), 8);
        this.debugGfx.attr({stroke: 'black', 'stroke-width': 2, fill: 'red'});
	}
	updateDebugGfx() {
		if (this.debugGfx != null) {
			this.debugGfx.attr({cx: toPixelsX(this.pos.x), cy: toPixelsY(this.pos.y)});
			this.debugGfx.toFront();
		}
	}
	removeDebugGfx() {
		if (this.debugGfx != null) {
			this.debugGfx.remove();
			this.debugGfx = null;
		}
	}
}

class BridgeVertex {
	constructor(pos, fixed = false) {
		this.pos = pos;
		this.fixed = fixed;
	}
}

class BridgeSegment {
	constructor(vertId0, vertId1, isFloor = false) { // vertex IDs (ints)
		this.vertId0 = vertId0;
		this.vertId1 = vertId1;
		this.isFloor = isFloor;
		this.gfxObjects = [];
		this.simNodes = [];
	}
	
	getVert(index) {
		return (index == 0) ? sim.bridge.verts[this.vertId0] : sim.bridge.verts[this.vertId1];
	}
	
	length() {
		return this.getVert(0).pos.distance(this.getVert(1).pos);
	}
	
	intersectsSphere(center, radius) { // Returns { intersects:bool, closestPoint:vec2, closestPointT:float }
		let segP0 = this.getVert(0).pos;
		let segP1 = this.getVert(1).pos;
		return intersectSphereSegment(center, radius, segP0, vec2.subtract(segP1, segP0));
	}
	
	// Graphics...
	createGfx() {
		// Consts...
		const subdivideWithSimNodes = (this.simNodes.length > 0);

		// Reset any left over...
		this.resetGfx();
		
		// If we are using the sim nodes, then we have some stepping to do...
		if (!subdivideWithSimNodes) {
			this.createGfxSegment(this.getVert(0).pos, this.getVert(1).pos);
		}
		else {
			for (let i = 1; i < this.simNodes.length; ++i) {
				let p0 = this.simNodes[i-1].pos;
				let p1 = this.simNodes[i].pos;
				let nodeLink0 = this.simNodes[i].getLinkToNode(this.simNodes[i-1].nodeId);
				let nodeLink1 = this.simNodes[i-1].getLinkToNode(this.simNodes[i].nodeId);
				if ((nodeLink0 != null) && (nodeLink1 != null)) {
					this.createGfxSegment(p0, p1, nodeLink0, nodeLink1);
				}
			}
		}
	}	
	resetGfx() {
		for (let i = 0; i < this.gfxObjects.length; ++i) {
			if (this.gfxObjects[i] != null) {
				this.gfxObjects[i].remove();
				this.gfxObjects[i] = null;
			}
		}
		this.gfxObjects = [];
	}
	createGfxSegment(p0, p1, nodeLink0, nodeLink1) {
		// Consts...
		const gfxSegThickness = 0.4;

		// Setup...
		let dirVec = vec2.subtract(p1, p0);
		let segLen = dirVec.length();
		let angle = -Math.atan2(dirVec.y, dirVec.x);
		
		// Represent stress/strain with forces...
		let color = this.calcLinkSimColor(nodeLink0, nodeLink1);
		
		// Do the create...
		let gfx = raphael.rect(toPixelsX(p0.x), toPixelsY(p0.y + gfxSegThickness/2), toPixelsLength(segLen), toPixelsLength(gfxSegThickness), 3);
		gfx.attr({ fill: color, stroke: this.isFloor ? 'blue' : 'black', 'stroke-width': 3 });
		gfx.attr({ transform:"R"+R2D(angle)+","+toPixelsX(p0.x)+","+toPixelsY(p0.y) });
		this.gfxObjects.push(gfx);
	}
	calcLinkSimColor(nodeLink0, nodeLink1) {
		// Check for null...
		if ((nodeLink0 == null) || (nodeLink1 == null)) {
			return 'gray';
		}
		
		// Convert to zero to one..
		let lastSim_dirOffset = Math.max(nodeLink0.lastSim_dirOffset, nodeLink1.lastSim_dirOffset);
		let lastSim_latOffset = Math.max(nodeLink0.lastSim_latOffset, nodeLink1.lastSim_latOffset);
		let zeroToOne = Math.min(Math.max(lastSim_dirOffset / sim.maxDirOffset, lastSim_latOffset / sim.maxLatOffset), 1);

		// Convert to color...
		return HSVToRGBHex(0.5 * (1 - zeroToOne), 0.0 + zeroToOne * 1.0, 0.5 +  zeroToOne * 0.15);
	}
}

class Bridge {
	constructor() {
		this.hasBrokenLinks = false;
		this.verts = [];		// Array of BridgeVertex
		this.segs = [];			// Array of BridgeSegment
		this.gfx = [];
		this.simNodes = [];		// Array of SimNode
	}
	
	addVertex(pt, addToSegIdx = -1) {
		// Create up the new vertex...
		let isFixed = this.isPointSupportedByGround(pt);
		this.verts.push(new BridgeVertex(pt, isFixed));
		let newVertIdx = this.verts.length - 1;
		
		// If we're adding it to an existing segment, need to split that segment...
		if (addToSegIdx >= 0) {
			let segment = this.segs[addToSegIdx];
			segment.resetGfx();
			this.addSegment(newVertIdx, segment.vertId1, segment.isFloor);
			segment.vertId1 = newVertIdx;
		}
		
		return newVertIdx;
	}
	
	addSegment(vertId0, vertId1, isFloor) {
		this.segs.push(new BridgeSegment(vertId0, vertId1, isFloor));
	}
	
	reset() {
		this.hasBrokenLinks = false;
		this.resetGfx();
		this.resetSim();
		this.verts = [];
		this.segs = [];
	}
	
	// Utils...
	isPointSupportedByGround(pt, radius = 2) {
		return (inRect(landLeft, pt.x, pt.y, radius) || inRect(landRight, pt.x, pt.y, radius));
	}
	vertHasFloorSegment(idx) {
		for (let i = 0; i < this.segs.length; ++i) {
			if (this.segs[i].isFloor && ((this.segs[i].vertId0 == idx) || (this.segs[i].vertId1 == idx))) {
				return true;
			}
		}
		return false;
	}
	vertReferencedByAnySegment(idx) {
		for (let i = 0; i < this.segs.length; ++i) {
			if ((this.segs[i].vertId0 == idx) || (this.segs[i].vertId1 == idx)) {
				return true;
			}
		}
		return false;
	}
	deleteAnyStrayVerts() {
		this.resetGfx();
		this.resetSim();
		for (let i = 0; i < this.verts.length; ) {
			if (!this.vertReferencedByAnySegment(i)) {
				this.verts.splice(i, 1);
				
				// Need to update vert references in the segments...
				for (let j = 0; j < this.segs.length; ++j) {
					if (this.segs[j].vertId0 >= i) {
						this.segs[j].vertId0 -= 1;
					}
					if (this.segs[j].vertId1 >= i) {
						this.segs[j].vertId1 -= 1;
					}
				}

				// Next...
				continue;
			}
			++i;
		}
	}
	calcTotalFloorLength() {
		let totalFloor = 0;
		for (let i = 0; i < this.segs.length; ++i) {
			if (this.segs[i].isFloor) {
				let node0 = this.verts[this.segs[i].vertId0];
				let node1 = this.verts[this.segs[i].vertId1];
				totalFloor += node0.pos.distance(node1.pos);
			}
		}
		return totalFloor;
	}
	
	// Graphics...
	createGfx() {
		// Loop through the segments, creating rectangles for each...
		for (let i = 0; i < this.segs.length; ++i) {
			this.segs[i].createGfx();
		}
	}
	updateGfx() {
		// Sync the vertices with the simulation...
		for (let i = 0; i < this.simNodes.length; ++i) {
			let node = this.simNodes[i];
			if (node.vertId >= 0) {
				let vertex = this.verts[node.vertId];
				if (!vertex.fixed) {
					vertex.pos = node.pos;
				}
			}
		}
		
		// And re-create graphics (could optimize this to update only...
		this.resetGfx();
		this.createGfx();
	}
	resetGfx() {
		for (let i = 0; i < this.segs.length; ++i) {
			if (this.segs[i] != null) {
				this.segs[i].resetGfx();
			}
		}
		for (let i = 0; i < this.gfx.length; ++i) {
			if (this.gfx[i] != null) {
				this.gfx[i].remove();
				this.gfx[i] = null;
			}
		}
		this.gfx = [];
	}
	
	// Simulation...
	createSim(subNodesPerUnit = 0.2) {
		// Start with a reset, just to be sure...
		this.resetSim();
		
		// Loop over all segments creating subNodes & simNodeLinks...
		for (let i = 0; i < this.segs.length; ++i) {
			let bridgeSegment = this.segs[i];
			let segLength = bridgeSegment.length();
			let subNodeCount = 2 + Math.floor(segLength * subNodesPerUnit);
			let prevNode = null;
			for (let j = 0; j < subNodeCount; ++j) {
				// Node...
				let node = null;
				let nodeId = this.simNodes.length;
				if (j == 0) {
					// First node (matches vertex)...
					node = this.getSimNodeForVert(bridgeSegment.vertId0);
					if (node == null) {
						let vertex = bridgeSegment.getVert(0);
						node = new SimNode(bridgeSegment.getVert(0).pos, nodeId, bridgeSegment, bridgeSegment.vertId0, vertex.fixed);
						this.simNodes.push(node);
					}
					bridgeSegment.simNodes.push(node);
				}
				else if (j == (subNodeCount - 1)) {
					// Last node (matches vertex)...
					node = this.getSimNodeForVert(bridgeSegment.vertId1);
					if (node == null) {
						let vertex = bridgeSegment.getVert(1);
						node = new SimNode(bridgeSegment.getVert(1).pos, nodeId, bridgeSegment, bridgeSegment.vertId1, vertex.fixed);
						this.simNodes.push(node);
					}
					bridgeSegment.simNodes.push(node);
				}
				else {
					// Interpolated node...
					let t = j / (subNodeCount - 1);
					let pos = vec2.lerp(bridgeSegment.getVert(0).pos, bridgeSegment.getVert(1).pos, t);
					node = new SimNode(pos, nodeId, bridgeSegment);
					this.simNodes.push(node);
					bridgeSegment.simNodes.push(node);
				}
				
				// Connections...
				if (prevNode != null) {
					node.addLink(prevNode.nodeId, bridgeSegment.isFloor);
				}
				
				// Ready for next...
				prevNode = node;
			}
		}
	}
	getSimNodeForVert(vertId) {
		for (let i = 0; i < this.simNodes.length; ++i) {
			let node = this.simNodes[i];
			if (node.vertId == vertId) {
				return node;
			}
		}
		return null;
	}
	createDebugGfx() {
		for (let i = 0; i < this.simNodes.length; ++i) {
			this.simNodes[i].createDebugGfx();
		}
	}
	updateDebugGfx() {
		for (let i = 0; i < this.simNodes.length; ++i) {
			this.simNodes[i].updateDebugGfx();
		}
	}
	resetSim() {
		this.hasBrokenLinks = false;
		for (let i = 0; i < this.simNodes.length; ++i) {
			this.simNodes[i].removeDebugGfx();
		}
		this.simNodes = [];
	}
}

class Simulation {
	constructor() {
		// Consts...
		this.fixedTimeStep = 1/60;
		this.useVerletIntegration = true;
		this.rigidityK = 2000;
		this.compressionK = 20000;
		this.tensionK = 20000;
		this.testLoadRadius = 3;
		this.testLoadDensity = 10;
		this.testLoadTravelSpeed = 0.1; //0.075;
		
		// Consts: max stress/strain...
		this.maxDirOffset = 0.045;			// These are for "default" segment lengths & they are increased/decrease with shorter/longer segments
		this.maxLatOffset = 0.15;			// These are for "default" segment lengths & they are increased/decrease with shorter/longer segments
		this.maxBreakFactor = 1.5; 			// How much over the max it needs to go before breaking...
		this.minTimeAtStressForBreak = 0.25;
		
		// Member variables...
		this.bridge = new Bridge();
		this.testLoad = null;
		this.timeToSim = 0;
		this.timeReadyToStopSim = 0;
		
		// Track test stress/strain numbers...
		this.statsMax_dirOffset = 0;
		this.statsMax_latOffset = 0;
	}
	
	reset() {
		this.bridge.reset();
		if (this.testLoad != null) {
			this.testLoad.term();
			this.testLoad = null;
		}
		this.timeReadyToStopSim = 0;
		this.statsMax_dirOffset = 0;
		this.statsMax_latOffset = 0;
	}
	
	createBridgeGfx() {
		this.bridge.resetGfx();
		this.bridge.createGfx();
	}
	updateGfx() {
		this.bridge.updateGfx();
		if (this.testLoad != null) {
			this.testLoad.updateGfx();
		}
	}

	isSimCreated() {
		return (this.bridge.simNodes.length > 0);
	}
	createSim() {
		this.bridge.resetSim();
		this.bridge.createSim();
	}
	
	beginTest() {
		this.textLoadMass = Math.PI * Math.pow(this.testLoadRadius, 0.35) * this.testLoadDensity;
		if (this.testLoad != null) {
			this.testLoad.term();
			this.testLoad = null;
		}
		this.testLoad = new LoadSphere(this.testLoadRadius, this.textLoadMass, this.testLoadTravelSpeed);
		this.testLoad.create(this.bridge);

		// Internal sim data...
		this.timeToSim = 0;
		
		// Stats reset...
		for (let i = 0; i < this.bridge.simNodes.length; ++i) {
			let node = this.bridge.simNodes[i];
			for (let j = 0; j < node.links.length; ++j) {
				let nodeLink = node.links[j];
				nodeLink.maxSim_dirOffset = 0;
				nodeLink.maxSim_latOffset = 0;
			}
		}
		this.statsMax_dirOffset = 0;
		this.statsMax_latOffset = 0;
	}
	endTest() {
		if (this.testLoad != null) {
			this.testLoad.term();
		}
	}
	
	createDebugGfx() {
		this.bridge.createDebugGfx();
	}
	updateDebugGfx() {
		this.bridge.updateDebugGfx();
	}
	updateTestStats() {
		setTestStats(0, "Max tension/compression: " + Math.round(this.statsMax_dirOffset / this.maxDirOffset * 100) + "%");
		setTestStats(1, "Max lateral bend: " + Math.round(this.statsMax_latOffset / this.maxLatOffset * 100) + "%");
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
		this.updateTestStats();
		return true;
	}
		
	updateFixed(deltaTime) {
		// Consts...
		const massPerSimNode = 10;
		const forceGravity = new vec2(0, -9.8);
		
		// Setup...
		let bridge = this.bridge;
		let simNodes = bridge.simNodes;

		// Damping...
		const velDamper = this.useVerletIntegration ? Math.max(1 - deltaTime * (bridge.hasBrokenLinks ? 0.25 : 1.0), 0.1) : Math.max(1 - deltaTime * 15, 0.5);  	// note: 1 is no damping (this is a multiplier)...

		// Reset the netForce on each node...
		for (let i = 0; i < simNodes.length; ++i) {
			simNodes[i].netForce = vec2.zero();
		}
		
		// Test load...
		if (this.testLoad != null) {
			this.testLoad.updateTest(forceGravity, deltaTime);
		}
		
		// Loop through all the simNodes computing the net force from its connections using Hooks law and applying it to velocity...
		for (let i = 0; i < simNodes.length; ++i) {
			let node = simNodes[i];
			if (node.fixed) {
				continue;
			}
			
			// Compute net force from all links (tension & compression)...
			for (let j = 0; j < node.links.length; ++j) {
				// Setup...
				let nodeLink = node.links[j];
				let otherNode = simNodes[nodeLink.toNodeId];
				
				// Spring force...
				let delta = vec2.subtract(otherNode.pos, node.pos);
				let deltaLen = delta.length();
				let deltaUnit = vec2.multiply(delta, 1 / deltaLen);
				let offsetLen = delta.length() - nodeLink.length;
				let force = (offsetLen >= 0) ? vec2.multiply(deltaUnit, offsetLen * sim.tensionK) : vec2.multiply(deltaUnit, offsetLen * sim.compressionK);
				
				// Track stress/strain forces...
				nodeLink.lastSim_dirOffset = Math.abs(offsetLen) * nodeLink.stressStrainScalar;
				nodeLink.maxSim_dirOffset = Math.max(Math.abs(offsetLen), nodeLink.maxSim_dirOffset);
				this.statsMax_dirOffset = Math.max(this.statsMax_dirOffset, nodeLink.maxSim_dirOffset);
				
				// Sum it up...
				node.netForce.add(force);
			}
			
			// If it's a middle node, apply rigidity force...
			if ((node.vertId == -1) && (node.links.length == 2)) {
				let link0 = simNodes[node.links[0].toNodeId].pos;
				let link1 = simNodes[node.links[1].toNodeId].pos;
				let midPt = vec2.add(link0, link1).multiply(0.5);
				let delta = vec2.subtract(midPt, node.pos);
				let force = vec2.multiply(delta, sim.rigidityK);
				node.netForce.add(force);
				
				// Track stress/strain forces (this code: based on sim node bend from prev to next sim node)...
				let latOffset = delta.length() * ((node.links[0].stressStrainScalar + node.links[1].stressStrainScalar)/2);
				node.links[0].lastSim_latOffset = latOffset;
				node.links[1].lastSim_latOffset = latOffset;
				node.links[0].maxSim_latOffset = Math.max(Math.abs(latOffset), node.links[0].maxSim_latOffset);
				node.links[1].maxSim_latOffset = Math.max(Math.abs(latOffset), node.links[1].maxSim_latOffset);
				this.statsMax_latOffset = Math.max(this.statsMax_latOffset, node.links[0].maxSim_latOffset);
				
				// Track stress/strain forces (this code: based on bend from vertex to vertex)...
				//let bridgeSegP0 = node.parentBridgeSegment.getVert(0).pos;
				//let bridgeSegP1 = node.parentBridgeSegment.getVert(1).pos;
				//let bendAngleRad = Math.abs(Math.acos(vec2.subtract(bridgeSegP1, bridgeSegP0).unit().dot(vec2.subtract(node.pos, bridgeSegP0).unit())));
				//node.links[0].lastSim_latOffset = bendAngleRad;
				//node.links[1].lastSim_latOffset = bendAngleRad;
				//node.links[0].maxSim_latOffset = Math.max(Math.abs(bendAngleRad), node.links[0].maxSim_latOffset);
				//node.links[1].maxSim_latOffset = Math.max(Math.abs(bendAngleRad), node.links[1].maxSim_latOffset);
				//this.statsMax_latOffset = Math.max(this.statsMax_latOffset, node.links[0].maxSim_latOffset);
			}
			
			// Maybe break the node (too much stress/strain)...
			for (let j = 0; j < node.links.length; ++j) {
				let nodeLink = node.links[j];
				if ((nodeLink.lastSim_dirOffset > (this.maxDirOffset * this.maxBreakFactor)) || 
				    (nodeLink.lastSim_latOffset > (this.maxLatOffset * this.maxBreakFactor))) {
					nodeLink.timeOverMaxStress += deltaTime;
				}
				else {
					nodeLink.timeOverMaxStress = 0;
				}
				if (nodeLink.timeOverMaxStress >= this.minTimeAtStressForBreak) {
					// Break the link...
					let otherNode = simNodes[nodeLink.toNodeId];
					otherNode.removeLinkToNode(node.nodeId);
					if (node.removeLinkToNode(nodeLink.toNodeId)) {
						--j;
						bridge.hasBrokenLinks = true;
						continue;
					}
				}
			}
			
			// Gravity...
			node.netForce.add(forceGravity);
		}
		
		// Apply force to velocity & position...
		for (let i = 0; i < simNodes.length; ++i) {
			let node = simNodes[i];
			if (node.fixed) {
				continue;
			}
			
			// Use Verlet integratino to keep ti stable...
			if (this.useVerletIntegration) {
				let posPrev = v2(node.pos.x, node.pos.y);
				
				// x(t + dt) = x(t) + v(t) dt + 1/2 a(t) dt^2  <-- starts with this...
				// x(t + dt) = 2 x(t) - x(t - dt) + a(t) dt^2  <-- this is a modification using previous position (reduces error)...
				node.pos.add(vec2.subtract(node.pos, node.posPrev).multiply(velDamper));
				node.pos.add(vec2.multiply(node.netForce, deltaTime * deltaTime / massPerSimNode));
				node.posPrev = posPrev;
			}
			else {
				// Apply to velocity...
				let velAdd = vec2.multiply(node.netForce, deltaTime / massPerSimNode);
				node.vel.add(velAdd);
				
				// Clamp velocity (help keep it stable)...
				const maxVel = 1.5;
				if (node.vel.lengthSqr() > (maxVel * maxVel)) {
					node.vel = node.vel.unit().multiply(maxVel);
				}
				
				// And velocity to position...
				node.pos.add(vec2.multiply(node.vel, deltaTime));
			}
		}
	
		// Damp velocities...
		for (let i = 0; i < simNodes.length; ++i) {
			let node = simNodes[i];
			node.vel.multiply(velDamper);
		}
		if (this.testLoad != null) {
			this.testLoad.vel.multiply(velDamper);
		}

		return true;
	}
	
	shouldStopSimulation(deltaTime = 0) {
		// Consts...
		const maxVelForStability = 0.01;
		const minTimeReadyBeforeWeCallIt = 3;
		
		// Setup...
		let bridge = this.bridge;
		let simNodes = bridge.simNodes;
		
		// Check to see if everything has settled out (velocity on simNodes)...
		let readyToStop = true;
		for (let i = 0; i < simNodes.length; ++i) {
			let node = simNodes[i];
			if (node.fixed) {
				continue;
			}
			if (this.useVerletIntegration) {
				if ((vec2.distance(node.pos, node.posPrev) / this.fixedTimeStep / 2) > maxVelForStability) {
					readyToStop = false;
					break;
				}
			}
			else {
				if (node.vel.length() > maxVelForStability) {
					readyToStop = false;
					break;
				}
			}
		}
		
		// If we have a test going on, then not done...
		if ((this.testLoad != null) && !this.testLoad.isTestFinished()) {
			readyToStop = false;
		}
		
		// Timer...
		this.timeReadyToStopSim = readyToStop ? (this.timeReadyToStopSim + deltaTime) : 0;
		
		return (this.timeReadyToStopSim > minTimeReadyBeforeWeCallIt);
	}
}
