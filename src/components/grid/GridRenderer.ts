import type {Camera} from "../../utils/camera.ts";

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

    /**
     * Applies the camera transform once for the whole frame.
     * All drawing methods below assume world coordinates.
     */
    beginFrame() {
        const ctx = this.context;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.save();
        ctx.translate(this.camera.x, this.camera.y);
        ctx.scale(this.camera.zoom, this.camera.zoom);
    }

    endFrame() {
        this.context.restore();
    }

    drawGridLines(startX: number, endX: number, startY: number, endY: number) {
        const ctx = this.context;
        const cs = this.cellSize;

        ctx.strokeStyle = '#8d709c';
        ctx.lineWidth = 1 / this.camera.zoom;
        ctx.beginPath();

        const firstX = Math.floor(startX / cs) * cs;
        for (let x = firstX; x < endX; x += cs) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
        }

        const firstY = Math.floor(startY / cs) * cs;
        for (let y = firstY; y < endY; y += cs) {
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
        }

        ctx.stroke();
    }

    beginFill(color: string) {
        const ctx = this.context;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.75;
    }

    fillCell(x: number, z: number) {
        const cs = this.cellSize;
        this.context.fillRect(-x * cs, -z * cs, cs, cs);
    }

    endFill() {
        this.context.globalAlpha = 1;
    }

    beginStroke(color: string) {
        const ctx = this.context;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 / this.camera.zoom;
        ctx.beginPath();
    }

    strokeCell(x: number, z: number) {
        const cs = this.cellSize;
        this.context.rect(-x * cs, -z * cs, cs, cs);
    }

    endStroke() {
        this.context.stroke();
    }

    outlineCell(x: number, z: number, color: string) {
        const ctx = this.context;
        const cs = this.cellSize;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 / this.camera.zoom;
        ctx.strokeRect(-x * cs, -z * cs, cs, cs);
    }
}
