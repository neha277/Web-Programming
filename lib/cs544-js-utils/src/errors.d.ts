declare module Errors {

  /** application error */
  export type AppError = {
    readonly message: string;
    /** map options like code and widget */
    readonly options: { [_:string]: string };  
  }

  /** wraps a SuccType success type or errors in a Result. */
  export type Result<SuccType> = {
    hasError: boolean;
    readonly val?: SuccType;       /** valid only when !hasError */
    readonly errors?: AppError[]; /** valid only when hasError */

    /** add an error to this Result (which must have hasError true) */
    addError(message: string, options: object) : void;

    /** if this.hasError return this, otherwise return fn(this.val, ...args) */
    chain<T>(fn: (val: SuccType, ...args: any[]) => Result<T>, ...args: any[])
    : Result<T>;
  };

  /** return a success Result having success value val */
  function ok<SuccType>(val: SuccType) : Result<SuccType>;

  /** return a failed Result with single error having message and options */
  function err<SuccType>(message: string, options: object) : Result<SuccType>; 

}