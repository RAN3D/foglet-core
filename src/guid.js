/**
 * Adaptation in ES6 of the guid function provided by justayak
 * @url https://github.com/justayak/yutils/blob/master/yutils.js
 * @author justayak
 */
'use strict';

class GUID {
	constructor () { /* empty constructor */ }
	/**
	 * get a globally unique (with high probability) identifier
	 * @return {string} guid a string being the identifier
	 */
	guid () {
		let d = new Date().getTime();
		let guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
			let r = (d + Math.random() * 16) % 16 | 0;
			d = Math.floor(d / 16);
			return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
		});
		return guid;
	}
}

module.exports = GUID;
