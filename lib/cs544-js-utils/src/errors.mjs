/** return a success Result having success value val */
export function ok(val) { return new Result(val); }

/** return a failed Result having error with specified message and options */
export function err(message, options={}) {
  return new Result(null, new AppError(message, options));
}

class Result {
  constructor(val, error) {
    if (val !== null) {
      this.val = val;
    }
    else {
      this.errors = [ error ];
    }
  }
  get hasErrors() { return !!(this.errors && this.errors.length > 0); }

  /** if this.hasError return this, otherwise return fn(this.val, ...args) */
  chain(fn, ...args) {
    if (this.hasErrors) {
      return this;
    }
    else {
      try {
	return fn.apply(null, [this.val, ...args]);
      }
      catch (err) {
	return err(err.msg, { code: 'INTERNAL', cause: err });
      }
    }
  }

  /** add error with specified message and options to this Result */
  addError(message, options={}) {
    console.assert(this.hasErrors);
    if (!this.errors) this.errors = [];
    this.errors.push(new AppError(message, options));
    return this;
  }
}

class AppError {
  constructor(message, options) {
    this.message = message; this.options = options;
  }

  toString() {
    return this.options.code
      ? `${this.options.code}: ${this.message}`
      : this.message;
  }
  
}

