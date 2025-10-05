import React, {useCallback, useMemo, useRef, useState} from 'react';
import './App.css';
import InfiniteGrid from "./components/grid/MapGrid.tsx";
import type {Pos} from "./utils/pos.ts";
import defaultSchemes from "./config/schemes.ts";
import Toolbar from "./components/toolbar/Toolbar.tsx";
import {getStructureCells} from "./utils/structure-utils.ts";
import BlockSelector from "./components/selector/SchemeSelector.tsx";
import type {Tool, ToolType} from "./components/toolbar/Tool.ts";
import {FaEdit, FaMousePointer, FaPlusSquare, FaSyncAlt} from "react-icons/fa";
import {FaComputerMouse} from "react-icons/fa6";
import {useHotkeys} from "react-hotkeys-hook";
import type {Rotation} from "./utils/rotation.ts";
import useUndo from "use-undo";
import type {Layer} from "./types/Layer.ts";
import {WarnOnPageUnload} from "./components/WarnMessage.tsx";
import {Scheme} from "./types/Scheme.ts";
import type {Structure} from "./types/Structure.ts";
import MetadataEditor from "./components/toolbar/MetadataEditor";
import "./components/toolbar/MetadataEditor.css";

function App() {
    const tools = new Map<ToolType, Tool>();
    tools.set('grabber', {
        value: 'grabber',
        title: 'Ungrab mouse',
        icon: <FaComputerMouse/>
    })
    tools.set('selector', {
        value: 'selector',
        title: 'Selector',
        icon: <FaMousePointer/>,
        onCellClick: cell => {
            setSelectedStructure(getBlocksMatchingPos(cell));
        },
        onUnselect: () => {
            setSelectedStructure([])
        }
    })
    tools.set('rotator', {
        value: 'rotator',
        title: 'Rotator - CTRL + R',
        icon: <FaSyncAlt/>,
        onCellClick: cell => {
            getBlocksMatchingPos(cell)
                .forEach((v: Structure) => v.rotation = (v.rotation + 90) % 360 as Rotation);
        }
    })
    tools.set('placer', {
        value: 'placer',
        title: 'Placer',
        icon: <FaPlusSquare/>,
        onUnselect: () => {
            setSelectedScheme(null)
        }
    })
    tools.set('metadata-editor', {
        value: 'metadata-editor',
        title: 'Metadata editor',
        icon: <FaEdit/>,
        onCellClick: cell => {
            const structures = getBlocksMatchingPos(cell);
            if (structures.length === 0) return;
            const structure = structures[0];
            const scheme = defaultSchemes.find(s => s.id === structure.schemeId);
            if (scheme) {
                setMetadataEditor({structure, metadata: scheme.metadata});
            }
        }
    })

    const [activeTool, setActiveTool] = useState<Tool>(tools.get('selector')!);
    const updateActiveTool = (tool: ToolType) => {
        setActiveTool(tools.get(tool)!);
    }

    const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
    const [selectedStructure, setSelectedStructure] = useState<Structure[]>([]);
    const [currentRotation, setCurrentRotation] = useState<Rotation>(0);
    const [metadataEditor, setMetadataEditor] =
        useState<{ structure: Structure, metadata: Map<string, any> } | null>(null);

    const LAYER_DEFS = useMemo(() => [
        {value: "light-zone", name: "Легкая зона"},
        {value: "hard-zone", name: "Тяжелая зона"},
        {value: "office-zone", name: "Офисы"}
    ], []);

    const [allBlocks, {set: setAllBlocks, undo, redo}] = useUndo<Record<string, Structure[]>>({
        ...Object.fromEntries(LAYER_DEFS.map((def) => [def.value, []]))
    });

    const layers: Layer[] = useMemo(() =>
            LAYER_DEFS.map((def: Omit<Layer, 'structures'>) => ({
                ...def,
                structures: allBlocks.present[def.value] || []
            })),
        [LAYER_DEFS, allBlocks.present]
    );

    const [currentLayer, setCurrentLayer] = useState<string>(LAYER_DEFS[0].value);

    const currentLayerBlocks = useMemo(() => allBlocks.present[currentLayer] || [], [allBlocks.present, currentLayer]);

    // Helper to get structure for a block
    const getScheme = (structure: Structure): Scheme | undefined =>
        defaultSchemes.find((s: Scheme) => s.id === structure.schemeId);

    // Helper to get blocks matching a cell
    const getBlocksMatchingPos = (pos: Pos): Structure[] =>
        currentLayerBlocks.filter((b: Structure) => {
            const scheme = getScheme(b);
            if (!scheme) return true;
            const cells = getStructureCells(scheme, b.pos.x, b.pos.z, b.rotation);
            return cells.some((v: Pos) => v.x === pos.x && v.z === pos.z);
        });

    const handleStructurePlace = useCallback((structure: Structure) => {
        const parent = getBlocksMatchingPos(structure.pos)
        if (parent.length > 0) { // Used with structures, that allows intersection
            structure.rotation = parent[0].rotation;
        }

        setAllBlocks({
            ...allBlocks.present,
            [currentLayer]: [...currentLayerBlocks, structure]
        });
    }, [allBlocks.present, setAllBlocks, currentLayer, currentLayerBlocks]);

    const handleStructureRemove = useCallback((block: Pos) => {
        setAllBlocks({
            ...allBlocks.present,
            [currentLayer]: currentLayerBlocks.filter((b: Structure) => {
                const structure = defaultSchemes.find((s: Scheme) => s.id === b.schemeId);
                if (!structure) return true;
                const cells = getStructureCells(structure, b.pos.x, b.pos.z, b.rotation);
                return !cells.some((cell: Pos) => cell.x === block.x && cell.z === block.z);
            })
        });
    }, [allBlocks.present, setAllBlocks, currentLayer, currentLayerBlocks]);

    useHotkeys('ctrl+r', () => setCurrentRotation((currentRotation + 90) % 360 as Rotation));
    useHotkeys('ctrl+z', () => undo());
    useHotkeys('ctrl+y', () => redo());
    useHotkeys(['delete', 'backspace'], () => {
        if (selectedStructure.length > 0) {
            handleStructureRemove(selectedStructure[0].pos)
            setSelectedStructure([])
        }
    });


    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = e.target?.result as string;
                const data = JSON.parse(json);
                if (data && Array.isArray(data.layers)) {
                    // Only import blocks for known layers
                    const importedBlocks: Record<string, Structure[]> = {};
                    LAYER_DEFS.forEach(def => {
                        const importedLayer = data.layers.find((l: { value: string }) => l.value === def.value);
                        if (importedLayer?.structures) {
                            importedBlocks[def.value] = importedLayer.structures.map((b: any) => {
                                // Only support [x, y, z] array or explicit x, y, z fields
                                let x, y, z;
                                if (Array.isArray(b.pos)) {
                                    [x, y, z] = b.pos;
                                } else if (
                                    typeof b.x === 'number' &&
                                    typeof b.y === 'number' &&
                                    typeof b.z === 'number'
                                ) {
                                    x = b.x;
                                    y = b.y;
                                    z = b.z;
                                } else {
                                    throw new Error(
                                        'Each block must have either a coords array or explicit x, y, z fields.');
                                }
                                return {
                                    ...b,
                                    pos: {
                                        x: x,
                                        y: y,
                                        z: z,
                                    }
                                };
                            });
                        } else {
                            importedBlocks[def.value] = [];
                        }
                    });
                    setAllBlocks(importedBlocks);
                } else {
                    alert('Invalid file format: missing layers array');
                }
            } catch (err) {
                console.error(err);
                alert('Failed to import file: ' + (err instanceof Error ? err.message : String(err)));
            }
        };
        reader.readAsText(file);
    };

    const handleImport = () => {
        fileInputRef.current?.click();
    }

    const handleExport = () => {
        const data = {
            data: {
                schemeData: {
                    name: "test",
                    path: "classpath:///config/rooms/test-scheme.json",
                    previewImagePath: "https://storage.c7x.dev/matswuuu/scp/v0.0.1/resources/textures/map/test-map-preview.png"
                },
            },
            layers: layers.map(layer => ({
                ...layer,
                structures: layer.structures.map(b => {
                    const metaObj = b.metadata ? Object.fromEntries(b.metadata) : {};
                    return {
                        ...b,
                        ...metaObj,
                        pos: [b.pos.x, b.pos.y, b.pos.z],
                        metadata: undefined
                    };
                })
            }))
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], {type: "application/json"});
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "map-config.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        const file = new File([blob], "map-config.json", {
            type: "application/json"
        });

        const formData = new FormData();
        formData.append("file", file);

        fetch("https://tmpfiles.org/api/v1/upload", {
            method: "POST",
            body: formData
        })
            .then(response => response.json())
            .then(result => {
                navigator.clipboard.writeText(result.data.url);
                alert(`URL '${result.data.url}' copied to clipboard`);
            })
            .catch(error => {
                console.error("Upload failed:", error);
            });
    };

    return (
        <div className="app">
            <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{display: 'none'}}
            />

            <WarnOnPageUnload/>

            <Toolbar
                activeTool={activeTool}
                onSelectTool={updateActiveTool}
                tools={[...tools.values()]}
                onImport={handleImport}
                onExport={handleExport}
            />
            <InfiniteGrid
                activeTool={activeTool}
                selectedScheme={selectedScheme}
                selectedStructure={selectedStructure}
                currentRotation={currentRotation}
                placedStructures={currentLayerBlocks}
                schemes={defaultSchemes}
                onStructurePlace={handleStructurePlace}
                onStructureRemove={handleStructureRemove}
            />
            <BlockSelector
                onSchemeSelect={structure => {
                    setSelectedScheme(structure)
                    updateActiveTool('placer')
                }}
                layers={layers}
                currentLayer={currentLayer}
                onLayerChange={setCurrentLayer}
            />
            {metadataEditor && (
                <MetadataEditor
                    structure={metadataEditor.structure}
                    metadata={metadataEditor.metadata}
                    onChange={(structure, key, value) => {
                        structure.metadata.set(key, value);

                        setAllBlocks({
                            ...allBlocks.present,
                            [currentLayer]: currentLayerBlocks.map(b => {
                                if (b === metadataEditor.structure) {
                                    const newMetadata = new Map(b.metadata || []);
                                    newMetadata.set(key, value);
                                    return { ...b, metadata: newMetadata };
                                }
                                return b;
                            })
                        });
                        setMetadataEditor(prev => prev && ({
                            ...prev,
                            structure: {
                                ...prev.structure,
                                metadata: new Map([
                                    ...(prev.structure.metadata || []),
                                    [key, value]
                                ])
                            }
                        }));
                    }}
                    onClose={() => setMetadataEditor(null)}
                />
            )}
        </div>
    );
}

export default React.memo(App);
