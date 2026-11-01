'use strict';

import fs from 'fs';

const torrent = fs.readFileSync('puppy.torrent');
console.log(torrent.toString('utf-8'));