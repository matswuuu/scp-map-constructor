import React from "react";
import type {Structure} from "../../types/Structure.ts";

interface MetadataEditorProps {
    structure: Structure;
    metadata: Map<string, any>;
    onChange: (structure: Structure, key: string, value: any) => void;
    onClose: () => void;
}

const MetadataEditor: React.FC<MetadataEditorProps> = ({ structure, metadata, onChange, onClose }) => (
    <div className="metadata-editor-modal" onClick={onClose}>
        <div className="metadata-editor-content" onClick={e => e.stopPropagation()}>
            <h2>Edit Metadata</h2>
            <table className="metadata-editor-table">
                <tbody>
                {[...metadata.entries()].map(([key]) => (
                    <tr key={key}>
                        <td className="metadata-editor-key">{key}</td>
                        <td className="metadata-editor-value">
                            <input
                                type="text"
                                value={String(structure.metadata?.get(key) ?? '')}
                                onChange={e => onChange(structure, key, e.target.value)}
                            />
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
            <div className="metadata-editor-actions">
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    </div>
);

export default MetadataEditor; 