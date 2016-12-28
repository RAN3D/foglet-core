var InitConstructException = require('../src/fexceptions.js').InitConstructException;
var ConstructException = require('../src/fexceptions.js').ConstructException;
var FRegisterConstructException = require('../src/fexceptions.js').FRegisterConstructException;
var FRegisterAddException = require('../src/fexceptions.js').FRegisterAddException;

describe('[FOGLET:EXCEPTION]', function () {
	describe('#InitConstructException has 2 properties', function () {
		it('has property named InitConstructException', function () {
			expect(new InitConstructException()).to.have.property('name', 'InitConstructException');
		});
		it('has property message', function () {
			expect(new InitConstructException()).to.have.property('message');
		});
	});
	describe('#ConstructException has 2 properties', function () {
		it('has property named ConstructException', function () {
			expect(new ConstructException()).to.have.property('name', 'ConstructException');
		});
		it('has property message', function () {
			expect(new ConstructException()).to.have.property('message');
		});
	});
	describe('#FRegisterConstructException has 2 properties', function () {
		it('has property named FRegisterConstructException', function () {
			expect(new FRegisterConstructException()).to.have.property('name', 'FRegisterConstructException');
		});
		it('has property message', function () {
			expect(new FRegisterConstructException()).to.have.property('message');
		});
	});
	describe('#FRegisterAddException has 2 properties', function () {
		it('has property named FRegisterAddException', function () {
			expect(new FRegisterAddException()).to.have.property('name', 'FRegisterAddException');
		});
		it('has property message', function () {
			expect(new FRegisterConstructException()).to.have.property('message');
		});
	});
});
