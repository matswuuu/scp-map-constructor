import React from 'react';
import './StructureCounter.css';
import type {Scheme} from "../../types/Scheme.ts";
import type {Structure} from "../../types/Structure.ts";

interface StructureCounterProps {
    structures: Structure[];
    schemes: Scheme[];
}

const StructureCounter: React.FC<StructureCounterProps> = ({structures, schemes}) => {
    const counts = new Map<string, number>();
    structures.forEach(structure => {
        counts.set(structure.schemeId, (counts.get(structure.schemeId) || 0) + 1);
    });

    const placed = Array.from(counts.entries())
        .filter(([, count]) => count > 0)
        .sort(([a], [b]) => a.localeCompare(b));

    return (
        <div className="structure-counter">
            <div className="structure-counter__title">
                Structures: {structures.length}
            </div>
            <div className="structure-counter__list">
                {placed.map(([schemeId, count]) => {
                    const scheme = schemes.find(s => s.id === schemeId);
                    return (
                        <div key={schemeId} className="structure-counter__item">
                            <span
                                className="structure-counter__swatch"
                                style={{backgroundColor: scheme?.color || 'var(--tg-color-text-secondary)'}}
                            />
                            <span className="structure-counter__id">{schemeId}</span>
                            <span className="structure-counter__count">{count}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default React.memo(StructureCounter);
