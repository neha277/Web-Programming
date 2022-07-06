import { MongoClient } from 'mongodb';

import { ok, err } from 'cs544-js-utils';

import { b64ToUint8Array, uint8ArrayToB64 } from './uint8array-b64.mjs';

export default async function makeFeaturesDao(dbUrl) {
  return FeaturesDao.make(dbUrl);
}

class FeaturesDao {
  constructor(params) { Object.assign(this, params); }
  static async make(dbUrl) {
    const params = {};
    try {
      params._client = await (new MongoClient(dbUrl)).connect();
      const db = params._client.db();
      const featureCollection = db.collection(featCollection);
      params.featureCollection = featureCollection;
      await featureCollection.createIndex('id');
      return ok(new FeaturesDao(params));


    } catch (error) {
      return err(error.message, { code: 'DB' });
    }
  }


  async close() {
    try {
      await this._client.close();

    } catch (e) {
      err(e.message, { code: 'DB' });
    }
  }

  async add(features, isB64, label) {
    const featuresDb = features;
    const isB64Db = isB64;
    const labelDb = label;
    let featureDbB64;
    if (isB64Db === true) {
      featureDbB64 = featuresDb
    }
    else {
      featureDbB64 = uint8ArrayToB64(featuresDb);

    }
    const uid = uniq()
    const dbObj = { _id: uid, id: uid, features: featureDbB64, isB64: isB64Db, label: labelDb, isLabel: labelDb ? true : false };

    try {
      const collection = this.featureCollection;
      await collection.insertOne(dbObj);
    } catch (error) {
      return err(error.message, { code: 'DB' });
    }
    return ok(JSON.stringify(dbObj));

  }


  async get(featureId, isb64) {

    try {
      const collection = this.featureCollection;
      const dbEntry = await collection.findOne({ _id: featureId });
      if (dbEntry) {
        const feature = { ...dbEntry };
        delete feature._id;

        const { features, label, isLabel } = feature;
        const featureb64toUint = b64ToUint8Array(features);

        if (isb64 === true) {
          const result = { id: featureId, features, label, isLabel };
          return ok(result);
        }
        else {
          const result = { id: featureId, features: featureb64toUint, label, isLabel };
          return ok(result);
        }
      }
      else {
        return err(`no feature for id '${featureId}'`, { code: 'NOT_FOUND' });

      }


    } catch (error) {
      return err(error.message, { code: 'DB' });

    }


  }
  /** clear all data in this DAO.
   *
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  async clear() {
    try {
      await this.featureCollection.deleteMany({});
      return ok();
    }
    catch (e) {
      return err(e.message, { code: 'DB' });
    }
  }

  async getAllTrainingFeatures() {
    try {
      const collection = this.featureCollection;
      const dbEntry = await collection.find({ isLabel: true }).toArray();
      if (dbEntry) {
        const result = dbEntry.map(e => {
          const { features, label, isLabel } = e;
          const featureDbB64 = b64ToUint8Array(features);
          return { id: e.id, features: featureDbB64, label, isLabel };
        }
        );
        return ok(result);
      }
      else {
        return err(`No train features`, { code: 'NOT_FOUND' });
      }
    }
    catch (e) {
      return err(e.message, { code: 'DB' });
    }
  }


}


const featCollection = 'featureCollection';

const uniq = function () {
  return 'cs544' + (new Date()).getTime() + Math.random();

}

