
// Creates a sphere centered at the specified center (in its local space) with the specified radius.
//
// The model is an object with these three propertes...
//	 model {
//      pos,	// an array of vec4 storing vertex positions, length always matches normals.length
//		norm,	// an array of vec3 storing vertex normals, length always matches positions.length
//		idx		// an array of ints storing the indices for each line segment, two indices per segment (segment count is indices.length / 2)
//   }
function createSphere(radius = 10, radialSegments = 8, center = new vec3(0,0,0)) {
	let model = { 
		pos  : [],
		norm : [],
		idx  : []
	};
	
	// Positions...
	for (let y = 0; y < radialSegments * 2; ++y) {
		let rotZ = m3x3RotZ( -90 + 180 / (radialSegments - 1) * y );
		let basX = rotZ.transform( vec3.right() );
		for (let x = 0; x < radialSegments; ++x) {
			let rotY = m3x3RotY( 360 / radialSegments * x );
			let pos = rotY.transform( vec3.multiply(basX, radius) );
			model.pos.push( pos );
		}
	}
	
	// Normals...
	for (let i = 0; i < model.pos.length; ++i) {
		model.norm.push( vec3.unit( model.pos[i] ) );
	}
	
	// Recenter the positions to the requested center (note: need to do this after calculating normals)...
	for (let i = 0; i < model.pos.length; ++i) {
		model.pos[i].add( center );
	}
	
	// Indices...
	for (let y = 0; y < radialSegments - 1; ++y) {
		let baseIdx = y * radialSegments;
		for (let x = 0; x < radialSegments; ++x) {
			model.idx.push( baseIdx + x + 0 );
			model.idx.push( (x + 1 == radialSegments) ? baseIdx : baseIdx + x + 1 );
			model.idx.push( baseIdx + x + 0 );
			model.idx.push( baseIdx + x + radialSegments );
		}
	}
	
	return model;
}