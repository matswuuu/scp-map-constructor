import type {Pos} from './pos.ts';
import type {Rotation} from "./rotation.ts";
import type {Scheme} from "../types/Scheme.ts";

/**
 * Rotates a single block coordinate around a pivot
 */
export function rotateBlock(block: Pos, rotation: Rotation): Pos {
    const dx = -block.x;
    const dz = -block.z;
    let rx = dx;
    let rz = dz;

    switch (rotation) {
        case 90:
            rx = -dz;
            rz = dx;
            break;
        case 180:
            rx = -dx;
            rz = -dz;
            break;
        case 270:
            rx = dz;
            rz = -dx;
            break;
    }

    return {
        x: rx,
        y: block.y,
        z: rz
    };
}

/**
 * Rotates occupiedBlocks of a scheme
 */
export function rotateOccupiedBlocks(scheme: Scheme,
                                     rotation: Rotation): Array<Pos> {
    return scheme.occupiedBlocks.map(block => rotateBlock(block, rotation));
}

/**
 * Checks if a scheme can be placed at the given position
 */
export function canPlaceStructure(
    scheme: Scheme,
    x: number,
    z: number,
    rotation: Rotation,
    occupiedCells: Set<string>
): boolean {
    if (scheme.allowIntersection) return true;

    const rotatedBlocks = rotateOccupiedBlocks(scheme, rotation);
    for (const block of rotatedBlocks) {
        const worldX = x + (block.x);
        const worldZ = z + (block.z);
        const cellKey = `${worldX},${worldZ}`;
        if (occupiedCells.has(cellKey)) {
            return false;
        }
    }
    return true;
}

/**
 * Gets all cells that a structure would occupy
 */
export function getStructureCells(
    structure: Scheme,
    x: number,
    z: number,
    rotation: Rotation
): Pos[] {
    const rotatedBlocks = rotateOccupiedBlocks(structure, rotation);
    return rotatedBlocks.map(block => ({
        x: x + (block.x),
        y: 0,
        z: z + (block.z)
    }));
}
