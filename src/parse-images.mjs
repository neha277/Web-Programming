import { ok, err } from 'cs544-js-utils';

/** parse byte streams in imageBytes: { images: Uint8Array, labels:
 *  Uint8Array } as per imageSpecs { images: HeaderSpec[], labels:
 *  HeaderSpec[] } to return a list of LabeledFeatures (wrapped within
 *  a Result).
 *
 *  Errors:
 *    BAD_VAL: value in byte stream does not match value specified
 *             in spec.
 *    BAD_FMT: size of bytes stream inconsistent with headers
 *             or # of images not equal to # of labels.
 */
export default function parseImages(imageSpecs, imageBytes) {
  let magicNumberData = imageBytes.images[2];
  let nextMagicNumberData = imageBytes.images[3];
  let magicNumber = magicNumberData * 16 * 16 + nextMagicNumberData;
  let givenMagicNumber = imageSpecs.images[0].value;

  let magicNumberlabel = imageBytes.labels[2];
  let nextMagicNumberlabel = imageBytes.labels[3];
  let magicNumberLabel = magicNumberlabel * 16 * 16 + nextMagicNumberlabel;
  let givenMagicNumberLabel = imageSpecs.labels[0].value;

  let rowCnt = imageBytes.images[11];
  let colCnt = imageBytes.images[15];
  let givenRows = imageSpecs.images[2].value;
  let givenCols = imageSpecs.images[3].value;

  let imageUintArray = new Uint8Array(imageBytes.images);
  let givenImageLen = (imageBytes.images.length - 16) / (givenCols * givenRows);
  let imageUintArrayDataView = new DataView(imageUintArray.buffer);
  let totalOfimages = imageUintArrayDataView.getInt32(4, false);

  let labelUintArray = new Uint8Array(imageBytes.labels);
  let labelUintArrayDataView = new DataView(labelUintArray.buffer);
  let totalOfLabels = labelUintArrayDataView.getInt32(4, false);
  let givenLabelLen = imageBytes.labels.length - 8;



  if (totalOfimages !== givenImageLen) {
    return err('err', { code: 'BAD_FMT' });

  }

  if (totalOfLabels !== givenLabelLen
  ) {
    return err('err', { code: 'BAD_FMT' });
  }

  if (magicNumber !== givenMagicNumber
    || magicNumberLabel !== givenMagicNumberLabel
  ) {
    return err('err', { code: 'BAD_VAL' });
  }

  if (givenRows !== rowCnt) {
    return err('err', { code: 'BAD_VAL' });
  }

  if (givenCols !== colCnt) {
    return err('err', { code: 'BAD_VAL' });
  }

  if (totalOfLabels !== givenLabelLen) {
    return err('err', { code: 'BAD_FMT' });

  }

  let pixelData = [];

  for (let pixel = 0; pixel <= givenImageLen - 1; pixel++) {
    let pixelArray = [];
    for (let y = 0; y <= (colCnt - 1); y++) {
      for (let x = 0; x <= (rowCnt - 1); x++) {
        pixelArray.push(imageBytes.images[(pixel * rowCnt * rowCnt) + (x + (y * rowCnt)) + 16]);
      }
    }

    let imageData = {};
    let label = imageBytes.labels[pixel + 8];
    imageData["label"] = JSON.stringify(label);
    imageData["features"] = pixelArray;
    pixelData.push(imageData);
  }
  return { val: pixelData };

}
