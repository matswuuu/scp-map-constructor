import type {JSX} from "react";
import type {Block} from "../../types/Block.ts";

export type ToolType = 'grabber' | 'selector' | 'rotator' | 'placer';

export interface Tool {
    value: ToolType;
    title: string;
    icon: JSX.Element;

    onCellClick?: (cell: Block) => void;
    onSelect?: () => void;
    onUnselect?: () => void;
}