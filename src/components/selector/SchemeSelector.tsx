import React from 'react';
import './SchemeSelector.css';
import defaultSchemes from "../../config/blocks.ts";
import type {Scheme} from "../../types/scheme/Scheme.ts";

interface SchemeSelectorProps {
    onSchemeSelect: (scheme: Scheme) => void;
    layers: { value: string; name: string }[];
    currentLayer: string;
    onLayerChange: (layer: string) => void;
}

const SchemeSelector: React.FC<SchemeSelectorProps> = ({onSchemeSelect, layers, currentLayer, onLayerChange}) => {
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
                {defaultSchemes.map((structure) => (
                    <button key={structure.id}
                            className="block-item"
                            onClick={() => onSchemeSelect(structure)}>
                        {structure.id}
                    </button>
                ))}
            </div>
        </aside>
    );
};

export default React.memo(SchemeSelector);