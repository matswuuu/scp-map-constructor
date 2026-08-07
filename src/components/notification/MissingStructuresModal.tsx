import React from 'react';
import './MissingStructuresModal.css';

interface MissingStructuresModalProps {
    missing: string[];
    onClose: () => void;
}

const MissingStructuresModal: React.FC<MissingStructuresModalProps> = ({missing, onClose}) => (
    <div className="missing-structures-modal" onClick={onClose}>
        <div className="missing-structures-content" onClick={e => e.stopPropagation()}>
            <h2 className="missing-structures-title">Неустановленные структуры</h2>
            <p className="missing-structures-message">
                На карте установлены не все структуры:
            </p>
            <ul className="missing-structures-list">
                {missing.map(id => (
                    <li key={id} className="missing-structures-item">{id}</li>
                ))}
            </ul>
            <div className="missing-structures-actions">
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    </div>
);

export default React.memo(MissingStructuresModal);
