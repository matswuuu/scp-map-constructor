import React from 'react';
import './SchemeSelector.css';
import type {Scheme} from "../../types/Scheme.ts";

interface SchemeSelectorProps {
    onSchemeSelect: (scheme: Scheme) => void;
    placedIds: Set<string>;
    schemes: Scheme[];
}

const SchemeSelector: React.FC<SchemeSelectorProps> = ({onSchemeSelect, placedIds, schemes}) => {
    return (
        <aside className="block-sidebar">
            <div className="block-list">
                {schemes.map((structure) => {
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