import type {Rotation} from "../utils/rotation.ts";
import type {Pos} from "../utils/pos.ts";

export class Structure {
    schemeId: string;
    type: string;
    pos: Pos;
    rotation: Rotation;
    metadata: Map<string, object> = new Map();

    constructor(
        schemeId: string,
        type: string,
        pos: Pos,
        rotation: Rotation
    ) {
        this.schemeId = schemeId;
        this.type = type;
        this.pos = pos;
        this.rotation = rotation;
    }
}