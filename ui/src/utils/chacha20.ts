// Minimal ChaCha20 (RFC 8439) implementation for browser use
// - 32-byte key, 12-byte nonce, 32-bit counter starts at 1
// - Encrypt and decrypt are the same operation (XOR with keystream)

function u32(a: number) {
  return a >>> 0;
}

function rotl(a: number, b: number) {
  return u32((a << b) | (a >>> (32 - b)));
}

function quarterRound(state: Uint32Array, a: number, b: number, c: number, d: number) {
  state[a] = u32(state[a] + state[b]); state[d] = rotl(state[d] ^ state[a], 16);
  state[c] = u32(state[c] + state[d]); state[b] = rotl(state[b] ^ state[c], 12);
  state[a] = u32(state[a] + state[b]); state[d] = rotl(state[d] ^ state[a], 8);
  state[c] = u32(state[c] + state[d]); state[b] = rotl(state[b] ^ state[c], 7);
}

function chacha20Block(key: Uint8Array, counter: number, nonce: Uint8Array): Uint8Array {

  const state = new Uint32Array(16);
  const out = new Uint32Array(16);

  // Load constants (little-endian)
  state[0] = 0x61707865; // expa
  state[1] = 0x3320646e; // nd 3
  state[2] = 0x79622d32; // 2-by
  state[3] = 0x6b206574; // te k

  // Key (32 bytes)
  const k32 = new DataView(key.buffer, key.byteOffset, key.byteLength);
  for (let i = 0; i < 8; i++) {
    state[4 + i] = k32.getUint32(i * 4, true);
  }

  // Counter (32-bit) and nonce (96-bit)
  state[12] = counter >>> 0;
  const nDV = new DataView(nonce.buffer, nonce.byteOffset, nonce.byteLength);
  state[13] = nDV.getUint32(0, true);
  state[14] = nDV.getUint32(4, true);
  state[15] = nDV.getUint32(8, true);

  for (let i = 0; i < 16; i++) out[i] = state[i];
  for (let i = 0; i < 10; i++) {
    quarterRound(out, 0, 4, 8, 12);
    quarterRound(out, 1, 5, 9, 13);
    quarterRound(out, 2, 6, 10, 14);
    quarterRound(out, 3, 7, 11, 15);
    quarterRound(out, 0, 5, 10, 15);
    quarterRound(out, 1, 6, 11, 12);
    quarterRound(out, 2, 7, 8, 13);
    quarterRound(out, 3, 4, 9, 14);
  }
  const result = new Uint8Array(64);
  const dv = new DataView(result.buffer);
  for (let i = 0; i < 16; i++) {
    dv.setUint32(i * 4, u32(out[i] + state[i]), true);
  }
  return result;
}

export function chacha20Encrypt(key: Uint8Array, nonce: Uint8Array, plaintext: Uint8Array): Uint8Array {
  if (key.length !== 32) throw new Error('ChaCha20 key must be 32 bytes');
  if (nonce.length !== 12) throw new Error('ChaCha20 nonce must be 12 bytes');
  const out = new Uint8Array(plaintext.length);
  let counter = 1;
  for (let offset = 0; offset < plaintext.length; offset += 64) {
    const block = chacha20Block(key, counter++, nonce);
    const len = Math.min(64, plaintext.length - offset);
    for (let i = 0; i < len; i++) out[offset + i] = plaintext[offset + i] ^ block[i];
  }
  return out;
}

export const chacha20Decrypt = chacha20Encrypt; // symmetric
