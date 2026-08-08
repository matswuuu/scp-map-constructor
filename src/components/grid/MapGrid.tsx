import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import type {Pos} from "../../utils/pos.ts";
import {canPlaceStructure, forEachVisibleCell, getPreparedCells, rotateBlock} from "../../utils/structure-utils.ts";
import {GridRenderer} from "./GridRenderer.ts";
import type {Camera} from "../../utils/camera.ts";
import type {Tool} from "../toolbar/Tool.ts";
import type {Rotation} from "../../utils/rotation.ts";
import type {Scheme} from "../../types/Scheme.ts";
import {Structure} from "../../types/Structure.ts";

const CELL_SIZE = 40;

interface InfiniteGridProps {
    activeTool: Tool;

    selectedScheme: Scheme | null;
    selectedStructure: Structure[];
    currentRotation: Rotation;
    placedStructures: Structure[];
    schemes: Scheme[];
    cellIndex: Map<string, Structure[]>;

    onStructurePlace: (structure: Structure) => void;
    onStructureRemove: (pos: Pos) => void;
}

const InfinitiveGrid: React.FC<InfiniteGridProps> = ({
                                                         activeTool,

                                                         selectedScheme,
                                                         selectedStructure,
                                                         currentRotation,
                                                         placedStructures,
                                                         schemes,
                                                         cellIndex,

                                                         onStructurePlace,
                                                         onStructureRemove
                                                     }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const cameraRef = useRef<Camera>({x: 0, y: 0, zoom: 1});
    const hoverCellRef = useRef<Pos | null>(null);

    const isDragging = useRef(false);
    const dragStart = useRef({x: 0, y: 0});
    const offsetStart = useRef<Camera>({x: 0, y: 0, zoom: 1});

    const rafRef = useRef<number | null>(null);
    const renderRef = useRef<() => void>(() => {
    });

    const schemeById = useMemo(() => new Map(schemes.map(s => [s.id, s])), [schemes]);

    const anchorMap = useMemo(() => {
        const map = new Map<string, Pos[]>();
        for (const scheme of schemes) {
            map.set(scheme.id, scheme.anchors);
        }
        return map;
    }, [schemes]);

    const getGridCell = (x: number, z: number): Pos => {
        const canvas = canvasRef.current;
        if (!canvas) return {x: 0, y: 0, z: 0};

        const rect = canvas.getBoundingClientRect();
        const camera = cameraRef.current;

        // Convert screen coordinates to canvas coordinates
        let px = x - rect.left;
        let pz = z - rect.top;

        // Adjust for canvas scaling (devicePixelRatio)
        px *= canvas.width / rect.width;
        pz *= canvas.height / rect.height;

        // Convert to world coordinates (reverse the pan and zoom)
        const worldX = (px - camera.x) / camera.zoom;
        const worldZ = (pz - camera.y) / camera.zoom;

        return {
            x: -Math.floor(worldX / CELL_SIZE),
            y: 0,
            z: -Math.floor(worldZ / CELL_SIZE)
        };
    };

    const translate = (parent: Pos, point: Pos, rotation: Rotation): Pos => {
        const r = rotateBlock(point, rotation);
        return {x: parent.x + r.x, y: 0, z: parent.z + r.z};
    };

    const renderFrame = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const camera = cameraRef.current;
        const renderer = new GridRenderer(ctx, camera, CELL_SIZE, canvas);

        const startX = -camera.x / camera.zoom;
        const startZ = -camera.y / camera.zoom;
        const endX = startX + canvas.width / camera.zoom;
        const endZ = startZ + canvas.height / camera.zoom;

        const cellMinX = Math.ceil(-endX / CELL_SIZE) - 1;
        const cellMaxX = Math.floor(-startX / CELL_SIZE) + 1;
        const cellMinZ = Math.ceil(-endZ / CELL_SIZE) - 1;
        const cellMaxZ = Math.floor(-startZ / CELL_SIZE) + 1;

        renderer.beginFrame();
        renderer.drawGridLines(startX, endX, startZ, endZ);
        renderer.outlineCell(0, 0, 'red');

        // Placement preview
        const hover = hoverCellRef.current;
        if (hover && selectedScheme) {
            const prepared = getPreparedCells(selectedScheme, currentRotation);
            renderer.beginFill(selectedScheme.color);
            forEachVisibleCell(prepared, hover.x, hover.z, cellMinX, cellMaxX, cellMinZ, cellMaxZ, (wx, wz) => {
                renderer.fillCell(wx, wz);
            });
            renderer.endFill();

            const anchors = anchorMap.get(selectedScheme.id) ?? [];
            for (const anchor of anchors) {
                const {x, z} = translate(hover, anchor, currentRotation);
                if (x >= cellMinX && x <= cellMaxX && z >= cellMinZ && z <= cellMaxZ) {
                    renderer.outlineCell(x, z, "yellow");
                }
            }

            renderer.beginFill("green");
            renderer.fillCell(hover.x, hover.z);
            renderer.endFill();
        }

        // Placed structures
        for (const block of placedStructures) {
            const scheme = schemeById.get(block.schemeId);
            if (!scheme) continue;

            const prepared = getPreparedCells(scheme, block.rotation);
            const {x, z} = block.pos;
            if (x + prepared.maxX < cellMinX || x + prepared.minX > cellMaxX) continue;
            if (z + prepared.maxZ < cellMinZ || z + prepared.minZ > cellMaxZ) continue;

            renderer.beginFill(scheme.color);
            forEachVisibleCell(prepared, x, z, cellMinX, cellMaxX, cellMinZ, cellMaxZ, (wx, wz) => {
                renderer.fillCell(wx, wz);
            });
            renderer.endFill();

            const anchors = anchorMap.get(block.schemeId);
            if (anchors) {
                for (const anchor of anchors) {
                    const {x: ax, z: az} = translate(block.pos, anchor, block.rotation);
                    if (ax >= cellMinX && ax <= cellMaxX && az >= cellMinZ && az <= cellMaxZ) {
                        renderer.outlineCell(ax, az, "yellow");
                    }
                }
            }

            if (x >= cellMinX && x <= cellMaxX && z >= cellMinZ && z <= cellMaxZ) {
                renderer.beginFill("green");
                renderer.fillCell(x, z);
                renderer.endFill();
            }
        }

        // Selected structures
        for (const block of selectedStructure) {
            const scheme = schemeById.get(block.schemeId);
            if (!scheme) continue;

            const prepared = getPreparedCells(scheme, block.rotation);
            const {x, z} = block.pos;
            if (x + prepared.maxX < cellMinX || x + prepared.minX > cellMaxX) continue;
            if (z + prepared.maxZ < cellMinZ || z + prepared.minZ > cellMaxZ) continue;

            renderer.beginStroke("blue");
            forEachVisibleCell(prepared, x, z, cellMinX, cellMaxX, cellMinZ, cellMaxZ, (wx, wz) => {
                renderer.strokeCell(wx, wz);
            });
            renderer.endStroke();
        }

        renderer.endFrame();
    }, [selectedScheme, selectedStructure, placedStructures, currentRotation, schemeById, anchorMap]);

    useEffect(() => {
        renderRef.current = renderFrame;
    }, [renderFrame]);

    const scheduleFrame = useCallback(() => {
        if (rafRef.current !== null) return;
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null;
            renderRef.current();
        });
    }, []);

    // Redraw whenever anything the frame depends on changes
    useEffect(() => {
        scheduleFrame();
    }, [renderFrame, scheduleFrame]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            renderRef.current();
        };

        window.addEventListener('resize', resize);
        resize();

        return () => {
            window.removeEventListener('resize', resize);
        };
    }, []);

    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const camera = cameraRef.current;
        const delta = -e.deltaY * 0.005;
        const newZoom = Math.min(1, Math.max(0.35, camera.zoom + delta));

        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const worldX = (mouseX - camera.x) / camera.zoom;
        const worldZ = (mouseY - camera.y) / camera.zoom;

        const newOffsetX = mouseX - worldX * newZoom;
        const newOffsetY = mouseY - worldZ * newZoom;

        cameraRef.current = {x: newOffsetX, y: newOffsetY, zoom: newZoom};
        scheduleFrame();
    };

    const placeStructure = (x: number, z: number) => {
        const cell = getGridCell(x, z);
        if (!selectedScheme) return;

        if (canPlaceStructure(selectedScheme, cell.x, cell.z, currentRotation, key => cellIndex.has(key))) {
            onStructurePlace(new Structure(
                selectedScheme.id,
                selectedScheme.type,
                {x: cell.x, y: 0, z: cell.z},
                currentRotation
            ));
        }
    }

    const removeStructure = (x: number, z: number) => {
        const cell = getGridCell(x, z);
        onStructureRemove({x: cell.x, y: 0, z: cell.z});
    }

    const drag = (x: number, y: number) => {
        isDragging.current = true;
        dragStart.current = {x: x, y: y};
        offsetStart.current = {...cameraRef.current};
    }

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        switch (e.button) {
            case 0:
                if (e.shiftKey) {
                    drag(e.clientX, e.clientY)
                } else if (selectedScheme) {
                    placeStructure(e.clientX, e.clientY);
                } else if (e.ctrlKey) {
                    removeStructure(e.clientX, e.clientY)
                } else {
                    drag(e.clientX, e.clientY)

                    const cell = getGridCell(e.clientX, e.clientY)
                    activeTool.onCellClick?.(cell)
                }

                break
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isDragging.current) {
            const dx = e.clientX - dragStart.current.x;
            const dy = e.clientY - dragStart.current.y;

            const camera = cameraRef.current;
            cameraRef.current = {
                x: offsetStart.current.x + dx,
                y: offsetStart.current.y + dy,
                zoom: camera.zoom,
            };
            scheduleFrame();
        } else {
            const cell = getGridCell(e.clientX, e.clientY);
            const prev = hoverCellRef.current;
            if (!prev || prev.x !== cell.x || prev.z !== cell.z) {
                hoverCellRef.current = cell;
                scheduleFrame();
            }
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    return (
        <canvas
            ref={canvasRef}
            className={"grid"}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        />
    );
};

export default InfinitiveGrid;
