export function uint8ArrayToB64(uint8array) {
  const arr = Array.from(uint8array);
  return btoa(arr.map(e => String.fromCharCode(e)).join(''));
}

export function b64ToUint8Array(b64) {
  return new Uint8Array(atob(b64).split('').map(c => c.charCodeAt(0)));
}
