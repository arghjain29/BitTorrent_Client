"use strict";
import { open } from "./src/torrent-parser.js";
import { getPeers } from "./src/tracker.js";

const torrent = open("torrents/sintel.torrent");

getPeers(torrent, (peers) => {
  console.log("list of peers :", peers);
});
