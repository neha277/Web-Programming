import { err, ok } from '../src/errors.mjs';

import { expect } from 'chai';

describe('errors', () => {

  it('should return an ok result', () => {
    const val = 42;
    const result = ok(val);
    expect(result.hasErrors).to.be.false;
    expect(result.val).to.equal(val);
  });

  it('should return an error result', () => {
    const error = ERRORS[0];
    const result = err(error.message, error.options);
    expect(result.hasErrors).to.be.true;
    expect(result.errors.length).to.equal(1);
    expect(result.errors[0].message).to.equal(error.message);
    expect(result.errors[0].options).to.deep.equal(error.options);
  });

  it('should allow multiple errors', () => {
    const errors = ERRORS;
    const result = err(errors[0].message, errors[0].options);
    for (const e of errors.slice(1)) { result.addError(e.message, e.options); }
    expect(result.hasErrors).to.be.true;
    expect(result.errors.length).to.equal(errors.length);
    for (let [i, e] of errors.entries()) {
      expect(result.errors[i].message).to.equal(errors[i].message);
      expect(result.errors[i].options).to.deep.equal(errors[i].options);
    }
  });

  it('should allow chaining functions', () => {
    const result = ok(3).chain(x => ok(x*11)).chain(x => ok(x+9));
    expect(result.hasErrors).to.be.false;
    expect(result.val).to.equal(42);
  });

  it('should detect error within chaining functions', () => {
    const e = ERRORS[0];
    const result = ok(3).chain(x => err(e.message, e.options))
      .chain(x => ok(x+9));
    expect(result.hasErrors).to.be.true;
    expect(result.errors.length).to.equal(1);
    expect(result.errors[0].message).to.equal(e.message);
    expect(result.errors[0].options).to.deep.equal(e.options);
  });


});

const ERRORS = [
  { message: 'here is an error', options: { code: 'BAD_VALUE' } }, 
  { message: 'yet another error', options: { code: 'BAD_ARG', field: 'arg' } },
  { message: 'some other error', options: { code: 'BAD_NAME', field: 'name' } },
];

