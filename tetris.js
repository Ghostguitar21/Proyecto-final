const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const screenWidth = 400;
const screenHeight = 600;

const BLACK = "rgb(25,0,90)";
const WHITE = "white";

const colors = [
    "rgb(0,0,0)",
    "rgb(0,247,255)",
    "rgb(255,239,0)",
    "rgb(255,154,0)",
    "rgb(0,70,255)",
    "rgb(171,0,255)",
    "rgb(0,255,50)",
    "rgb(255,0,0)"
];

const gridSize = 25;
const gridWidth = 10;
const gridHeight = 20;
const gridTopLeft = { x: 100, y: 50 };

let grid = Array.from({ length: gridHeight }, () =>
    Array(gridWidth).fill(0)
);

const tetriminos = [
    [[1,1,1,1]],
    [[1,1],[1,1]],
    [[1,0,0],[1,1,1]],
    [[0,0,1],[1,1,1]],
    [[0,1,0],[1,1,1]],
    [[0,1,1],[1,1,0]],
    [[1,1,0],[0,1,1]]
];

class Tetrimino {
    constructor(x, y, shape) {
        this.x = x;
        this.y = y;
        this.shape = shape;
        this.color = colors[tetriminos.indexOf(shape) + 1];
    }

    move(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    rotate() {
        this.shape = this.shape[0].map((_, i) =>
            this.shape.map(row => row[i]).reverse()
        );
    }
}

function drawGrid() {
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            ctx.fillStyle = colors[grid[y][x]];
            ctx.fillRect(
                gridTopLeft.x + x * gridSize,
                gridTopLeft.y + y * gridSize,
                gridSize,
                gridSize
            );
            ctx.strokeStyle = WHITE;
            ctx.strokeRect(
                gridTopLeft.x + x * gridSize,
                gridTopLeft.y + y * gridSize,
                gridSize,
                gridSize
            );
        }
    }
}

function drawTetrimino(t) {
    t.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell) {
                ctx.fillStyle = t.color;
                ctx.fillRect(
                    gridTopLeft.x + (t.x + x) * gridSize,
                    gridTopLeft.y + (t.y + y) * gridSize,
                    gridSize,
                    gridSize
                );
                ctx.strokeStyle = WHITE;
                ctx.strokeRect(
                    gridTopLeft.x + (t.x + x) * gridSize,
                    gridTopLeft.y + (t.y + y) * gridSize,
                    gridSize,
                    gridSize
                );
            }
        });
    });
}

function collision(t, dx = 0, dy = 0) {
    for (let y = 0; y < t.shape.length; y++) {
        for (let x = 0; x < t.shape[y].length; x++) {
            if (t.shape[y][x]) {
                let newX = t.x + x + dx;
                let newY = t.y + y + dy;

                if (
                    newX < 0 ||
                    newX >= gridWidth ||
                    newY >= gridHeight ||
                    (grid[newY] && grid[newY][newX])
                ) {
                    return true;
                }
            }
        }
    }
    return false;
}

function clearLines() {
    let newGrid = [];
    let linesCleared = 0;

    for (let row of grid) {
        if (row.every(cell => cell !== 0)) {
            linesCleared++;
        } else {
            newGrid.push(row);
        }
    }

    while (newGrid.length < gridHeight) {
        newGrid.unshift(Array(gridWidth).fill(0));
    }

    grid = newGrid;
    return linesCleared;
}

function lockTetrimino(t) {
    t.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
            if (cell) {
                grid[t.y + y][t.x + x] =
                    colors.indexOf(t.color);
            }
        });
    });
}

function newTetrimino() {
    let shape = tetriminos[Math.floor(Math.random() * tetriminos.length)];
    let x = Math.floor(gridWidth / 2 - shape[0].length / 2);
    return new Tetrimino(x, 0, shape);
}

let tetrimino = newTetrimino();
let fallSpeed = 500;
let fallTime = 0;
let lastTime = 0;
let score = 0;

document.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft" && !collision(tetrimino, -1, 0))
        tetrimino.move(-1, 0);
    if (e.key === "ArrowRight" && !collision(tetrimino, 1, 0))
        tetrimino.move(1, 0);
    if (e.key === "ArrowUp") {
        tetrimino.rotate();
        if (collision(tetrimino)) {
            tetrimino.rotate();
            tetrimino.rotate();
            tetrimino.rotate();
        }
    }
});

function gameLoop(timestamp) {
    ctx.fillStyle = BLACK;
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    drawGrid();
    drawTetrimino(tetrimino);

    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.fillText("Score: " + score, 20, 30);

    if (timestamp - lastTime > fallSpeed) {
        if (!collision(tetrimino, 0, 1)) {
            tetrimino.move(0, 1);
        } else {
            lockTetrimino(tetrimino);
            score += clearLines() * 1000;
            tetrimino = newTetrimino();
            if (collision(tetrimino)) {
                alert("Game Over");
                document.location.reload();
            }
        }
        lastTime = timestamp;
    }

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
