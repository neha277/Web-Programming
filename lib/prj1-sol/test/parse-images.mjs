import { err, ok } from 'cs544-js-utils'

import { expect } from 'chai';

import parseImages from '../src/parse-images.mjs';

const N_IMAGES = 4;
const N_ROWS = 2;
const N_COLS = 2;

const HEADERS_INFO = {
  images: [
    { name: 'magic', value: 0x4102, },
    { name: 'nImages', },
    { name: 'nRows', value: 2, },
    { name: 'nCols', value: 2, }
  ],
  labels: [
    { name: 'magic', value: 0x4201, },
    { name: 'nLabels', },
  ],
};

const IMG0 = [ 0x01, 0x23, 0x45, 0x67, ];
const IMG1 = [ 0x89, 0xab, 0xcd, 0xef, ];
const IMG2 = [ 0x00, 0x11, 0x22, 0x33, ];
const IMG3 = [ 0x44, 0x55, 0x66, 0x77, ];
    
const IMAGES_DATA = [
  0, 0, 0x41, 0x02,        //magic
  0, 0, 0, N_IMAGES,       //nImages
  0, 0, 0, N_ROWS,         //nRows
  0, 0, 0, N_COLS,         //nCols
  ...IMG0, ...IMG1, ...IMG2, ...IMG3,
];

const LABELS = [ 0, 1, 2, 3, ];

const LABELS_DATA = [
  0, 0, 0x42, 0x01,        //magic
  0, 0, 0, N_IMAGES,       //nLabels
  ...LABELS,               //labels
];

describe('parseImages()', () => {
  
  it('must parse error-free images and labels correctly', () => {
    const images = new Uint8Array(IMAGES_DATA);
    const labels = new Uint8Array(LABELS_DATA);
    const data = { images, labels };
    const result = parseImages(HEADERS_INFO, data);
    expect(result.hasErrors).to.be.false;

    const labeledFeatures = result.val;
    expect(labeledFeatures.length).to.equal(N_IMAGES);

    expect(Array.from(labeledFeatures[0].features)).to.deep.equal(IMG0);
    expect(labeledFeatures[0].label).to.deep.equal(LABELS[0].toString());

    expect(Array.from(labeledFeatures[1].features)).to.deep.equal(IMG1);
    expect(labeledFeatures[1].label).to.deep.equal(LABELS[1].toString());

    expect(Array.from(labeledFeatures[2].features)).to.deep.equal(IMG2);
    expect(labeledFeatures[2].label).to.deep.equal(LABELS[2].toString());

    expect(Array.from(labeledFeatures[3].features)).to.deep.equal(IMG3);
    expect(labeledFeatures[3].label).to.deep.equal(LABELS[3].toString());

  });

  it('must detect bad magic number in images data', () => {
    const images = new Uint8Array(IMAGES_DATA);
    const labels = new Uint8Array(LABELS_DATA);
    images[3] = 0; //bad magic number
    const data = { images, labels };
    const result = parseImages(HEADERS_INFO, data);
    expect(result.hasErrors).to.be.true;
    expect(result.errors[0].options.code).to.equal('BAD_VAL');
  });

  it('must detect bad # of rows in images data', () => {
    const images = new Uint8Array(IMAGES_DATA);
    const labels = new Uint8Array(LABELS_DATA);
    images[11] = 1; //bad nRows
    const data = { images, labels };
    const result = parseImages(HEADERS_INFO, data);
    expect(result.hasErrors).to.be.true;
    expect(result.errors[0].options.code).to.equal('BAD_VAL');
  });

  it('must detect bad # of cols in images data', () => {
    const images = new Uint8Array(IMAGES_DATA);
    const labels = new Uint8Array(LABELS_DATA);
    images[15] = 1; //bad nCols
    const data = { images, labels };
    const result = parseImages(HEADERS_INFO, data);
    expect(result.hasErrors).to.be.true;
    expect(result.errors[0].options.code).to.equal('BAD_VAL');
  });

  it('must detect inconsistent length in images data', () => {
    const images = new Uint8Array([...IMAGES_DATA, 42]);
    const labels = new Uint8Array(LABELS_DATA);
    const data = { images, labels };
    const result = parseImages(HEADERS_INFO, data);
    expect(result.hasErrors).to.be.true;
    expect(result.errors[0].options.code).to.equal('BAD_FMT');
  });

  it('must detect bad magic number in labels data', () => {
    const images = new Uint8Array(IMAGES_DATA);
    const labels = new Uint8Array(LABELS_DATA);
    labels[3] = 0; //bad magic number
    const data = { images, labels };
    const result = parseImages(HEADERS_INFO, data);
    expect(result.hasErrors).to.be.true;
    expect(result.errors[0].options.code).to.equal('BAD_VAL');
  });

  
  
  it('must detect inconstent length in labels', () => {
    const images = new Uint8Array(IMAGES_DATA);
    const labels = new Uint8Array([...LABELS_DATA, 7]);
    const data = { images, labels };
    const result = parseImages(HEADERS_INFO, data);
    expect(result.hasErrors).to.be.true;
    expect(result.errors[0].options.code).to.equal('BAD_FMT');
  });

  it('must detect inconstency between # of labels and # of images', () => {
    const images = new Uint8Array(IMAGES_DATA);
    const labels = new Uint8Array([...LABELS_DATA, 7]);
    labels[7] = 5;  //change # of labels
    const data = { images, labels };
    const result = parseImages(HEADERS_INFO, data);
    expect(result.hasErrors).to.be.true;
    expect(result.errors[0].options.code).to.equal('BAD_FMT');
  });

  

});
