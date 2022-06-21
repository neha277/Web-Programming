import { ok, err } from 'cs544-js-utils';

/** return pair [label, index] (wrapped within a Result) of the
 *  training LabeledFeatures trainLabeledFeatures having the most
 *  common label of the k training features closest to subject
 *  testFeatures.
 *
 *  Errors:
 *    BAD_FMT: trainLabeledFeatures has features bytes with length 
 *             different from length of subject testFeatures.
 */
//function calDistance(trainLabeledFeatures, element) {
let calDistance = (a, b) => a.map((x, i) => Math.abs(x - b[i]) ** 2) // square the difference
  .reduce((sum, now) => sum + now) // sum
  ** (1 / 2);

export default function knn(testFeatures, trainLabeledFeatures, k = 3) {
  let testFeaturesPred = []
  let maxDistanceInPred;

  for (let index = 0, len = testFeatures.length; index < len; index++) {
    let otherPoint = trainLabeledFeatures[index].features
    let otherPointLabel = trainLabeledFeatures[index].label
    let thisDistance = calDistance(testFeatures, otherPoint)
    // console.log(thisDistance)
    if (!maxDistanceInPred || thisDistance < maxDistanceInPred) {

      testFeaturesPred.push({
        label: otherPointLabel,
        index,
        distance: thisDistance
      });

      testFeaturesPred.sort((a, b) => a.distance < b.distance ? -1 : 1);

      if (testFeaturesPred.length > k) {
        testFeaturesPred.pop();
      }
      maxDistanceInPred = testFeaturesPred[testFeaturesPred.length - 1].distance;

    }
  }

  let arry = new Array(testFeaturesPred[0].label, testFeaturesPred[0].index);

  return { val: arry }

}

