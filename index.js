"use strict";
import torrentParser from "./torrent-parser.js";
import tracker from "./tracker.js";

const torrent = torrentParser.open("puppy.torrent");

tracker.getPeers(torrent, (peers) => {
    console.log('list of peers :', peers);
})
