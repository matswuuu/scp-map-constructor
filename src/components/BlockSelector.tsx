import React from 'react';
import './BlockSelector.css';
import defaultStructures from "../config/blocks.ts";
import type {BlockStructure} from "../types/Block.ts";

interface BlockSelectorProps {
    onStructureSelect: (structure: BlockStructure) => void;
    layers: { value: string; name: string }[];
    currentLayer: string;
    onLayerChange: (layer: string) => void;
}

const BlockSelector: React.FC<BlockSelectorProps> = ({onStructureSelect, layers, currentLayer, onLayerChange}) => {
    return (
        <aside className="block-sidebar">
            <div>
                <select id="options" value={currentLayer} onChange={e => onLayerChange(e.target.value)}>
                    {layers.map((option) => (
                        <option key={option.value} value={option.value}>{option.name}</option>
                    ))}
                </select>
            </div>
            <div className="block-list">
                {defaultStructures.map((structure) => (
                    <button key={structure.id}
                            className="block-item"
                            onClick={() => onStructureSelect(structure)}>
                        {structure.id}
                    </button>
                ))}
            </div>
        </aside>
    );
};

export default React.memo(BlockSelector); 