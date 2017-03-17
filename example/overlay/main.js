'use strict';

const Foglet = require('foglet');

let o = [];

const max = 10;

$.ajax({
	url : 'https://service.xirsys.com/ice',
	data : {
		ident: 'folkvir',
		secret: 'a0fe3e18-c9da-11e6-8f98-9ac41bd47f24',
		domain: 'foglet-examples.herokuapp.com',
		application: 'foglet-examples',
		room: 'sparqldistribution',
		secure: 1
	},
	success: function (response, status) {
		let iceServers;
		if (response.d.iceServers) {
			iceServers = response.d.iceServers;
		}

		console.log(iceServers, status);
		const ices = [];
		iceServers.forEach(ice => {
			console.log(ice);
			if(ice.credential && ice.username) {
				ices.push({ urls: ice.url, credential: ice.credential, username: ice.username });
			} else {
				ices.push({ urls: ice.url });
			}
		});
		console.log(ices);



		for(let i = 0; i < max; ++i) {
			o[i] = new Foglet({
				webrtc:	{
					trickle: false,
					iceServers : []
				},
				p: 100,
				m: 10,
				deltatime: (i+1) * 2 * 1000 + 60 * 1000, // 20s min + (i+1)*2secondes 
				timeout: 30 * 1000,
				enableOverlay: true,
				room:'foglet-overlay',
				signalingAdress: 'http://localhost:3000',
				verbose:true
			});
		}

		o.forEach(p => {
			console.log(p.options.spray);
			p.options.spray.on('shuffling', (reason) => {
				console.log('Shuffle: ', reason);
				setTimeout(function () {
					if(p.options.enableOverlay) {
						drawBoth();
					} else {
						drawRps();
					}
				}, 2000);
			});
		});
	}
});



const connection = (time2wait = 1000) => {
	for (let i = 0; i < max; ++i) {
		(function (ind) {
			setTimeout(function () {
				o[ind].connection().then(d =>{
					console.log(d);
				});
			}, (time2wait * ind));
		})(i);
	}
};

const run = () => {
	o.forEach(p => p.options.overlay.on('receive', (signal, data) => {
		console.log(signal, data);
	}));
	o.forEach(p => p.options.overlay.run());
};

const exchange = (time2wait = 500) => {
	let i = 0;
	o.forEach(p => {
		(function (ind) {
			setTimeout(function () {
				console.log('Shuffle:', (time2wait * ind));
				p.options.spray.exchange();
			}, (time2wait * ind));
		})(i);
		++i;
	});
};

const init = (limit = -1) => {
	o.forEach(p => console.log(p.options.overlay.init(limit)));
};

const getViews = () => {
	o.forEach(p => console.log(p.options.overlay.getViews()));
};

const peers = () => {
	o.forEach(p => console.log(p.options.spray.getPeers()));
};

const neigh = () => {
	o.forEach(p => console.log(p.options.overlay.getNeighbours()));
};

// ======================================================================================================================
// ================================================== GRAPH CONSTRUCTION ================================================
// ======================================================================================================================
const d3 = window.d3;

let linkRps, nodeRps, textRps, linkOverlay, nodeOverlay, textOverlay;
let svgRps, svgOverlay;
let colorRps = d3.scale.category20();
let colorOverlay = d3.scale.category20();
let userColorRps = [], userColorOverlay = [];

const constructRpsGraph = ()  => {
	let result = [];
	let i = 0;
	o.forEach(over => {
		userColorRps[over.options.spray.neighborhoods.o.ID+'$'+over.options.spray.neighborhoods.i.ID] = {
			color: colorRps(i),
			description: `#i:${over.options.spray.getPeers().i.length} | #o:${over.options.spray.getPeers().o.length}`
		};
		userColorRps[over.options.spray.neighborhoods.o.ID] = over.options.spray.neighborhoods.i.ID;
		userColorRps[over.options.spray.neighborhoods.i.ID] = over.options.spray.neighborhoods.o.ID;
		i++;
	});

	o.forEach(over => {
		if(over.options.spray.getPeers().o.length === 0) {
			result.push({
				source: over.options.spray.neighborhoods.o.ID+'$'+over.options.spray.neighborhoods.i.ID,
				target: over.options.spray.neighborhoods.o.ID+'$'+over.options.spray.neighborhoods.i.ID,
				data: {
					colorLink: '#FF3737'
				}
			});
		}

		over.options.spray.getPeers().o.forEach(p => {
			result.push({
				source: over.options.spray.neighborhoods.o.ID+'$'+over.options.spray.neighborhoods.i.ID,
				target: userColorRps[p]+'$'+p,
				data: {
					colorLink: '#FF3737'
				}
			});
		});

	});


	return result;
};

// const  arrayObjectIndexOf = (myArray, searchTerm, property) => {
// 	for(let i = 0, len = myArray.length; i < len; i++) {
// 		if (myArray[i][property] === searchTerm) return i;
// 	}
// 	return -1;
// };

const constructOverlayGraph = ()  => {
	let result = [];
	let i = 0;
	o.forEach(over => {
		let sock = over.options.overlay.overlay.socket;
		userColorOverlay[sock.outviewId+'$'+sock.inviewId] = {
			color: colorOverlay(i),
			description: `Cycles:${over.options.overlay.overlay.cycles} (Out:${over.options.overlay.getNeighbours().outview.length})`,
			views: over.options.overlay.getViews(),
			profile: over.options.overlay.overlay.descriptor
		};
		userColorOverlay[sock.outviewId] = sock.inviewId;
		userColorOverlay[sock.inviewId] = sock.outviewId;
		i++;
	});
	o.forEach(over => {
		let sock = over.options.overlay.overlay.socket;
		const views = userColorOverlay[sock.outviewId+'$'+sock.inviewId].views;

		if(views.length === 0) {
			result.push({
				source: sock.outviewId+'$'+sock.inviewId,
				target: sock.outviewId+'$'+sock.inviewId,
				data: {
					colorLink: '#FF3737'
				}
			});
		} else {
			views.forEach(v => {

				result.push({
					source: sock.outviewId+'$'+sock.inviewId,
					target: v.profile.outviewId+'$'+v.profile.inviewId,
					data: {
						label: `PING:${v.profile.ping.value}`,
						colorLink: '#FF3737'
					}
				});
			});
		}
	});
	return result;
};

const drawRpsGraph = () => {
	let nodes = {};
	let links = constructRpsGraph();

	// Compute the distinct nodes from the links.
	links.forEach(function (link) {
		link.source = nodes[link.source] || (nodes[link.source] = {name: link.source, data: link.data});
		link.target = nodes[link.target] || (nodes[link.target] = {name: link.target, data: link.data});
	});

	let width = document.getElementById('graphRps').offsetWidth,
		height = document.getElementById('graphRps').offsetHeight;

	svgRps = d3.select('#graphRps').append('svg')
	.attr('width', width)
	.attr('height', height);

	let force = d3.layout.force()
		.nodes(d3.values(nodes))
		.links(links)
		.size([ width, height ])
		.linkDistance(200)
		.charge(-500)
		.on('tick', tickRps)
		.start();

	// build the arrow.
	svgRps.append('defs').selectAll('marker')
		.data( [ 'endRps' ] )      // Different link/path types can be defined here
		.enter().append('marker')    // This section adds in the arrows
		.attr('id', String).attr('viewBox', '0 -5 10 10').attr('refX', 15)
		.attr('refY', -1.5).attr('markerWidth', 6).attr('markerHeight', 6)
		.attr('orient', 'auto').append('path').attr('d', 'M0,-5L10,0L0,5');

	linkRps = svgRps.append('g').selectAll('path')
		.data(force.links())
		.enter().append('path')
		.attr('class', 'link').attr('marker-end', 'url(#endRps)')
		.style('stroke', function (d) {
			return d.data.colorLink;
		})
		.style('fill', 'none');


	nodeRps = svgRps.append('g').selectAll('circle')
		.data(force.nodes())
		.enter().append('circle')
		.attr('r', 6)
		.style('fill', function (d) {
			return userColorRps[d.name].color;
		})
		.on('mouseover', mouseover)
		.on('mouseout', mouseout)
		.call(force.drag);

	textRps = svgRps.append('g').selectAll('text')
		.data(force.nodes())
		.enter().append('text')
		.attr('x', 8)
		.attr('y', '.31em')
		.text(function (d) {
			return userColorRps[d.name].description;
		});

};

const drawOverlayGraph = () => {
	let nodes = {};
	let links = constructOverlayGraph();

	// Compute the distinct nodes from the links.
	links.forEach(function (link) {
		link.source = nodes[link.source] || (nodes[link.source] = {name: link.source, data: link.data});
		link.target = nodes[link.target] || (nodes[link.target] = {name: link.target, data: link.data});
	});

	let width = document.getElementById('graphOverlay').offsetWidth,
		height = document.getElementById('graphOverlay').offsetHeight;

	svgOverlay = d3.select('#graphOverlay').append('svg')
	.attr('width', width)
	.attr('height', height);



	let force = d3.layout.force()
		.nodes(d3.values(nodes))
		.links(links)
		.size([ width, height ])
		.linkDistance(200)
		.charge(-500)
		.on('tick', tickOverlay)
		.start();

	// build the arrow.
	svgOverlay.append('defs').selectAll('marker')
		.data( [ 'endOverlay' ] )      // Different link/path types can be defined here
		.enter().append('marker')    // This section adds in the arrows
		.attr('id', String).attr('viewBox', '0 -5 10 10').attr('refX', 15)
		.attr('refY', -1.5).attr('markerWidth', 6).attr('markerHeight', 6)
		.attr('orient', 'auto').append('path').attr('d', 'M0,-5L10,0L0,5');

	linkOverlay = svgOverlay.append('g').selectAll('path')
		.data(force.links())
		.enter().append('path')
		.attr('class', 'link').attr('marker-end', 'url(#endOverlay)')
		.style('stroke', function (d) {
			return d.data.colorLink;
		})
		.style('fill', 'none');

	nodeOverlay = svgOverlay.append('g').selectAll('circle')
		.data(force.nodes())
		.enter().append('circle')
		.attr('r', 6)
		.style('fill', function (d) {
			return userColorOverlay[d.name].color;
		})
		.on('mouseover', mouseoverOverlay)
		.on('mouseout', mouseoutOverlay)
		.call(force.drag);

	textOverlay = svgOverlay.append('g').selectAll('text')
		.data(force.nodes())
		.enter().append('text')
		.attr('x', 8)
		.attr('y', '.31em')
		.text(function (d) {
			return userColorOverlay[d.name].description;
		});
};

const drawRps = () => {
	if(svgRps) svgRps.remove();
	drawRpsGraph();
};

const drawOverlay = () => {
	if(svgOverlay) svgOverlay.remove();
	drawOverlayGraph();
};

const drawBoth = () => {
	drawRps();
	drawOverlay();
};

function linkArc (d) {
	let dx = d.target.x - d.source.x,	dy = d.target.y - d.source.y,	dr = Math.sqrt(dx * dx + dy * dy) * 4;
	return 'M' + d.source.x + ',' + d.source.y + 'A' + dr + ',' + dr + ' 0 0,1 ' + d.target.x + ',' + d.target.y;
}

function transform (d) {
	return 'translate(' + d.x + ',' + d.y + ')';
}

function tickOverlay () {
	linkOverlay.attr('x1', function (d) {
		return d.source.x;
	}).attr('y1', function (d) {
		return d.source.y;
	}).attr('x2', function (d) {
		return d.target.x;
	}).attr('y2', function (d) {
		return d.target.y;
	});
	linkOverlay.attr('d', linkArc);
	nodeOverlay.attr('transform', transform);
	textOverlay.attr('transform', transform);

}

function tickRps () {
	linkRps.attr('x1', function (d) {
		return d.source.x;
	}).attr('y1', function (d) {
		return d.source.y;
	}).attr('x2', function (d) {
		return d.target.x;
	}).attr('y2', function (d) {
		return d.target.y;
	});
	linkRps.attr('d', linkArc);
	nodeRps.attr('transform', transform);
	textRps.attr('transform', transform);
}


function mouseoverOverlay () {
	const d = d3.select(this).data()[0];
	console.log('profile', userColorOverlay[d.name].profile );
	console.log('views:', userColorOverlay[d.name].views);
}

function mouseoutOverlay () {
	d3.select(this).transition()
			.duration(750)
			.attr('r', 8);
}

function mouseover () {
	d3.select(this).transition()
			.duration(750)
			.attr('r', 16);
}

function mouseout () {
	d3.select(this).transition()
			.duration(750)
			.attr('r', 8);
}
