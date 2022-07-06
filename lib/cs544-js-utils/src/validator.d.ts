declare module Validator {

  /** a function to check val; will be called with this set to top-level
   *  object being validated.  Not called if val not provided,
   *  returns null if ok, else error message.
   */
  type FieldChkFn = (val: string, spec: FieldSpec, id: string) => string|null;

  /** a function to convert val; will be called after validation successful
   *  with this set to top-level object being validated.
   */
  type ValFn = (val: string, spec: FieldSpec, id: string) => any;

  /** different checkers for a field */
  type FieldChk =
    RegExp        //validate by regex
    | [string]    //value must be one of these fields
    | FieldChkFn; //validate by function


  type FieldSpec = {
    name?: string,       //external end-user name for field; defaults to key
    chk?: FieldChk,      //validate field; defaults to check for safe chars only
    valFn?: ValFn,       //produce cleaned up value; defaults to val
    default?: string,    //default value when not specified
    isRequired?: boolean,//non-falsy if required
  };

  /** specification for validating an object */
  type Spec = {
    fields: {            //checks for individual fields
      [key: string]: FieldSpec
    },
  };


  /** returns converted val wrapped in a Result */
  function validate(val: object, spec: Spec): any;

  //returns true iff val only contains safe HTML chars like alphanumerics,
  //space -, etc.
  function isSafeCharsOnly(val: string): boolean;
  
}