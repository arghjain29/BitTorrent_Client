"use strict";
import { open } from "./torrent-parser.js";
import { getPeers } from "./tracker.js";

const torrent = open("puppy.torrent");

getPeers(torrent, (peers) => {
  console.log("list of peers :", peers);
});
