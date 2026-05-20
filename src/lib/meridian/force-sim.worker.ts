import { runForceSim } from './force-sim.js';

self.onmessage = (e: MessageEvent) => {
  self.postMessage(runForceSim(e.data));
};
