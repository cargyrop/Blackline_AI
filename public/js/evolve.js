/* BLACKLINE AI — evolve.js (Phase 3) */

let evolveMessages = [];
let evolveStreaming = false;

export function getEvolveMessages() { return evolveMessages; }
export function setEvolveMessages(arr) { evolveMessages = arr; }

export function isEvolveStreaming() { return evolveStreaming; }
export function setEvolveStreaming(val) { evolveStreaming = val; }
