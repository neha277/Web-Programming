// Result refers to Result declared in cs544-js-lib and Error Code
// refers to AppError:options.code also declared in cs544-js-lib.
type Result<_> = { };

type B64 = string;
type Features = Uint8Array | B64;
type Label = string;
interface LabeledFeatures {
  features: Features;
  label: Label;
};

interface IdLabeledFeatures extends LabeledFeatures {
  id: string;
};

type FeaturesId = string;

//Since a async function always returns a Promise, methods documented
//as returning Promise<Result<_>> can be implemented as async methods
//returning Result<_>.

interface FeaturesDao {

  /** add features to this FeaturesDao, returning a unique FeaturesId
   *  string identifying this features.  If isB64 is true, then
   *  features is a base-64 string; otherwise it is a Uint8Array.
   *  Note that label must be specified for training features, but
   *  unspecified for test features.
   *
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  add(features: Features, isB64: boolean, label?: string)
    : Promise<Result<FeaturesId>>;

  /** return previously added LabeledFeatures specified by id.  If
   *  isB64 is true, then the returned features is a base-64 string;
   *  otherwise it is a Uint8Array.  Note that the returned label is
   *  nullish if id specifies test features.
   *
   *  Error Codes:
   *    DB: a database error was encountered.
   *    NOT_FOUND:  no features found for id.
   */
  get(id: FeaturesId, isB64: boolean) : Promise<Result<LabeledFeatures>>;

  /** return all previously added training LabeledFeatures with
   *  all Features returned as Uint8Array's.
   *
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  getAllTrainingFeatures() : Promise<Result<IdLabeledFeatures[]>>;

  /** clear all data in this DAO.
   *
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  clear() : Promise<Result<undefined>>;

  /** close off this DAO; implementing object is invalid after 
   *  call to close() 
   *
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  close() : Promise<Result<undefined>>;

}

declare function makeFeaturesDao(dbUrl: string) : Promise<Result<FeaturesDao>>;
