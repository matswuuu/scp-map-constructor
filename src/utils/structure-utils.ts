import type {Pos} from './pos.ts';
import type {Rotation} from "./rotation.ts";
import type {Scheme} from "../types/Scheme.ts";
import type {Structure} from "../types/Structure.ts";

const TILE_SIZE = 32;
const TILE_KEY_MULT = 1 << 20;

export interface PreparedCells {
    cells: Int32Array; // flat [x0, z0, x1, z1, ...] offsets relative to the structure pivot, rotation applied
    count: number;
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    tileMap: Map<number, Uint32Array>; // tileKey -> cell indices into `cells`
}

const preparedCache = new Map<string, PreparedCells>();

/**
 * Rotates a single block coordinate around a pivot
 */
export function rotateBlock(block: Pos, rotation: Rotation): Pos {
    switch (rotation) {
        case 90:
            return {x: -block.z, y: block.y, z: block.x};
        case 180:
            return {x: -block.x, y: block.y, z: -block.z};
        case 270:
            return {x: block.z, y: block.y, z: -block.x};
        default:
            return {x: block.x, y: block.y, z: block.z};
    }
}

/**
 * Rotates occupiedBlocks of a scheme
 */
export function rotateOccupiedBlocks(scheme: Scheme,
                                     rotation: Rotation): Array<Pos> {
    return scheme.occupiedBlocks.map(block => rotateBlock(block, rotation));
}

/**
 * Gets all cells that a scheme would occupy
 */
export function getStructureCells(
    scheme: Scheme,
    x: number,
    z: number,
    rotation: Rotation
): Pos[] {
    const rotatedBlocks = rotateOccupiedBlocks(scheme, rotation);
    return rotatedBlocks.map(block => ({
        x: x + (block.x),
        y: 0,
        z: z + (block.z)
    }));
}

/**
 * Precomputes (and caches) rotated cell data for a (scheme, rotation) pair.
 * Result is shared across all placed instances, so a huge scheme is only
 * processed once per rotation actually used.
 */
export function getPreparedCells(scheme: Scheme, rotation: Rotation): PreparedCells {
    const cacheKey = `${scheme.id}:${rotation}`;
    const cached = preparedCache.get(cacheKey);
    if (cached) return cached;

    const occupied = scheme.occupiedBlocks;
    const n = occupied.length;
    const cells = new Int32Array(n * 2);
    const tileLists = new Map<number, number[]>();
    let minX = Infinity;
    let maxX = -Infinity;
    let minZ = Infinity;
    let maxZ = -Infinity;

    for (let i = 0; i < n; i++) {
        const r = rotateBlock(occupied[i], rotation);
        const x = r.x;
        const z = r.z;
        cells[i * 2] = x;
        cells[i * 2 + 1] = z;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;

        const tileKey = Math.floor(x / TILE_SIZE) * TILE_KEY_MULT + Math.floor(z / TILE_SIZE);
        let list = tileLists.get(tileKey);
        if (!list) {
            list = [];
            tileLists.set(tileKey, list);
        }
        list.push(i);
    }

    const tileMap = new Map<number, Uint32Array>();
    for (const [key, list] of tileLists) {
        tileMap.set(key, Uint32Array.from(list));
    }

    const prepared: PreparedCells = {cells, count: n, minX, maxX, minZ, maxZ, tileMap};
    preparedCache.set(cacheKey, prepared);
    return prepared;
}

/**
 * Iterates only the cells of a placed structure that intersect the given
 * cell-space viewport, using the structure's tile index to skip out-of-view cells.
 */
export function forEachVisibleCell(
    prepared: PreparedCells,
    posX: number,
    posZ: number,
    cellMinX: number,
    cellMaxX: number,
    cellMinZ: number,
    cellMaxZ: number,
    callback: (x: number, z: number) => void
): void {
    if (posX + prepared.maxX < cellMinX || posX + prepared.minX > cellMaxX) return;
    if (posZ + prepared.maxZ < cellMinZ || posZ + prepared.minZ > cellMaxZ) return;

    const startTx = Math.floor((cellMinX - posX) / TILE_SIZE);
    const endTx = Math.floor((cellMaxX - posX) / TILE_SIZE);
    const startTz = Math.floor((cellMinZ - posZ) / TILE_SIZE);
    const endTz = Math.floor((cellMaxZ - posZ) / TILE_SIZE);

    const cells = prepared.cells;
    for (let tx = startTx; tx <= endTx; tx++) {
        for (let tz = startTz; tz <= endTz; tz++) {
            const indices = prepared.tileMap.get(tx * TILE_KEY_MULT + tz);
            if (!indices) continue;
            for (let j = 0; j < indices.length; j++) {
                const i = indices[j] * 2;
                const wx = posX + cells[i];
                const wz = posZ + cells[i + 1];
                if (wx >= cellMinX && wx <= cellMaxX && wz >= cellMinZ && wz <= cellMaxZ) {
                    callback(wx, wz);
                }
            }
        }
    }
}

export const cellKey = (x: number, z: number): string => `${x},${z}`;

/**
 * Builds a cell -> structures index for O(1) hit-testing and collision checks.
 */
export function buildCellIndex(
    structures: Structure[],
    schemeById: Map<string, Scheme>
): Map<string, Structure[]> {
    const index = new Map<string, Structure[]>();
    for (const structure of structures) {
        const scheme = schemeById.get(structure.schemeId);
        if (!scheme) continue;
        const prepared = getPreparedCells(scheme, structure.rotation);
        const cells = prepared.cells;
        for (let i = 0; i < prepared.count; i++) {
            const key = cellKey(structure.pos.x + cells[i * 2], structure.pos.z + cells[i * 2 + 1]);
            let list = index.get(key);
            if (!list) {
                list = [];
                index.set(key, list);
            }
            list.push(structure);
        }
    }
    return index;
}

/**
 * Checks if a scheme can be placed at the given position
 */
export function canPlaceStructure(
    scheme: Scheme,
    x: number,
    z: number,
    rotation: Rotation,
    occupied: Set<string> | ((key: string) => boolean)
): boolean {
    if (scheme.allowIntersection) return true;

    const has = typeof occupied === 'function' ? occupied : (key: string) => occupied.has(key);
    const prepared = getPreparedCells(scheme, rotation);
    const cells = prepared.cells;
    for (let i = 0; i < prepared.count; i++) {
        if (has(cellKey(x + cells[i * 2], z + cells[i * 2 + 1]))) {
            return false;
        }
    }
    return true;
}
