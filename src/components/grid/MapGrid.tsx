import React, {useCallback, useEffect, useRef, useState} from 'react';
import type {Block, BlockStructure, PlacedBlock} from "../../types/Block.ts";
import {canPlaceStructure, getStructureCells, rotateBlock} from "../../utils/structureUtils.ts";
import {GridRenderer} from "./GridRenderer.ts";
import type {Camera} from "../../utils/Camera.ts";
import type {Tool} from "../toolbar/Tool.ts";
import type {Rotation} from "../../utils/Rotation.ts";

const CELL_SIZE = 40;

interface InfiniteGridProps {
    activeTool: Tool;

    selectedStructure: BlockStructure | null;
    selectedBlock: PlacedBlock[];
    currentRotation: Rotation;
    placedBlocks: PlacedBlock[];
    structures: BlockStructure[];

    onStructurePlace: (block: PlacedBlock) => void;
    onStructureRemove: (block: Block) => void;
}

const InfinitiveGrid: React.FC<InfiniteGridProps> = ({
                                                         activeTool,

                                                         selectedStructure,
                                                         selectedBlock,
                                                         currentRotation,
                                                         placedBlocks,
                                                         structures,

                                                         onStructurePlace,
                                                         onStructureRemove
                                                     }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const [camera, setCamera] = useState<Camera>({x: 0, y: 0, zoom: 1});

    const isDragging = useRef(false);
    const dragStart = useRef({x: 0, y: 0});
    const offsetStart = useRef({x: 0, y: 0});
    const [hoverCell, setHoverCell] = useState<Block | null>(null);

    const getGridCell = (x: number, z: number): Block => {
        const canvas = canvasRef.current;
        if (!canvas) return {x: 0, y: 0, z: 0};

        const rect = canvas.getBoundingClientRect();

        // Convert screen coordinates to canvas coordinates
        let px = x - rect.left;
        let pz = z - rect.top;

        // Adjust for canvas scaling (devicePixelRatio)
        px *= canvas.width / rect.width;
        pz *= canvas.height / rect.height;

        // Convert to world coordinates (reverse the pan and zoom)
        const worldX = (px - camera.x) / camera.zoom;
        const worldY = (pz - camera.y) / camera.zoom;

        return {
            x: Math.floor(worldX / CELL_SIZE),
            y: 0,
            z: Math.floor(worldY / CELL_SIZE)
        };
    };

    const getStructureById = useCallback((id: string | null) => structures.find(s => s.id === id) || null, [structures]);

    const getOccupiedCells = useCallback(() => {
        const occupiedCells = new Set<string>();
        placedBlocks.forEach(block => {
            const structure = getStructureById(block.id);
            if (structure) {
                getStructureCells(structure, block.x, block.z, block.rotation).forEach(cell => {
                    occupiedCells.add(`${cell.x},${cell.z}`);
                });
            }
        });
        return occupiedCells;
    }, [getStructureById, placedBlocks]);

    const getRenderer = useCallback((): GridRenderer | null => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        return new GridRenderer(ctx, camera, CELL_SIZE, canvas);
    }, [camera])

    const translate = (parent: Block,
                       point: Block,
                       rotation: Rotation): Block => {
        point = rotateBlock(point, rotation)
        const worldX = parent.x + point.x;
        const worldZ = parent.z + point.z;
        return {x: worldX, y: 0, z: worldZ};
    };

    const drawGrid = useCallback(() => {
        const canvas = canvasRef.current;
        const renderer = getRenderer();
        if (!canvas || !renderer) return;

        const startX = -camera.x / camera.zoom;
        const startY = -camera.y / camera.zoom;
        const endX = startX + canvas.width / camera.zoom;
        const endY = startY + canvas.height / camera.zoom;

        renderer.drawGridLines(startX, endX, startY, endY);
    }, [camera.x, camera.y, camera.zoom, getRenderer]);

    const drawPreview = useCallback(() => {
        if (!hoverCell || !selectedStructure) return;

        const canvas = canvasRef.current;
        const renderer = getRenderer();
        if (!canvas || !renderer) return;

        selectedStructure.occupiedBlocks.forEach(occupiedBlock => {
            const {x, z} = translate(hoverCell, occupiedBlock, currentRotation)
            renderer.drawBlockCell(x, z, selectedStructure.color);
        });
        selectedStructure.anchors.forEach(anchor => {
            const {x, z} = translate(hoverCell, anchor, currentRotation)
            renderer.drawOutlineCell(x, z, "yellow");
        });
    }, [currentRotation, getRenderer, hoverCell, selectedStructure]);

    const drawPlacedBlocks = useCallback(() => {
        const canvas = canvasRef.current;
        const renderer = getRenderer();
        if (!canvas || !renderer) return;

        placedBlocks.forEach(block => {
            const structure = getStructureById(block.id);
            if (!structure) return;

            const rotation = block.rotation;
            structure.occupiedBlocks.forEach(occupiedBlock => {
                const {x, z} = translate(block, occupiedBlock, rotation)
                renderer.drawBlockCell(x, z, structure.color);
            });
            structure.anchors.forEach(anchor => {
                const {x, z} = translate(block, anchor, rotation)
                renderer.drawOutlineCell(x, z, "yellow");
            });
        });
    }, [getRenderer, getStructureById, placedBlocks]);

    const drawSelectedBlocks = useCallback(() => {
        const canvas = canvasRef.current;
        const renderer = getRenderer();
        if (!canvas || !renderer) return;

        selectedBlock.forEach(block => {
            const structure = getStructureById(block.id);
            if (!structure) return;

            const rotation = block.rotation;
            structure.occupiedBlocks.forEach(occupiedBlock => {
                const {x, z} = translate(block, occupiedBlock, rotation)
                renderer.drawOutlineCell(x, z, "blue");
            });
        });
    }, [getRenderer, getStructureById, selectedBlock]);

    const draw = useCallback(() => {
        drawGrid();
        drawPreview();
        drawPlacedBlocks();
        drawSelectedBlocks();
    }, [drawGrid, drawPreview, drawPlacedBlocks, drawSelectedBlocks]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            draw();
        };

        window.addEventListener('resize', resize);
        resize();

        return () => {
            window.removeEventListener('resize', resize);
        };
    }, [camera, drawGrid, drawPreview, drawPlacedBlocks, draw]);

    const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
        const delta = -e.deltaY * 0.005;
        const newZoom = Math.min(1, Math.max(0.35, camera.zoom + delta));

        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const worldX = (mouseX - camera.x) / camera.zoom;
        const worldY = (mouseY - camera.y) / camera.zoom;

        const newOffsetX = mouseX - worldX * newZoom;
        const newOffsetY = mouseY - worldY * newZoom;

        setCamera({x: newOffsetX, y: newOffsetY, zoom: newZoom});
        requestAnimationFrame(draw);
    };

    const placeStructure = (x: number, z: number) => {
        const cell = getGridCell(x, z);
        if (!selectedStructure) return;

        const occupiedCells = getOccupiedCells();
        if (canPlaceStructure(selectedStructure, cell.x, cell.z, currentRotation, occupiedCells)) {
            onStructurePlace({
                x: cell.x,
                y: 0,
                z: cell.z,
                id: selectedStructure.id,
                rotation: currentRotation,
            });
        }
    }

    const removeStructure = (x: number, z: number) => {
        const cell = getGridCell(x, z);
        onStructureRemove({x: cell.x, y: 0, z: cell.z});
    }

    const drag = (x: number, y: number) => {
        isDragging.current = true;
        dragStart.current = {x: x, y: y};
        offsetStart.current = {...camera};
    }

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        switch (e.button) {
            case 0:
                if (e.shiftKey) {
                    drag(e.clientX, e.clientY)
                } else if (selectedStructure) {
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

            setCamera({
                x: offsetStart.current.x + dx,
                y: offsetStart.current.y + dy,
                zoom: camera.zoom,
            });
            requestAnimationFrame(draw);
        } else {
            const hoverCell = getGridCell(e.clientX, e.clientY);
            setHoverCell(hoverCell);
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
