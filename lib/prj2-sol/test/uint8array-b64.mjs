import { expect } from 'chai';

import { uint8ArrayToB64, b64ToUint8Array } from '../src/uint8array-b64.mjs';

describe('uint8 array base64 encode/decode', () => {

  it('encode followed by decode must be NOP', () => {
    const arr = Array.from({length: 256}).map((_, i) => i);
    const b64 = uint8ArrayToB64(new Uint8Array(arr));
    const uint8Array = b64ToUint8Array(b64);
    expect(uint8Array.constructor.name).to.equal('Uint8Array');
    expect(Array.from(uint8Array)).to.deep.equal(arr);
  });
  
});
