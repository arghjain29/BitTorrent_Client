"use strict";

import { createSocket } from "dgram";
import { Buffer } from "buffer";
import { randomBytes } from "crypto";

import { infoHash, size } from "./torrent-parser.js";
import { genId, group } from "./util.js";

// How long to wait for a tracker to reply before moving on to the next one
const TRACKER_TIMEOUT_MS = 5000;

export function getPeers(torrent, callback) {
  const socket = createSocket("udp4");
  const urls = udpTrackerUrls(torrent);
  let index = 0;
  let currentUrl = null;
  let transactionId = null; // id of the request we're waiting on
  let timer = null;

  // Send a request to the current tracker and give up on it if it doesn't reply in time
  function send(message) {
    transactionId = message.readUInt32BE(12);
    const url = currentUrl;
    clearTimeout(timer);
    timer = setTimeout(tryNextTracker, TRACKER_TIMEOUT_MS);
    udpSend(socket, message, url, (err) => {
      // e.g. DNS lookup failed: skip straight to the next tracker
      if (err && url === currentUrl) tryNextTracker();
    });
  }

  function tryNextTracker() {
    clearTimeout(timer);
    if (index >= urls.length) {
      console.log("No UDP tracker responded.");
      socket.close();
      return;
    }
    currentUrl = urls[index++];
    console.log("Trying tracker:", currentUrl);
    // 1. send connect request
    send(buildConnReq());
  }

  socket.on("message", (response) => {
    // ignore late replies from trackers we already gave up on
    if (response.length < 8 || response.readUInt32BE(4) !== transactionId) return;

    if (respType(response) === "connect") {
      // 2. receive and parse connect response
      const connResp = parseConnResp(response);
      // 3. send announce request
      send(buildAnnounceReq(connResp.connectionId, torrent));
    } else if (respType(response) === "announce") {
      clearTimeout(timer);
      // 4. parse announce response
      const announceResp = parseAnnounceResp(response);
      socket.close();
      // 5. pass peers to callback
      callback(announceResp.peers);
    }
  });

  tryNextTracker();
}

// All UDP trackers in the torrent: "announce" first, then "announce-list", without duplicates.
// bencode returns Uint8Array, so wrap each in a Buffer to decode as text.
function udpTrackerUrls(torrent) {
  const raw = [];
  if (torrent.announce) raw.push(torrent.announce);
  if (torrent["announce-list"]) raw.push(...torrent["announce-list"].flat());

  const urls = raw.map((u) => Buffer.from(u).toString("utf8"));
  return [...new Set(urls)].filter((u) => {
    try {
      const url = new URL(u);
      return url.protocol === "udp:" && url.port !== "";
    } catch {
      return false;
    }
  });
}

function udpSend(socket, message, rawUrl, callback=()=>{}) {
  const url = new URL(rawUrl);
  socket.send(message, 0, message.length, Number(url.port), url.hostname, callback);
}

/*
Offset  Size            Name            Value
0       64-bit integer  connection_id   0x41727101980
8       32-bit integer  action          0 // connect
12      32-bit integer  transaction_id  ? // random
16
*/
function buildConnReq() {
  const buf = Buffer.alloc(16);

  // connection id
  buf.writeUInt32BE(0x417, 0);
  buf.writeUInt32BE(0x27101980, 4);
  // action
  buf.writeUInt32BE(0, 8);
  // transaction id
  randomBytes(4).copy(buf, 12);

  return buf;
}

/*
Offset  Size            Name            Value
0       32-bit integer  action          0 // connect
4       32-bit integer  transaction_id
8       64-bit integer  connection_id
16
*/
function parseConnResp(resp) {
  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    connectionId: resp.slice(8)
  }
}

/* 
Offset  Size    Name    Value
0       64-bit integer  connection_id
8       32-bit integer  action          1 // announce
12      32-bit integer  transaction_id
16      20-byte string  info_hash
36      20-byte string  peer_id
56      64-bit integer  downloaded
64      64-bit integer  left
72      64-bit integer  uploaded
80      32-bit integer  event           0 // 0: none; 1: completed; 2: started; 3: stopped
84      32-bit integer  IP address      0 // default
88      32-bit integer  key             ? // random
92      32-bit integer  num_want        -1 // default
96      16-bit integer  port            ? // should be betwee
98
*/
function buildAnnounceReq(connId, torrent, port = 6881) {
  const buf = Buffer.allocUnsafe(98);

  // connection id
  connId.copy(buf, 0);
  // action
  buf.writeUInt32BE(1, 8);
  // transaction id
  randomBytes(4).copy(buf, 12);
  // info hash
  infoHash(torrent).copy(buf, 16);
  // peerId
  genId().copy(buf, 36);
  // downloaded
  Buffer.alloc(8).copy(buf, 56);
  // left
  size(torrent).copy(buf, 64);
  // uploaded
  Buffer.alloc(8).copy(buf, 72);
  // event
  buf.writeUInt32BE(0, 80);
  // ip address
  buf.writeUInt32BE(0, 84);
  // key
  randomBytes(4).copy(buf, 88);
  // num want
  buf.writeInt32BE(-1, 92);
  // port
  buf.writeUInt16BE(port, 96);

  return buf;
}

/*
 Offset      Size            Name            Value
0           32-bit integer  action          1 // announce
4           32-bit integer  transaction_id
8           32-bit integer  interval
12          32-bit integer  leechers
16          32-bit integer  seeders
20 + 6 * n  32-bit integer  IP address
24 + 6 * n  16-bit integer  TCP port
20 + 6 * N
 */
function parseAnnounceResp(resp) {
  return {
    action: resp.readUInt32BE(0),
    transactionId: resp.readUInt32BE(4),
    interval: resp.readUInt32BE(8),
    leechers: resp.readUInt32BE(12),
    seeders: resp.readUInt32BE(16),
    peers: group(resp.slice(20), 6).map((address) => {
      return {
        ip: Array.from(address.slice(0, 4)).join("."),
        port: address.readUInt16BE(4)
      };
    })
  };
}
/*
action: 1 for announce, 0 for connect
*/
function respType(resp) {
  const action = resp.readUInt32BE(0);
  if (action === 0) return "connect";
  if (action === 1) return "announce";
}
