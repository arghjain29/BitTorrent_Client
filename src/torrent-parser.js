"use strict";

import { readFileSync } from "fs";
import bencode from "bencode";
import crypto from "crypto";

export function open(filepath) {
  return bencode.decode(readFileSync(filepath));
}

export function size(torrent) {
  const size = torrent.info.files
    ? torrent.info.files.reduce((total, file) => total + file.length, 0)
    : torrent.info.length;
  // Allocate a 8-byte buffer
  const buf = Buffer.alloc(8);

  // Write the size as a 64-bit Big Endian unsigned integer
  buf.writeBigUInt64BE(BigInt(size), 0);

  return buf;
}

export function infoHash(torrent) {
  const info = bencode.encode(torrent.info);
  return crypto.createHash("sha1").update(info).digest();
}
