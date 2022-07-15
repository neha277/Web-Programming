import { ok, err } from 'cs544-js-utils';

function readHeaders(headerSpecs, bytes) {
  const headers = {};
  let offset = 0;
  for (const spec of headerSpecs) {
    const { name, value } = spec;
    const view = new DataView(bytes.buffer, offset, 4);
    const val = view.getInt32(0);
    if (value !== undefined && val !== value) {
      const msg = `
        invalid value for header ${name}: expected ${value} got ${val}
      `.trim();
      return err(msg, { code: 'BAD_VAL' });
    }
    headers[name] = val;
    offset += 4;
  }
  return ok({headers, data: bytes.subarray(offset)});
}

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
  let results = [];
  for (const t of [ 'images', 'labels' ]) {
    const result = readHeaders(imageSpecs[t], imageBytes[t]);
    if (result.hasErrors) return result;
    results[t] = result.val;
  }
  const { nImages, nRows, nCols } = results.images.headers;
  const imagesData = results.images.data;
  const image1Len = nRows * nCols;
  const { nLabels } = results.labels.headers;
  const labelsData = results.labels.data;
  if (image1Len * nImages !== imagesData.length) {
    const msg = `
      expected ${image1Len * nImages} (${nRows} x ${nCols} x ${nImages})
      of image data; got ${imagesData.length} bytes instead
    `.trim().replace(/\s\s+/, ' ');
    return err(msg, { code: 'BAD_FMT' });
  }
  if (nLabels !== labelsData.length) {
    const msg = `
      expected ${nLabels} labels; got ${labelsData.length} bytes instead
    `.trim();
    return err(msg, { code: 'BAD_FMT' });
  }
  if (nImages !== nLabels) {
    const msg = `
      # of images ${nImages} does not match # of labels ${nLabels}
    `.trim();
    return err(msg, { code: 'BAD_FMT' });
  }
  const labeledImages = [];
  for (let i = 0; i < nImages; i++) {
    const startIndex = i * image1Len;
    const features = imagesData.subarray(startIndex, startIndex +  image1Len);
    const label = labelsData[i].toString();
    labeledImages.push({features, label});
  }
  return ok(labeledImages);
}

