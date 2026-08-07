import React from 'react';
import './SchemeSelector.css';
import defaultSchemes from "../../config/schemes.ts";
import type {Scheme} from "../../types/Scheme.ts";

interface SchemeSelectorProps {
    onSchemeSelect: (scheme: Scheme) => void;
    placedIds: Set<string>;
}

const SchemeSelector: React.FC<SchemeSelectorProps> = ({onSchemeSelect, placedIds}) => {
    return (
        <aside className="block-sidebar">
            <div className="block-list">
                {defaultSchemes.map((structure) => {
                    const placed = placedIds.has(structure.id);
                    return (
                        <button key={structure.id}
                                className={`block-item${placed ? ' block-item--placed' : ''}`}
                                onClick={() => onSchemeSelect(structure)}>
                            {structure.id}
                        </button>
                    );
                })}
            </div>
        </aside>
    );
};

export default React.memo(SchemeSelector);