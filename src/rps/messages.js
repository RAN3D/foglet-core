'use strict';
/**
 * message requesting an exchange of neighborhood
 * @param {string} inview the identifier of the inview
 * @param {string} outview the identifier of the outview
 * @param {string} protocol the protocol that creates the message
 * @param {object} view View of the client
 * @return {object} Return an object with all parameters and some other details
 */
let MExchange = (inview, outview, view) => {
	return {
		protocol: 'spray-wrtc',
		type: 'MExchange',
		inview,
		outview,
		view
	};
};

module.exports = MExchange;
