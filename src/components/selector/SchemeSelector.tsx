import React from 'react';
import './SchemeSelector.css';
import defaultStructures from "../../config/blocks.ts";
import type {Scheme} from "../../types/scheme/Scheme.ts";
import {getAnnotatedFields} from "../../utils/metadata-utils.ts";
import {DoorScheme} from "../../types/scheme/DoorScheme.ts";

interface SchemeSelectorProps {
    onSchemeSelect: (scheme: Scheme) => void;
    layers: { value: string; name: string }[];
    currentLayer: string;
    onLayerChange: (layer: string) => void;
}

const SchemeSelector: React.FC<SchemeSelectorProps> = ({onSchemeSelect, layers, currentLayer, onLayerChange}) => {
    const v = new DoorScheme("", {x: 0, y: 0, z: 0}, {x: 0, y: 0, z: 0}, {x: 0, y: 0, z: 0}, "", [], [], {
        x: 0,
        y: 0,
        z: 0
    }, {x: 0, y: 0, z: 0}, 3);
    const fields = getAnnotatedFields(v);

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
                    <button key={structure.schemeId}
                            className="block-item"
                            onClick={() => onSchemeSelect(structure)}>
                        {structure.schemeId}
                    </button>
                ))}
            </div>
        </aside>
    );
};

export default React.memo(SchemeSelector);