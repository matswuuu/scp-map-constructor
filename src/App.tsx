import React, {useCallback, useMemo, useRef, useState} from 'react';
import './App.css';
import InfiniteGrid from "./components/grid/MapGrid.tsx";
import type {Pos} from "./utils/pos.ts";
import defaultStructures from "./config/blocks.ts";
import Toolbar from "./components/toolbar/Toolbar.tsx";
import {getStructureCells} from "./utils/structure-utils.ts";
import BlockSelector from "./components/selector/SchemeSelector.tsx";
import type {Tool, ToolType} from "./components/toolbar/Tool.ts";
import {FaMousePointer, FaPlusSquare, FaSyncAlt} from "react-icons/fa";
import {FaComputerMouse} from "react-icons/fa6";
import {useHotkeys} from "react-hotkeys-hook";
import type {Rotation} from "./utils/rotation.ts";
import useUndo from "use-undo";
import type {Layer} from "./types/Layer.ts";
import {WarnOnPageUnload} from "./components/WarnMessage.tsx";
import type {Scheme} from "./types/scheme/Scheme.ts";
import type {Structure} from "./types/Structure.ts";

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
            setSelectedBlock(getBlocksMatchingCell(cell));
        },
        onUnselect: () => {
            setSelectedBlock([])
        }
    })
    tools.set('rotator', {
        value: 'rotator',
        title: 'Rotator - CTRL + R',
        icon: <FaSyncAlt/>,
        onCellClick: cell => {
            getBlocksMatchingCell(cell)
                .forEach((v: Structure) => v.rotation = (v.rotation + 90) % 360 as Rotation);
        }
    })
    tools.set('placer', {
        value: 'placer',
        title: 'Placer',
        icon: <FaPlusSquare/>,
        onUnselect: () => {
            setSelectedStructure(null)
        }
    })

    const [activeTool, setActiveTool] = useState<Tool>(tools.get('selector')!);
    const updateActiveTool = (tool: ToolType) => {
        setActiveTool(tools.get(tool)!);
    }

    const [selectedStructure, setSelectedStructure] = useState<Scheme | null>(null);
    const [selectedBlock, setSelectedBlock] = useState<Structure[]>([]);
    const [currentRotation, setCurrentRotation] = useState<Rotation>(0);

    const LAYER_DEFS = useMemo(() => [
        {value: "light-zone", name: "Легкая зона"},
        {value: "hard-zone", name: "Тяжелая зона"},
        {value: "office-zone", name: "Офисы"}
    ], []);

    const [allBlocks, {set: setAllBlocks, undo, redo}] = useUndo<Record<string, Structure[]>>({
        ...Object.fromEntries(LAYER_DEFS.map((def) => [def.value, []]))
    });

    const layers: Layer[] = useMemo(() =>
            LAYER_DEFS.map((def: Omit<Layer, 'placedBlocks'>) => ({
                ...def,
                placedBlocks: allBlocks.present[def.value] || []
            })),
        [LAYER_DEFS, allBlocks.present]
    );

    const [currentLayer, setCurrentLayer] = useState<string>(LAYER_DEFS[0].value);

    const currentLayerBlocks = useMemo(() => allBlocks.present[currentLayer] || [], [allBlocks.present, currentLayer]);

    // Helper to get structure for a block
    const getStructureForBlock = (b: Structure): Scheme | undefined =>
        defaultStructures.find((s: Scheme) => s.schemeId === b.schemeId);

    // Helper to get blocks matching a cell
    const getBlocksMatchingCell = (cell: Pos): Structure[] =>
        currentLayerBlocks.filter((b: Structure) => {
            const structure = getStructureForBlock(b);
            if (!structure) return true;
            const cells = getStructureCells(structure, b.pos.x, b.pos.z, b.rotation);
            return cells.some((v: Pos) => v.x === cell.x && v.z === cell.z);
        });

    const handleStructurePlace = useCallback((block: Structure) => {
        setAllBlocks({
            ...allBlocks.present,
            [currentLayer]: [...currentLayerBlocks, block]
        });
    }, [allBlocks.present, setAllBlocks, currentLayer, currentLayerBlocks]);

    const handleStructureRemove = useCallback((block: Pos) => {
        setAllBlocks({
            ...allBlocks.present,
            [currentLayer]: currentLayerBlocks.filter((b: Structure) => {
                const structure = defaultStructures.find((s: Scheme) => s.schemeId === b.schemeId);
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
        if (selectedBlock.length > 0) {
            handleStructureRemove(selectedBlock[0].pos)
            setSelectedBlock([])
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
                        if (importedLayer?.placedBlocks) {
                            importedBlocks[def.value] = importedLayer.placedBlocks.map((b: any) => {
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
                                    throw new Error('Each block must have either a coords array or explicit x, y, z fields.');
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
        // Export coordinates as [x, y, z] arrays
        const data = {
            layers: layers.map(layer => ({
                ...layer,
                placedBlocks: layer.placedBlocks.map(b => ({
                    ...b,
                    pos: [b.pos.x, b.pos.y, b.pos.z]
                }))
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
                selectedScheme={selectedStructure}
                selectedStructure={selectedBlock}
                currentRotation={currentRotation}
                placedStructures={currentLayerBlocks}
                schemes={defaultStructures}
                onStructurePlace={handleStructurePlace}
                onStructureRemove={handleStructureRemove}
            />
            <BlockSelector
                onSchemeSelect={structure => {
                    setSelectedStructure(structure)
                    updateActiveTool('placer')
                }}
                layers={layers}
                currentLayer={currentLayer}
                onLayerChange={setCurrentLayer}
            />
        </div>
    );
}

export default React.memo(App);
