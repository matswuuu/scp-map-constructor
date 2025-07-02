import configData from './blocks.json';
import type {BlockStructure} from '../types/Block';

interface Anchor {
    pos: number[]
}

// Helper to convert [x, y, z] to {x, y, z}
function arrToXYZ(arr: number[]) {
    return {x: arr[0], y: arr[1], z: arr[2]};
}

function toBlockStructure(raw: any): BlockStructure {
    return {
        id: raw.id,
        pivotPoint: arrToXYZ(raw.pivot),
        pos1: arrToXYZ(raw.pos1),
        pos2: arrToXYZ(raw.pos2),
        anchors: raw.anchors.map((a: Anchor) => arrToXYZ(a.pos)),
        occupiedBlocks: raw.occupiedBlocks.map((arr: number[]) => arrToXYZ(arr)),
        color: raw.color || 'red',
    };
}

const defaultStructures: BlockStructure[] = configData.map(toBlockStructure);

export default defaultStructures;