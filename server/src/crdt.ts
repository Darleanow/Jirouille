/**
 * Simple G-Counter CRDT (grow-only). One nodeId for this server.
 * We increment on successful register/login to demonstrate CRDT usage.
 * In a multi-node setup, each node would merge by per-key max.
 */

import type { GCounter } from "./types";

const NODE_ID = process.env.NODE_ID || "server-1";

const gcounter: GCounter = { counts: { [NODE_ID]: 0 } };

export function crdtIncrementAuth() {
    gcounter.counts[NODE_ID] = (gcounter.counts[NODE_ID] ?? 0) + 1;
}

/** Merge another counter in-place (max per node key) */
export function crdtMerge(other: GCounter) {
    for (const [k, v] of Object.entries(other.counts)) {
        const cur = gcounter.counts[k] ?? 0;
        if ((v as number) > cur) gcounter.counts[k] = v as number;
    }
}

export function crdtTotal(): number {
    return Object.values(gcounter.counts).reduce(
        (a, b) => (a as number) + (b as number),
        0
    );
}

export function crdtSnapshot(): GCounter {
    return { counts: { ...gcounter.counts } };
}
