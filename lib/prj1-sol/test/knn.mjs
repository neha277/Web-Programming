import knn from '../src/knn.mjs';

import { err, ok } from 'cs544-js-utils'

import { expect } from 'chai';


describe('KNN classifier', () => {
  
  it('must correctly classify test features', () => {
    const N = 16;
    const train = randLabeledFeatures(N, 200);
    const tests = randLabeledFeatures(N, 40);
    for (const t of tests) {
      const { features, label } = t;
      const labelIndexResult = knn(features, train);
      expect(labelIndexResult.hasErrors).to.be.false;
      expect(labelIndexResult.val[0]).to.equal(label);
    }
  });

  it('must correctly classify test despite incorrectly labeled images', () => {
    const N = 16;
    const train = randLabeledFeatures(N, 200);
    for (let label = 0; label < 10; label++) {
      const features = randBytes(N, (label + 1)*20, 0);
      train.push({features, label: ((label + 1)%10).toString()});
    }
    const tests = randLabeledFeatures(N, 40);
    for (const t of tests) {
      const { features, label } = t;
      const labelIndexResult = knn(features, train);
      expect(labelIndexResult.hasErrors).to.be.false;
      expect(labelIndexResult.val[0]).to.equal(label);
    }
  });

  it(`must correctly classify tests despite multiple 
      incorrectly labeled images when k == 5`.trim(),
     () => {
    const N = 16;
    const train = randLabeledFeatures(N, 200);
    for (let label = 0; label < 10; label++) {
      const features = randBytes(N, (label + 1)*20, 0);
      train.push({features, label: ((label + 1)%10).toString()});
      train.push({features, label: ((label + 1)%10).toString()});
    }
    const tests = randLabeledFeatures(N, 40);
    for (const t of tests) {
      const { features, label } = t;
      const labelIndexResult = knn(features, train, 5);
      expect(labelIndexResult.hasErrors).to.be.false;
      expect(labelIndexResult.val[0]).to.equal(label);
    }
  });

  it('must incorrectly classify tests when too many bad labeled images', () => {
    const N = 16;
    const train = randLabeledFeatures(N, 200);
    for (let label = 0; label < 10; label++) {
      const features = randBytes(N, (label + 1)*20, 0);
      train.push({features, label: ((label + 1)%10).toString()});
      train.push({features, label: ((label + 1)%10).toString()});
    }
    const tests = randLabeledFeatures(N, 40, 0);
    for (const t of tests) {
      const { features, label } = t;
      const labelIndexResult = knn(features, train);
      expect(labelIndexResult.hasErrors).to.be.false;
      expect(labelIndexResult.val[0]).to.not.equal(label);
    }
  });

  it('must detect BAD_FMT error when training & test # bytes differ ', () => {
    const N = 16;
    const train = randLabeledFeatures(N, 200);
    const tests = randLabeledFeatures(N+1, 40);
    for (const t of tests) {
      const { features, label } = t;
      const labelIndexResult = knn(features, train);
      expect(labelIndexResult.hasErrors).to.be.true;
      expect(labelIndexResult.errors[0].options.code).to.equal('BAD_FMT');
    }
  });

  

});

/** return random int in closed interval [n - k, n + k] */
function randVal(n, k) {
  const k2 = 2*k + 1;
  const rand = Math.random();
  return Math.trunc(n - k + rand*k2);
}

/** return n random bytes in closed interval [v -k, v + k] */
function randBytes(n, v, k) {
  let bytes = [];
  for (let i = 0; i < n; i++) bytes.push(randVal(v, k));
  return bytes;
}

/** return n random features having featureLen with between 0 and
 *  9 with bytes for label lab being in closed interval [ label + 9,
 *  label - 9]
 */
function randLabeledFeatures(featureLen, n, k=9) {
  const labeledFeatures = [];
  for (let i = 0; i < n; i++) {
    const label = Math.trunc(10*Math.random());
    const base = (label + 1) * 20;
    const features = randBytes(featureLen, base, k);
    labeledFeatures.push({features, label: label.toString()});
  }
  return labeledFeatures;
}
