"use strict";

import { readFileSync } from "fs";
import bencode from "bencode";
import crypto from "crypto";
import bignum from "bignum";

export function open(filepath) {
  return bencode.decode(readFileSync(filepath));
}

export function size(torrent) {
  const size = torrent.info.files ? 
    torrent.info.files.reduce((total, file) => total + file.length, 0) : torrent.info.length;
  return bignum.toBuffer(size, { size: 8 });
}

export function infoHash(torrent) {
  const info = bencode.encode(torrent.info);
  return crypto.createHash("sha1").update(info).digest();
}
