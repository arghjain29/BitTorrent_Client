'use strict';

import { readFileSync } from 'fs';
import bencode from 'bencode';

export function open(filepath) {
  return bencode.decode(readFileSync(filepath));
}

export function size(torrent) {
  // ...
}

export function infoHash(torrent) {
  // ...
}