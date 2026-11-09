'use strict';

import net from "net";
import buffer from "buffer";
import { getPeers } from "./src/tracker.js";

/**
 * Downloads a torrent by fetching peers from its trackers and connecting to them.
 * @param {Object} torrent - The torrent object.
 * @returns {void}
 */
export default torrent => {
    getpeers(torrent, peers => {
        peers.forEach(download)
    });
}


/**
 * Downloads a file from a peer.
 * @param {Object} peer - The peer object.
 * @returns {void}
 */
const download = peer => {
    const socket = net.Socket();
    socket.on('error', err => {
        console.log(`Error connecting to peer ${peer.ip}:${peer.port} - ${err.message}`);
        socket.destroy();
    })
    socket.connect(peer.port, peer.ip, () => {
        console.log(`Connected to peer ${peer.ip}:${peer.port}`);
    });
    socket.on('data', data => {
        console.log(`Received data from peer ${peer.ip}:${peer.port} - ${data.length} bytes`);
    });
};