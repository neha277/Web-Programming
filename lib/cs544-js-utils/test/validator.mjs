import makeValidator from '../src/validator.mjs';

import { expect } from 'chai';

const CMDS = {
  no_fields: {
  },
  required: {
    fields: {
      x: {
	chk: /\d+/,
	required: true,
      },
      z: {
	chk: val => (Number(val) > 0) ? '' : 'must be positive',
	required: true,
      },
    },
  },
  all_optional: {
    fields: {
      x: {
	default: '99',
	chk: [ '11', '22', '33', '44', '55', '66', '77', '88', '99', ],
      },
      y: {
	valFn: str => Number(str),
      },
      z: {  //optional, but if this is provided, then y too must be provided
	chk: function() { return this.y === undefined ? 'y required' : '' },
      },
    },
  },
};

describe('validator', () => {

  let checker;
  beforeEach(() => {
    checker = makeValidator(CMDS);
  });

  it('should return BAD_REQ error for invalid command', () => {
    const ret = checker.validate('bad_cmd');
    expect(ret.hasErrors).to.be.true;
    expect(ret.errors.length).to.equal(1);
    expect(ret.errors[0].options.code).to.equal('BAD_REQ');
  });

  it('should return INTERNAL error if no fields', () => {
    const ret = checker.validate('no_fields');
    expect(ret.hasErrors).to.be.true;
    expect(ret.errors.length).to.equal(1);
    expect(ret.errors[0].options.code).to.equal('INTERNAL');
  });

  it('should return BAD_REQ error for missing required value', () => {
    const ret = checker.validate('required', {x: '22'});
    expect(ret.hasErrors).to.be.true;
    expect(ret.errors.length).to.equal(1);
    expect(ret.errors[0].options.code).to.equal('BAD_REQ');
  });

  it('should return BAD_VAL error for failing regex', () => {
    const ret = checker.validate('required', {x: '22a', z: '33'});
    expect(ret.hasErrors).to.be.true;
    expect(ret.errors.length).to.equal(1);
    expect(ret.errors[0].options.code).to.equal('BAD_VAL');
  });

  it('should return BAD_VAL error for failing chk fn', () => {
    const ret = checker.validate('required', {x: '22', z: '-33'});
    expect(ret.hasErrors).to.be.true;
    expect(ret.errors.length).to.equal(1);
    expect(ret.errors[0].options.code).to.equal('BAD_VAL');
  });

  it('should return no errors for validating object', () => {
    const ret = checker.validate('required', {x: '22', z: '33'});
    expect(ret.hasErrors).to.be.false;
  });

  it('should ignore unknown params', () => {
    const ret = checker.validate('required', {y: '22', x: '22', z: '33'});
    expect(ret.hasErrors).to.be.false;
  });
  
  it('should return no errors for all optional command', () => {
    const ret = checker.validate('all_optional');
    expect(ret.hasErrors).to.be.false;
  });
  
  it('should return default value', () => {
    const ret = checker.validate('all_optional');
    expect(ret.val.x).to.equal('99');
  });
  
  it('should return BAD_VAL error for value not among multiple', () => {
    const ret = checker.validate('all_optional', { x: 9 });
    expect(ret.hasErrors).to.be.true;
    expect(ret.errors.length).to.equal(1);
    expect(ret.errors[0].options.code).to.equal('BAD_VAL');
  });
  
  it('should return value among multiple', () => {
    const ret = checker.validate('all_optional', { x: '77' });
    expect(ret.val.x).to.equal('77');
  });
  
  it('should return convert param value', () => {
    const ret = checker.validate('all_optional', {y: '22'});
    expect(ret.val.y).to.equal(22);
  });
  
  it('should allow checking  cross-param values', () => {
    const ret = checker.validate('all_optional', {z: '22'});
    expect(ret.hasErrors).to.be.true;
    expect(ret.errors.length).to.equal(1);
    expect(ret.errors[0].options.code).to.equal('BAD_VAL');
  });
  
  

});

