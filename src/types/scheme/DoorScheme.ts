import {type Anchor, Scheme} from "./Scheme.ts";
import type {Pos} from "../../utils/pos.ts";
import {metadata} from "../../decorators/metadata.decorator.ts";

export class DoorScheme extends Scheme {

    doorPos1: Pos;
    doorPos2: Pos;
    @metadata()
    accessLevel: number;

    constructor(id: string,
                type: string,
                pivot: Pos,
                pos1: Pos,
                pos2: Pos,
                color: string,
                anchors: Anchor[],
                occupiedBlocks: Pos[],
                doorPos1: Pos,
                doorPos2: Pos,
                accessLevel: number) {
        super(id, type, pivot, pos1, pos2, color, anchors, occupiedBlocks);
        this.doorPos1 = doorPos1;
        this.doorPos2 = doorPos2;
        this.accessLevel = accessLevel;
    }

}