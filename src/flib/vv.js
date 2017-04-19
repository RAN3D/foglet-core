'use strict';

/**
 * the well-known version vector that characterizes causality between
 * updates
 * @param {string} id the entry chosen by the local site (1 entry <-> 1 site)
 */
function VV (id) {
	this._e = id;
	this._v = {};
	this._v[this._e] = 0;
}

/**
 * Return the clock representing this id
 * @return {object} {_e:id, _c:[0;N] } The clock
 */
VV.prototype.ec = function () {
	return {_e:this._e, _c:this._v[this._e]};
};


/**
 * Return a new VV from the object structure provided
 * @param {object} o The new structure
 * @return {VV} The new structure provided
 */
VV.prototype.from = function (o) {
	if(o._e && o._v) {
		let res = new VV(o._e);
		res._v = o._v;
		return res;
	} else {
		throw new Error('The new structure need to be conformed to: {_e: \'your-id\', _v: {} }');
	}
};

/**
 * Clone the current structure
 * @return {VV} The new structure provided
 */
VV.prototype.clone = function () {
	return this.from(this);
};

/**
 * Increment the entry of the vector on local update
 * @return {object} {_e: entry, _c: counter} uniquely identifying the operation
 */
VV.prototype.increment = function () {
	if (!(this._e in this._v)) {
		this._v[this._e] = 0;
	}
	this._v[this._e] += 1;
	return {_e: this._e, _c: this._v[this._e]};
};
/**
 * Increment the version vector with the incoming pair representing the
 * operation
 * @param {object} ec the entry clock of the received operation supposedly ready
 */
VV.prototype.incrementFrom = function (ec) {
	this._v[ec._e] = ec._c; // if ready, it means + 1 on the entry
};

/**
 * Check if the target ec is strictly lower than the local one. Probably
 * meaning that the information linked to it has already been delivered
 * @param {object} ec the entry and counter which identifies an operation
 */
VV.prototype.isLower = function (ec) {
	init(this._v, ec._e);
	return ((ec._e in this._v) && (ec._c <= this._v[ec._e]));
};

function init (a, k) {
	if(k && a && !a[k]) a[k] = 0;
}

/**
 * Check if the target VV is causally ready
 * @param {VV} vv the version vector to check
 */
VV.prototype.isReady = function (vv) {
	let ready = true;
	// #1 verify that all entry of this._v exists in vv
	let keys = Object.keys(this._v);
	let i = 0;
	while (ready && i<keys.length) {
		if (!(keys[i] in vv._v) || (this._v[keys[i]] > vv._v[keys[i]])) {
			ready = false;
		}
		++i;
	}

	// #2 verify that all entry of vv._v exists in this._v
	keys = Object.keys(vv._v);
	i = 0;
	while (ready && i<keys.length) {
		if ((keys[i] !== vv._e) && (!(keys[i] in this._v) || (this._v[keys[i]] > vv._v[keys[i]]))) {
			ready = false;
		}
		++i;
	}

	return (ready && ((vv._v[vv._e]===1) || ((vv._e in this._v) && (vv._v[vv._e] === (this._v[vv._e] +1) ))));
};

/**
 * Merge the VV provided with our VV
 * @return {VV} Return the new merge structure
 */
VV.prototype.merge = function (other) {
	let res = new VV(this._e);
	res._v = this._v;
	if(this._v && this._v && other._e && other._e) {
		Object.keys(other._v).forEach(k => {
			res._v[k] = Math.max(this._v[k]||0, other._v[k]||0);
		});
		return res;
	} else {
		throw new Error('It is not the right structure.');
	}
};

/**
 * Merge the VV provided with our VV
 * IMPORTANT: Supposed typeof _e === string
 * @return {VV|object} Return the new merge structure
 */
VV.prototype.equals = function (vv) {
	if(typeof vv === typeof VV || vv._e && vv._v) {
		let ourKeys = Object.keys(this._v);
		let vvKeys = Object.keys(vv._v);
		// If the length is different or ids are different
		if (ourKeys.length !== vvKeys.length || this._e === vv._e) {
			return false;
		}

		ourKeys.forEach(k => {
			if(!(k in vvKeys) || this._v[k] !== vvKeys[k]) return false;
		});
		vvKeys.forEach(k => {
			if(!(k in ourKeys) || this._v[k] !== vvKeys[k]) return false;
		});

		return true;
	} else {
		throw new Error('Not a VV or an object with the same values');
	}
};



module.exports = VV;
