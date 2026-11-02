// Sudoku generator + solver. Har puzzle ka sirf ek hi hal hota hai.
(function (root) {
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function canPlace(g, i, v) {
    const r = Math.floor(i / 9), c = i % 9, br = r - (r % 3), bc = c - (c % 3);
    for (let k = 0; k < 9; k++) {
      if (g[r * 9 + k] === v || g[k * 9 + c] === v) return false;
      if (g[(br + Math.floor(k / 3)) * 9 + bc + (k % 3)] === v) return false;
    }
    return true;
  }

  // Poora bhara hua grid (random)
  function fill(g) {
    const i = g.indexOf(0);
    if (i < 0) return true;
    for (const v of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
      if (canPlace(g, i, v)) { g[i] = v; if (fill(g)) return true; g[i] = 0; }
    }
    return false;
  }

  // Kitne hal hain (limit tak gino) — sabse kam options wale khaane se shuru (tez)
  function countSolutions(g, limit = 2) {
    let best = -1, bestOpts = null;
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue;
      const opts = [];
      for (let v = 1; v <= 9; v++) if (canPlace(g, i, v)) opts.push(v);
      if (!opts.length) return 0;
      if (!bestOpts || opts.length < bestOpts.length) { best = i; bestOpts = opts; if (opts.length === 1) break; }
    }
    if (best < 0) return 1;
    let n = 0;
    for (const v of bestOpts) {
      g[best] = v;
      n += countSolutions(g, limit - n);
      g[best] = 0;
      if (n >= limit) break;
    }
    return n;
  }

  // clues = kitne number dikhenge (kam = mushkil)
  function generate(clues) {
    const solution = Array(81).fill(0);
    fill(solution);
    const puzzle = solution.slice();
    let shown = 81;
    for (const i of shuffle([...Array(81).keys()])) {
      if (shown <= clues) break;
      const keep = puzzle[i];
      puzzle[i] = 0;
      if (countSolutions(puzzle.slice()) !== 1) puzzle[i] = keep;
      else shown--;
    }
    return { puzzle, solution };
  }

  const api = { generate, countSolutions, canPlace };
  if (typeof module !== "undefined") module.exports = api;
  else root.Sudoku = api;
})(this);
