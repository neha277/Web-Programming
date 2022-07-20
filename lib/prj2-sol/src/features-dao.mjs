import assert from 'assert';
import crypto from 'crypto';

import { MongoClient } from 'mongodb';

import { ok, err } from 'cs544-js-utils';

import { b64ToUint8Array, uint8ArrayToB64 } from './uint8array-b64.mjs';

export default async function makeFeaturesDao(dbUrl) {
  return FeaturesDao.make(dbUrl);
}


//use in mongo.connect() to avoid warning
const MONGO_CONNECT_OPTIONS = { useUnifiedTopology: true };


class FeaturesDao {
  constructor(params) {  Object.assign(this, params); }

  static async make(dbUrl) {
    const params = {};
    try {
      params._client = new MongoClient(dbUrl);
      await params._client.connect();
      const db = params._client.db();
      for (const c of COLLECTIONS) { params[c] = db.collection(c); }
      return ok(new FeaturesDao(params));
    }
    catch (error) {
      return err(error.message, { code: 'DB' });
    }
  }

  /** close off this DAO; implementing object is invalid after 
   *  call to close() 
   *
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  async close() {
    try {
      await this._client.close();
    }
    catch (e) {
      err(e.message, { code: 'DB' });
    }
  }

  /** add features to this FeaturesDao, returning a unique FeaturesId
   *  string identifying this features.  If isB64 is true, then
   *  features is a base-64 string; otherwise it is a Uint8Array.
   *  Note that label must be specified for training features, but
   *  unspecified for test features.
   *
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  async add(features,  isB64, label) {
    const isTest = (label === undefined);
    const collectionName = COLLECTIONS[isTest ? 1 : 0];
    const collection = this[collectionName];
    let b64Features = features;
    if (!isB64) {
      assert(features instanceof Uint8Array, 'expected instance of Uint8Array');
      b64Features = uint8ArrayToB64(features);
    }
    const id = this.#nextId(b64Features, label);
    const isDupError = e => e.code === 11000;
    const obj = { id, b64Features, label };
    try {
      const insertResult = await collection.insertOne({ _id: id, obj });
      const id1 = insertResult.insertedId;
      if (id1 !== id) {
	const msg = `expected inserted id '${id1}' to equal '${id}'`;
	throw(new Error(msg));
      }
    }
    catch (e) {
      //ignore dup error since ID based on content
      if (!isDupError(e)) return err(e.message, { code: 'DB' });
    }
    return ok(id);
  }

  /** return previously added LabeledFeatures specified by id.  If
   *  isB64 is true, then the returned features is a base-64 string;
   *  otherwise it is a Uint8Array.  Note that the returned label is
   *  nullish if id specifies test features.
   *
   *  Error Codes:
   *    DB: a database error was encountered.
   *    NOT_FOUND:  no features found for id.
   */
  async get(id, isB64) {
    const isTest = this.#isTestId(id);
    const collection = this[COLLECTIONS[isTest ? 1 : 0]];
    try {
      let dbEntry;
      if (id.length < 34) {
	const filter = { _id: { $regex: new RegExp(`^${id}`), } };
	const dbEntriesCursor = await collection.find(filter);
	const dbEntries = await dbEntriesCursor.toArray();
	if (dbEntries.length > 1) {
	  return err(`prefix ${id} identifies multiple feature sets`);
	}
	else {
	  dbEntry = dbEntries[0];
	}
      }
      else {
	dbEntry = await collection.findOne({_id: id});
      }
      if (dbEntry) {
	const { b64Features, label } = dbEntry.obj;
	const features = isB64 ? b64Features : b64ToUint8Array(b64Features);
	return ok({features, label});
      }
      else {
	return err(`no features for ${id}`, { code: 'NOT_FOUND' });
      }
    }
    catch (e) {
      return err(e.message, { code: 'DB' });
    }
  }

  /** return all previously added training LabeledFeatures  with
   *  all Features returned as Uint8Array's.
   *
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  async getAllTrainingFeatures() {
    const collection = this[COLLECTIONS[0]];
    try {
      const cursor = await collection.find({});
      const dbEntries = await cursor.toArray();
      const ret =
        dbEntries.map(({obj: { id, b64Features, label }}) =>
      		       ({ id, label, features: b64ToUint8Array(b64Features) }));
      return ok(ret);
    }
    catch (e) {
      return err(e.message, { code: 'DB' });
    }
  }

  /** clear all data in this DAO.
   *
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  async clear() {
    try {
      for (const c of COLLECTIONS) {
	await this[c].deleteMany({});
      }
      return ok();
    }
    catch (e) {
      return err(e.message, { code: 'DB' });
    }
  }
 
  #nextId(b64Features, label) {
    const prefix = ID_PREFIXES[label === undefined ? 1 : 0];
    const input = b64Features + '-' + label;
    const suffix = crypto.createHash('md5').update(input).digest('hex');
    return `${prefix}-${suffix}`;
  }

  #isTestId(id) {
    return id[0] === ID_PREFIXES[1];
  }
  
}

const COLLECTIONS = [ '_training', '_test', ];
const ID_PREFIXES = [ 'a', 'b' ];
