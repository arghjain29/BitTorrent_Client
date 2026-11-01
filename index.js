"use strict";
import { open } from "./torrent-parser.js";
import { getPeers } from "./tracker.js";

const torrent = open("torrents/sintel.torrent");

getPeers(torrent, (peers) => {
  console.log("list of peers :", peers);
});
