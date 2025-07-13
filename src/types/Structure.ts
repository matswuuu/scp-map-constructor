import type {Rotation} from "../utils/rotation.ts";
import type {Pos} from "../utils/pos.ts";

export interface Structure {
    schemeId: string;
    type: string;
    pos: Pos;
    rotation: Rotation;
    metadata?: Map<string, object>
}