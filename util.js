"use strict";

import crypto from "crypto";

/**
 * Generate a unique ID for the client.
 * @returns {Buffer} The generated ID.
 */
export function genId() {
  let id = null;
  if (!id) {
    id = crypto.randomBytes(20);
    Buffer.from("-AJ0001-").copy(id, 0);
  }
  return id;
}

/**
 * Group an array into sub-arrays of a specified size.
 * @param {Array} iterable - The array to group.
 * @param {number} groupSize - The size of each group.
 * @returns {Array<Array>} The grouped array.
 */
export function group(iterable, groupSize) {
  let groups = [];
  for (let i = 0; i < iterable.length; i += groupSize) {
    groups.push(iterable.slice(i, i + groupSize));
  }
  return groups;
}
