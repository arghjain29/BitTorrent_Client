import { Buffer } from "buffer";

const buf = Buffer.from([
  0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x20, 0x77, 0x6f, 0x72,
  0x6c, 0x64
]);

console.log(buf);
// outputs <Buffer 68 65 6c 6c 6f 20 77 6f 72 6c 64>

console.log(buf.toString("utf16le"));
// outputs '敨汬⁯潷汲'

console.log(buf.toString("utf8"));
// outputs 'hello world'

console.log(Buffer.from("hello world", "utf8"));
// outputs <Buffer 68 65 6c 6c 6f 20 77 6f 72 6c 64>

// ====================================================

// create an empty buffer with length of 4 bytes.
const numbuf = Buffer.alloc(4);

// write the unsigned 32-bit, big-endian number 123 into the buffer starting
// at index 0 of the buffer.
numbuf.writeUInt32BE(123, 0);

// read the number starting at index 0
console.log(numbuf.readUInt32BE(0));
// outputs: 123