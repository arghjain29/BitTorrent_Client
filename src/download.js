"use strict";

import net from "net";
import buffer from "buffer";
import { getPeers } from "./src/tracker.js";
import message from "./src/message.js";

/**
 * Downloads a torrent by fetching peers from its trackers and connecting to them.
 * @param {Object} torrent - The torrent object.
 * @returns {void}
 */
export default (torrent) => {
  getpeers(torrent, (peers) => {
    peers.forEach(download);
  });
};

/**
 * Downloads a file from a peer.
 * @param {Object} peer - The peer object.
 * @returns {void}
 */
const download = (peer) => {
  const socket = new net.Socket();
  socket.on("error", (err) => {
    console.log(
      `Error connecting to peer ${peer.ip}:${peer.port} - ${err.message}`,
    );
    socket.destroy();
  });
  socket.connect(peer.port, peer.ip, () => {
    console.log(`Connected to peer ${peer.ip}:${peer.port}`);
    socket.write(message.buildHandshake(torrent));
  });
  socket.on("data", (data) => {
    console.log(
      `Received data from peer ${peer.ip}:${peer.port} - ${data.length} bytes`,
    );
  });
  onWholeMsg(socket, (msg) => {
    msgHandler(msg, socket);
  });
};

function isHandshake(msg) {
  return (
    msg.length === msg.readUInt8(0) + 49 &&
    msg.toString("utf8", 1) === "BitTorrent protocol"
  );
}

function msgHandler(msg, socket) {
  if (isHandshake(msg)) {
    console.log("Handshake received");
    socket.write(message.buildInterested());
  }else {
    const m = message.parse(msg);
    console.log("Message received:", m);

    if (m.id === 0) {
      console.log("Choke message received");
    chokeHandler();
    }
    if (m.id === 1) {
      console.log("Unchoke message received");
      unchokeHandler();
    }
    if (m.id === 4) {
      console.log("Have message received");
      haveHandler(m.payload);
    }
    if (m.id === 5) {
      console.log("Bitfield message received");
      bitfieldHandler(m.payload);
    }
    if (m.id === 7) {
        console.log("Piece message received");
        pieceHandler(m.payload);
    }
  }
}

function onWholeMsg(socket, callback) {
  let savedBuf = Buffer.alloc(0);
  let handshake = true;

  socket.on("data", (recvBuf) => {
    const msglen = () =>
      handshake ? savedBuf.readUInt8(0) + 49 : savedBuf.readUInt32BE(0) + 4;
    savedBuf = Buffer.concat([savedBuf, recvBuf]);
    while (savedBuf.length >= 4 && savedBuf.length >= msglen()) {
      callback(savedBuf.slice(0, msglen()));
      savedBuf = savedBuf.slice(msglen());
      handshake = false;
    }
  });
}


function chokeHandler() {};

function unchokeHandler() {};

function haveHandler(payload) {};

function bitfieldHandler(payload) {};

function pieceHandler(payload) {};