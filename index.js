'use strict';
import { readFileSync } from 'fs';
import bencode from 'bencode';

import { createSocket } from 'dgram';
import { Buffer } from 'buffer';
import { parse as urlParse } from 'url';

const torrent = bencode.decode(readFileSync('puppy.torrent'));

const url = urlParse(torrent.announce.toString('utf8'));


const socket = createSocket('udp4');

const myMsg = Buffer.from('hello?', 'utf8');

socket.send(myMsg, 0, myMsg.length, url.port, url.host, () => {});

socket.on('message', msg => {
  console.log('message is', msg);
});