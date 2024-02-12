
// Creates a cube centered at the specified center (in its local space) with
//	each of its three dimensions having the specified size.
//
// The model is an object with these three propertes...
//	 model {
//      pos,	// an array of vec4 storing vertex positions, length always matches normals.length
//		norm,	// an array of vec3 storing vertex normals, length always matches positions.length
//		idx		// an array of ints storing the indices for each line segment, two indices per segment (segment count is indices.length / 2)
//   }
function createCube(size = 10, center = new vec3(0,0,0)) {
	let model = { 
		pos  : [],
		norm : [],
		idx  : []
	};
	let halfSize = size / 2;
	
	// Positions...
	model.pos.push( new vec3(-halfSize,  halfSize, -halfSize) ); // 0
	model.pos.push( new vec3( halfSize,  halfSize, -halfSize) ); // 1
	model.pos.push( new vec3( halfSize,  halfSize,  halfSize) ); // 2
	model.pos.push( new vec3(-halfSize,  halfSize,  halfSize) ); // 3
	model.pos.push( new vec3(-halfSize, -halfSize, -halfSize) ); // 4
	model.pos.push( new vec3( halfSize, -halfSize, -halfSize) ); // 5
	model.pos.push( new vec3( halfSize, -halfSize,  halfSize) ); // 6
	model.pos.push( new vec3(-halfSize, -halfSize,  halfSize) ); // 7
	
	// Normals...
	for (let i = 0; i < model.pos.length; ++i) {
		model.norm.push( vec3.unit( model.pos[i] ) );
	}
	
	// Recenter the positions to the requested center (note: need to do this after calculating normals)...
	for (let i = 0; i < model.pos.length; ++i) {
		model.pos[i].add( center );
	}
	
	// Indices...
	model.idx.push( 0 ); model.idx.push( 1 ); // Top
	model.idx.push( 1 ); model.idx.push( 2 );
	model.idx.push( 2 ); model.idx.push( 3 );
	model.idx.push( 3 ); model.idx.push( 0 );
	model.idx.push( 4 ); model.idx.push( 5 ); // Bot
	model.idx.push( 5 ); model.idx.push( 6 );
	model.idx.push( 6 ); model.idx.push( 7 );
	model.idx.push( 7 ); model.idx.push( 4 );
	model.idx.push( 0 ); model.idx.push( 4 ); // Sides
	model.idx.push( 1 ); model.idx.push( 5 );
	model.idx.push( 2 ); model.idx.push( 6 );
	model.idx.push( 3 ); model.idx.push( 7 );
	
	return model;
}