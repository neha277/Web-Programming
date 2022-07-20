import { ok, err } from 'cs544-js-utils';

/** Return square of distance between features1 and features2. */
function dist2(features1, features2) {
  console.assert(features1.length === features2.length);
  let sum = 0;
  for (let i = 0; i < features1.length; i++) {
    const [f1, f2] = [features1[i], features2[i]];
    const diff = f1 - f2;
    sum += diff * diff;
  }
  return sum;
}

function medianLabelIndex(distLabelIndexes) {
  let [maxCount, maxIndex, maxLabel] = [-1, -1, ''];
  const counts = {};
  for (const { label, index } of distLabelIndexes) {
    counts[label] = (counts[label] ?? 0) + 1;
    if (counts[label] > maxCount) {
      maxCount = counts[label]; maxLabel = label; maxIndex = index;
    }
  }
  return [ maxLabel, maxIndex ];
}

/** return pair [label, index] (wrapped within a Result) of the
 *  training LabeledFeatures trainLabeledFeatures having the most
 *  common label of the k training features closest to subject
 *  testFeatures.
 *
 *  Errors:
 *    BAD_FMT: trainLabeledFeatures has features bytes with length 
 *             different from length of subject testFeatures.
 */
export default function  knn(testFeatures, trainLabeledFeatures, k=3) {
  const distLabelIndexes = [];
  const n = testFeatures.length;
  for (const [index, labeledFeatures] of trainLabeledFeatures.entries()) {
    const { features, label } = labeledFeatures;
    if (features.length !== testFeatures.length) {
      const msg = `
        training features at index ${index} has different # of points 
        ${features.length} than test features having ${n} points
      `.trim().replace(/\s\s+/, ' ');
      return err(msg, { code: 'BAD_FMT' });
    }
    distLabelIndexes.push({dist: dist2(features, testFeatures), label, index});
  }
  distLabelIndexes.sort((a, b) => a.dist - b.dist);
  return ok(medianLabelIndex(distLabelIndexes.slice(0, k)));
}
