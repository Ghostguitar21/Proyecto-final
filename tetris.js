(() => {
  const gridWidth = 10;
  const gridHeight = 20;

  let canvas, ctx;
  let gridSize = 25;
  let grid = [];
  let gridTopLeft = { x: 0, y: 0 };

  const colors = [
    "#0b0d2a",             // 0 -> fondo/espacio vacío (coincide con canvas bg)
    "rgb(0,247,255)",      // 1
    "rgb(255,239,0)",      // 2
    "rgb(255,154,0)",      // 3
    "rgb(0,70,255)",       // 4
    "rgb(171,0,255)",      // 5
    "rgb(0,255,50)",       // 6
    "rgb(255,0,0)"         // 7
  ];

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
    // ahora recibe colorIndex (número) en lugar de buscar el shape en el array
    constructor(x, y, shape, colorIndex) {
      this.x = x;
      this.y = y;
      this.shape = shape;
      this.colorIndex = colorIndex || 1;
    }
    move(dx, dy){ this.x += dx; this.y += dy; }
    rotate(){
      this.shape = this.shape[0].map((_, i) => this.shape.map(row => row[i]).reverse());
    }
  }

  // Game state
  let current;
  let fallSpeed = 500;
  let lastTime = 0;
  let running = false;
  let rafId = null;
  let score = 0;

  function initGrid(){
    grid = Array.from({ length: gridHeight }, () => Array(gridWidth).fill(0));
  }

  function resizeCanvasToContainer() {
    const container = canvas.parentElement;
    const cssWidth = Math.min(420, container.clientWidth);
    gridSize = Math.max(12, Math.floor(cssWidth / gridWidth));
    canvas.width = gridWidth * gridSize;
    canvas.height = gridHeight * gridSize;
    gridTopLeft.x = 0;
    gridTopLeft.y = 0;
    ctx.imageSmoothingEnabled = false;
  }

  function drawGrid() {
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        ctx.fillStyle = colors[grid[y][x]];
        ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
        ctx.strokeStyle = "#ffffff22";
        ctx.strokeRect(x * gridSize, y * gridSize, gridSize, gridSize);
      }
    }
  }

  function drawTetrimino(t) {
    t.shape.forEach((row, ry) => {
      row.forEach((cell, rx) => {
        if (cell) {
          ctx.fillStyle = colors[t.colorIndex];
          ctx.fillRect((t.x + rx) * gridSize, (t.y + ry) * gridSize, gridSize, gridSize);
          ctx.strokeStyle = "#ffffff55";
          ctx.strokeRect((t.x + rx) * gridSize, (t.y + ry) * gridSize, gridSize, gridSize);
        }
      });
    });
  }

  function collision(t, dx = 0, dy = 0) {
    for (let y = 0; y < t.shape.length; y++) {
      for (let x = 0; x < t.shape[y].length; x++) {
        if (t.shape[y][x]) {
          const nx = t.x + x + dx;
          const ny = t.y + y + dy;
          if (nx < 0 || nx >= gridWidth || ny >= gridHeight || (grid[ny] && grid[ny][nx])) return true;
        }
      }
    }
    return false;
  }

  function clearLines() {
    let newGrid = [];
    let lines = 0;
    for (let row of grid) {
      if (row.every(c => c !== 0)) lines++; else newGrid.push(row);
    }
    while (newGrid.length < gridHeight) newGrid.unshift(Array(gridWidth).fill(0));
    grid = newGrid;
    return lines;
  }

  function lockTetrimino(t) {
    t.shape.forEach((row, y) => row.forEach((cell, x) => {
      if (cell) grid[t.y + y][t.x + x] = t.colorIndex;
    }));
  }

  function newTetrimino() {
    const idx = Math.floor(Math.random() * tetriminos.length);
    const shape = JSON.parse(JSON.stringify(tetriminos[idx])); // copia del shape
    const x = Math.floor(gridWidth / 2 - shape[0].length / 2);
    return new Tetrimino(x, 0, shape, idx + 1); // colorIndex = idx+1
  }

  function step(timestamp) {
    if (!running) return;
    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    if (delta > fallSpeed) {
      if (!collision(current, 0, 1)) {
        current.move(0,1);
      } else {
        lockTetrimino(current);
        const lines = clearLines();
        score += lines * 100;
        current = newTetrimino();
        if (collision(current)) {
          running = false;
          alert('Game Over — tu puntuación: ' + score);
          return;
        }
      }
      lastTime = timestamp;
    }

    ctx.fillStyle = "#0b0d2a";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    drawGrid();
    drawTetrimino(current);

    ctx.fillStyle = "#ffffff";
    ctx.font = `${Math.max(12, Math.floor(gridSize * 0.9))}px Arial`;
    ctx.fillText("Score: " + score, 6, Math.max(20, Math.floor(gridSize * 0.9)));

    rafId = requestAnimationFrame(step);
  }

  // public API
  window.TetrisGame = {
    init: function(canvasId) {
      canvas = document.getElementById(canvasId);
      if (!canvas) throw new Error('Canvas no encontrado: ' + canvasId);
      ctx = canvas.getContext('2d');
      initGrid();
      resizeCanvasToContainer();
      current = newTetrimino();
      score = 0;
      lastTime = 0;
      window.addEventListener('resize', () => {
        resizeCanvasToContainer();
        ctx.fillStyle = "#0b0d2a";
        ctx.fillRect(0,0,canvas.width,canvas.height);
        drawGrid();
        drawTetrimino(current);
      });

      document.addEventListener('keydown', (e) => {
        if (!current) return;
        if (e.key === 'ArrowLeft' && !collision(current, -1, 0)) current.move(-1,0);
        if (e.key === 'ArrowRight' && !collision(current, 1, 0)) current.move(1,0);
        if (e.key === 'ArrowUp') {
          current.rotate();
          if (collision(current)) {
            current.rotate(); current.rotate(); current.rotate();
          }
        }
        if (e.key === 'ArrowDown' && !collision(current, 0, 1)) current.move(0,1);
      });
    },

    start: function() {
      if (!canvas) return;
      if (!running) {
        running = true;
        lastTime = 0;
        rafId = requestAnimationFrame(step);
      }
    },

    pause: function() {
      running = false;
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },

    reset: function() {
      this.pause();
      initGrid();
      current = newTetrimino();
      score = 0;
      lastTime = 0;
      ctx.fillStyle = "#0b0d2a";
      ctx.fillRect(0,0,canvas.width,canvas.height);
      drawGrid();
      drawTetrimino(current);
    }
  };
})();
