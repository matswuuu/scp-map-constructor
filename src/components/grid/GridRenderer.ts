import type {Camera} from "../../utils/Camera.ts";

export class GridRenderer {
    public context: CanvasRenderingContext2D;
    public camera: Camera;
    public cellSize: number;
    public canvas: HTMLCanvasElement

    constructor(
        context: CanvasRenderingContext2D,
        camera: Camera,
        cellSize: number,
        canvas: HTMLCanvasElement
    ) {
        this.context = context;
        this.camera = camera;
        this.cellSize = cellSize;
        this.canvas = canvas;
    }

    drawGridLines(startX: number, endX: number, startY: number, endY: number) {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.save();

        this.#translate()

        this.context.strokeStyle = '#8d709c';
        this.context.lineWidth = 1 / this.camera.zoom;

        const firstX = Math.floor(startX / this.cellSize) * this.cellSize;
        for (let x = firstX; x < endX; x += this.cellSize) {
            this.context.beginPath();
            this.context.moveTo(x, startY);
            this.context.lineTo(x, endY);
            this.context.stroke();
        }

        const firstY = Math.floor(startY / this.cellSize) * this.cellSize;
        for (let y = firstY; y < endY; y += this.cellSize) {
            this.context.beginPath();
            this.context.moveTo(startX, y);
            this.context.lineTo(endX, y);
            this.context.stroke();
        }

        this.context.restore();

        // Mid-point
        this.drawOutlineCell(0, 0, 'red')
    }

    drawBlockCell(x: number, z: number, color: string) {
        this.context.save();
        this.#translate();
        this.context.globalAlpha = 0.75;
        this.context.fillStyle = color;
        this.context.strokeStyle = '#333';
        this.context.lineWidth = 1 / this.camera.zoom;
        this.context.fillRect(x * this.cellSize, -z * this.cellSize, this.cellSize, this.cellSize);
        this.context.globalAlpha = 1;
        this.context.restore();
    }

    drawOutlineCell(x: number, z: number, color: string) {
        this.context.save();
        this.#translate();

        this.context.strokeStyle = color;
        this.context.lineWidth = 2 / this.camera.zoom;
        this.context.strokeRect(x * this.cellSize, -z * this.cellSize, this.cellSize, this.cellSize);

        this.context.restore();
    }

    #translate() {
        this.context.translate(this.camera.x, this.camera.y);
        this.context.scale(this.camera.zoom, this.camera.zoom);
    }
}