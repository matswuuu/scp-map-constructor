import type {JSX} from "react";
import type {Pos} from "../../utils/pos.ts";

export type ToolType = 'grabber' | 'selector' | 'rotator' | 'placer' | 'metadata-editor';

export interface Tool {
    value: ToolType;
    title: string;
    icon: JSX.Element;

    onCellClick?: (cell: Pos) => void;
    onSelect?: () => void;
    onUnselect?: () => void;
}