import React from 'react';
import './SchemeSelector.css';
import defaultSchemes from "../../config/schemes.ts";
import type {Scheme} from "../../types/Scheme.ts";

interface SchemeSelectorProps {
    onSchemeSelect: (scheme: Scheme) => void;
}

const SchemeSelector: React.FC<SchemeSelectorProps> = ({onSchemeSelect}) => {
    return (
        <aside className="block-sidebar">
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