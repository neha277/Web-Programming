import { readJson, scriptName } from 'cs544-node-utils';
import { ok, err } from 'cs544-js-utils';
import makeFeaturesDao from './features-dao.mjs';

import Path from 'path';

export default async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    usage();
  }
  const dbUrl = args[0];
  const daoResult = await makeFeaturesDao(dbUrl);
  if (daoResult.hasErrors) panic(daoResult);
  const dao = daoResult.val;
  try {
    switch (args[1]) {
      case 'add': {
	if (args.length !== 4 && args.length !== 3) usage();
	const dataResult = await readJson(args[2]);
	if (dataResult.hasErrors) panic(dataResult);
	const data = dataResult.val;
	const dataChk = d => typeof d === 'number' && 0 <= d && d <= 255;
	if (!(data instanceof Array) || !data.every(d => dataChk(d))) {
	  panic(err('JSON file must contain array of byte values'));
	}
	const label = args[3];
	const result = await dao.add(new Uint8Array(data), false, label);
	if (result.hasErrors) panic(result);
	console.log(result.val);
	break;
      }
      case 'all-train': {
	if (args.length !== 2) usage();
	const result = await dao.getAllTrainingFeatures();
	if (result.hasErrors) panic(result);
	console.log(result.val);
	break;
      }
      case 'clear': {
	if (args.length !== 2) usage();
	const result = await dao.clear();
	if (result.hasErrors) panic(result);
	console.log(result.val);
	break;
      }
      case 'get': {
	if (args.length !== 3) usage();
	const id = args[2];
	const result = await dao.get(id, false);
	if (result.hasErrors) panic(result);
	console.log(result.val);
	break;
      }
      default:
	usage();
    }
  }
  catch (e) {
    panic(err(e.message));
  }
  finally {
    await dao.close();
  }
}

function usage() {
  const prog = Path.basename(process.argv[1]);
  panic(err(`
    usage: ${prog} DB_URL add JSON_FEATURES_FILE [LABEL]
     | ${prog} DB_URL all-train
     | ${prog} DB_URL clear
     | ${prog} DB_URL get ID

    where JSON_FEATURES_FILE is the path to a JSON file containing
    an array of byte values, LABEL is any string, and ID is the id
    returned by a previous add command.
      `.trim()));
}

function panic(errResult) {
  console.assert(errResult.hasErrors);
  for (const err of errResult.errors) {
    console.error(err.message);
  }
  process.exit(1);
}

