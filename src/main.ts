const WIDTH = 20;
const HEIGHT = 20;
const MINE_COUNT = 50;
const GSIZE = 30;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

const imgs: { [key: string]: HTMLImageElement } = {
  "1": document.getElementById("type1") as HTMLImageElement,
  "2": document.getElementById("type2") as HTMLImageElement,
  "3": document.getElementById("type3") as HTMLImageElement,
  "4": document.getElementById("type4") as HTMLImageElement,
  "5": document.getElementById("type5") as HTMLImageElement,
  "6": document.getElementById("type6") as HTMLImageElement,
  "7": document.getElementById("type7") as HTMLImageElement,
  "8": document.getElementById("type8") as HTMLImageElement,
  closed: document.getElementById("closed") as HTMLImageElement,
  open: document.getElementById("open") as HTMLImageElement,
  flag: document.getElementById("flag") as HTMLImageElement,
  mine: document.getElementById("mine") as HTMLImageElement,
};

interface Cell {
  num: number;
  mine: boolean;
  open: boolean;
  flagged: boolean;
}

let cells: Cell[][];
let minesInitialized = false;

function init() {
  cells = Array(HEIGHT)
    .fill(0)
    .map(() =>
      Array(WIDTH)
        .fill(9)
        .map(
          () => ({ mine: false, num: 0, open: false, flagged: false } as Cell)
        )
    );
  minesInitialized = false;
}

function initMines(exX: number, exY: number) {
  let bombCoords = Array(HEIGHT)
    .fill(0)
    .map((_, j) =>
      Array(WIDTH)
        .fill(9)
        .map((_, i) => [j, i])
    )
    .flat()
    .filter(([y, x]) => !(Math.abs(x - exX) <= 1 && Math.abs(y - exY) <= 1))
    .sort(() => 0.5 - Math.random())
    .slice(0, MINE_COUNT);

  for (const [j, i] of bombCoords) {
    cells[j][i].mine = true;
  }

  for (let j = 0; j < HEIGHT; j++) {
    for (let i = 0; i < WIDTH; i++) {
      let count = 0;
      for (const [v, u] of NEIGHBORS) {
        if (
          0 <= j + v &&
          j + v < HEIGHT &&
          0 <= i + u &&
          i + u < WIDTH &&
          cells[j + v][i + u].mine
        ) {
          count++;
        }
      }
      cells[j][i].num = count;
    }
  }
}

//offset of neightbors
const NEIGHBORS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

ctx.font = "200px serif";
ctx.fillStyle = "black";

function draw() {
  for (let j = 0; j < HEIGHT; j++) {
    for (let i = 0; i < WIDTH; i++) {
      const cell = cells[j][i];
      //prettier-ignore
      const img = !cell.open   ? imgs.closed
                : cell.mine    ? imgs.mine
                : cell.num > 0 ? imgs[String(cell.num)]
                : imgs.open;

      ctx.drawImage(img, i * GSIZE, j * GSIZE, GSIZE, GSIZE);
      if (cell.flagged)
        ctx.drawImage(imgs.flag, i * GSIZE, j * GSIZE, GSIZE, GSIZE);
    }
  }
}

const rect = canvas.getBoundingClientRect();

function isValidCoord(x: number, y: number) {
  return x >= 0 && y >= 0 && x < WIDTH && y < HEIGHT;
}

function openRecursive(x: number, y: number) {
  if (cells[y][x].open) return;
  cells[y][x].open = true;
  cells[y][x].flagged = false;
  if (cells[y][x].num === 0) {
    for (const [v, u] of NEIGHBORS) {
      if (isValidCoord(x + u, y + v) && !cells[y + v][x + u].open)
        openRecursive(x + u, y + v);
    }
  }
}

function openAllMines() {
  for (let j = 0; j < HEIGHT; j++) {
    for (let i = 0; i < WIDTH; i++) {
      if (cells[j][i].mine) {
        cells[j][i].open = true;
        cells[j][i].flagged = false;
      }
    }
  }
}

canvas.oncontextmenu = () => false;
canvas.onmousedown = (e) => {
  const x = Math.floor((e.clientX - rect.left) / GSIZE);
  const y = Math.floor((e.clientY - rect.top) / GSIZE);
  if (!minesInitialized) {
    initMines(x, y);
    minesInitialized = true;
  }
  if (x > WIDTH || y > HEIGHT) return;

  if (e.button === 0) {
    if (!cells[y][x].flagged) {
      if (cells[y][x].mine) {
        openAllMines();
        setTimeout(() => {
          alert("game over");
          init();
          draw();
        }, 0.01);
      }
      openRecursive(x, y);

      if (
        cells.flat().filter((cell) => cell.open).length ==
        WIDTH * HEIGHT - MINE_COUNT
      ) {
        openAllMines();
        setTimeout(() => {
          alert("game clear");
          init();
          draw();
        }, 0.01);
      }
    }
  } else {
    if (!cells[y][x].open) {
      cells[y][x].flagged = !cells[y][x].flagged;
    }
  }

  draw();
};

async function main() {
  //verify all images are loaded
  await Promise.all(
    Object.values(imgs).map(
      (img) =>
        new Promise((resolve) => {
          if (img.complete) resolve(0);
          img.onload = () => resolve(0);
        })
    )
  );
  init();
  draw();
}

main();

export {};
