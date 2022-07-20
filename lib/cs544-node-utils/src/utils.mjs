import fs from 'fs';
import Path from 'path';
import util from 'util';

const { promisify } = util;

import { err, ok } from 'cs544-js-utils';

export async function readJson(path) {
  let text;
  try {
    text = await promisify(fs.readFile)(path, 'utf8');
  }
  catch (e) {
    return err(`unable to read ${path}: ${e.message}`);
  }
  try {
    if (path.endsWith('.jsonl')) {
      text = '[' + text.trim().replace(/\n/g, ',') + ']';
    }
    return ok(JSON.parse(text));
  }
  catch (e) {
    return err(`unable to parse JSON from ${path}: ${e.message}`);
  }
}

export function cwdPath(path) {
  return (path.startsWith(Path.sep)) ? path : Path.join(process.cwd(), path);
}

export function scriptName() {
  return Path.basename(process.argv[1]);
}
