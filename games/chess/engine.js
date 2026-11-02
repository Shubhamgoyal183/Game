// Chess engine: poore niyam (castling, en passant, promotion, check/mate/stalemate) + computer (alpha-beta)
// Board: 64 khaane, index = row*8 + col, row 0 = rank 8 (upar), row 7 = rank 1 (neeche)
// Mohre: White = "PNBRQK", Black = "pnbrqk", khaali = null
(function (root) {
  const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  const isW = (p) => p && p === p.toUpperCase();
  const colorOf = (p) => (p ? (isW(p) ? "w" : "b") : null);
  const N = [-17, -15, -10, -6, 6, 10, 15, 17];
  const KDIR = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
  const BISH = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  const ROOK = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  const rc = (i) => [i >> 3, i & 7];
  const ok = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

  function fromFEN(fen) {
    const [pos, turn, cast, ep] = fen.split(" ");
    const board = Array(64).fill(null);
    let i = 0;
    for (const ch of pos.replace(/\//g, "")) {
      if (/\d/.test(ch)) i += +ch;
      else board[i++] = ch;
    }
    const sq = (s) => (s === "-" ? -1 : (8 - +s[1]) * 8 + (s.charCodeAt(0) - 97));
    return {
      board, turn,
      castle: { K: cast.includes("K"), Q: cast.includes("Q"), k: cast.includes("k"), q: cast.includes("q") },
      ep: sq(ep),
    };
  }

  function clone(s) {
    return { board: s.board.slice(), turn: s.turn, castle: { ...s.castle }, ep: s.ep };
  }

  // Kya `sq` khaane par `by` rang ka hamla hai?
  function attacked(board, sq, by) {
    const [r, c] = rc(sq);
    const w = by === "w";
    // Pyaada
    const pr = w ? r + 1 : r - 1;
    for (const dc of [-1, 1]) if (ok(pr, c + dc) && board[pr * 8 + c + dc] === (w ? "P" : "p")) return true;
    // Ghoda
    for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]])
      if (ok(r + dr, c + dc) && board[(r + dr) * 8 + c + dc] === (w ? "N" : "n")) return true;
    // Raja
    for (const [dr, dc] of KDIR) if (ok(r + dr, c + dc) && board[(r + dr) * 8 + c + dc] === (w ? "K" : "k")) return true;
    // Seedhi aur tirchi lines
    const slide = (dirs, a, b) => {
      for (const [dr, dc] of dirs) {
        let rr = r + dr, cc = c + dc;
        while (ok(rr, cc)) {
          const p = board[rr * 8 + cc];
          if (p) { if (p === a || p === b) return true; break; }
          rr += dr; cc += dc;
        }
      }
      return false;
    };
    return slide(ROOK, w ? "R" : "r", w ? "Q" : "q") || slide(BISH, w ? "B" : "b", w ? "Q" : "q");
  }

  const kingSq = (board, color) => board.indexOf(color === "w" ? "K" : "k");
  const inCheck = (s, color = s.turn) => attacked(s.board, kingSq(s.board, color), color === "w" ? "b" : "w");

  function pseudo(s) {
    const { board, turn } = s;
    const moves = [];
    const add = (from, to, extra = {}) => moves.push({ from, to, piece: board[from], captured: board[to], ...extra });
    for (let i = 0; i < 64; i++) {
      const p = board[i];
      if (!p || colorOf(p) !== turn) continue;
      const [r, c] = rc(i);
      const t = p.toLowerCase();
      if (t === "p") {
        const dir = turn === "w" ? -1 : 1, startRow = turn === "w" ? 6 : 1, lastRow = turn === "w" ? 0 : 7;
        const one = (r + dir) * 8 + c;
        const pushPromo = (to, cap) => {
          if (rc(to)[0] === lastRow) for (const pr of "qrbn") add(i, to, { promo: turn === "w" ? pr.toUpperCase() : pr, ...cap });
          else add(i, to, cap);
        };
        if (ok(r + dir, c) && !board[one]) {
          pushPromo(one, {});
          const two = (r + 2 * dir) * 8 + c;
          if (r === startRow && !board[two]) add(i, two, { double: true });
        }
        for (const dc of [-1, 1]) {
          if (!ok(r + dir, c + dc)) continue;
          const to = (r + dir) * 8 + c + dc;
          if (board[to] && colorOf(board[to]) !== turn) pushPromo(to, {});
          else if (to === s.ep) add(i, to, { epCapture: true, captured: turn === "w" ? "p" : "P" });
        }
      } else if (t === "n") {
        for (const [dr, dc] of [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]) {
          if (!ok(r + dr, c + dc)) continue;
          const to = (r + dr) * 8 + c + dc;
          if (!board[to] || colorOf(board[to]) !== turn) add(i, to);
        }
      } else if (t === "k") {
        for (const [dr, dc] of KDIR) {
          if (!ok(r + dr, c + dc)) continue;
          const to = (r + dr) * 8 + c + dc;
          if (!board[to] || colorOf(board[to]) !== turn) add(i, to);
        }
        // Castling: raja aur rook apni jagah, beech khaali, raja check mein na ho aur raaste se na guzre
        const opp = turn === "w" ? "b" : "w";
        const home = turn === "w" ? 60 : 4;
        if (i === home && !attacked(board, home, opp)) {
          const [K, Q, R] = turn === "w" ? ["K", "Q", "R"] : ["k", "q", "r"];
          if (s.castle[K] && board[home + 3] === R && !board[home + 1] && !board[home + 2] &&
              !attacked(board, home + 1, opp) && !attacked(board, home + 2, opp)) add(i, home + 2, { castle: "K" });
          if (s.castle[Q] && board[home - 4] === R && !board[home - 1] && !board[home - 2] && !board[home - 3] &&
              !attacked(board, home - 1, opp) && !attacked(board, home - 2, opp)) add(i, home - 2, { castle: "Q" });
        }
      } else {
        const dirs = t === "b" ? BISH : t === "r" ? ROOK : KDIR;
        for (const [dr, dc] of dirs) {
          let rr = r + dr, cc = c + dc;
          while (ok(rr, cc)) {
            const to = rr * 8 + cc;
            if (board[to]) { if (colorOf(board[to]) !== turn) add(i, to); break; }
            add(i, to);
            rr += dr; cc += dc;
          }
        }
      }
    }
    return moves;
  }

  function make(s, m) {
    const n = clone(s);
    const b = n.board;
    b[m.to] = m.promo || m.piece;
    b[m.from] = null;
    if (m.epCapture) b[m.to + (s.turn === "w" ? 8 : -8)] = null;
    if (m.castle) {
      const home = s.turn === "w" ? 60 : 4;
      if (m.castle === "K") { b[home + 1] = b[home + 3]; b[home + 3] = null; }
      else { b[home - 1] = b[home - 4]; b[home - 4] = null; }
    }
    n.ep = m.double ? (m.from + m.to) / 2 : -1;
    // Raja ya rook hile / rook kata = us taraf ka castling khatam
    const lose = (sq) => {
      if (sq === 60) { n.castle.K = n.castle.Q = false; }
      if (sq === 4) { n.castle.k = n.castle.q = false; }
      if (sq === 63) n.castle.K = false;
      if (sq === 56) n.castle.Q = false;
      if (sq === 7) n.castle.k = false;
      if (sq === 0) n.castle.q = false;
    };
    lose(m.from); lose(m.to);
    n.turn = s.turn === "w" ? "b" : "w";
    return n;
  }

  function legalMoves(s) {
    return pseudo(s).filter((m) => !inCheck(make(s, m), s.turn));
  }

  function status(s) {
    const moves = legalMoves(s);
    if (moves.length) {
      // Sirf raja bache = draw
      const left = s.board.filter(Boolean);
      if (left.length === 2) return "draw";
      if (left.length === 3 && left.some((p) => /[nNbB]/.test(p))) return "draw";
      return inCheck(s) ? "check" : "play";
    }
    return inCheck(s) ? "mate" : "stalemate";
  }

  // ---------- Computer ----------
  const VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
  // Piece-square tables (White ki nazar se, index 0 = a8)
  const PST = {
    p: [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
    n: [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
    b: [-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
    r: [0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
    q: [-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
    k: [-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20],
  };
  function evaluate(s) {
    let score = 0;
    for (let i = 0; i < 64; i++) {
      const p = s.board[i];
      if (!p) continue;
      const t = p.toLowerCase();
      const v = VAL[t] + PST[t][isW(p) ? i : (7 - (i >> 3)) * 8 + (i & 7)];
      score += isW(p) ? v : -v;
    }
    return s.turn === "w" ? score : -score;
  }
  const order = (moves) => moves.sort((a, b) => (b.captured ? VAL[b.captured.toLowerCase()] * 10 - VAL[b.piece.toLowerCase()] : 0) + (b.promo ? 800 : 0)
    - ((a.captured ? VAL[a.captured.toLowerCase()] * 10 - VAL[a.piece.toLowerCase()] : 0) + (a.promo ? 800 : 0)));

  function quiesce(s, alpha, beta, depth) {
    const stand = evaluate(s);
    if (stand >= beta) return beta;
    if (alpha < stand) alpha = stand;
    if (depth <= 0) return alpha;
    for (const m of order(legalMoves(s).filter((m) => m.captured))) {
      const sc = -quiesce(make(s, m), -beta, -alpha, depth - 1);
      if (sc >= beta) return beta;
      if (sc > alpha) alpha = sc;
    }
    return alpha;
  }

  function negamax(s, depth, alpha, beta, ply) {
    const moves = legalMoves(s);
    if (!moves.length) return inCheck(s) ? -100000 + ply : 0;
    if (depth === 0) return quiesce(s, alpha, beta, 3);
    for (const m of order(moves)) {
      const sc = -negamax(make(s, m), depth - 1, -beta, -alpha, ply + 1);
      if (sc >= beta) return beta;
      if (sc > alpha) alpha = sc;
    }
    return alpha;
  }

  // level: 1 = Easy (galtiyan karta hai), 2 = Medium, 3 = Hard
  function bestMove(s, level) {
    const moves = order(legalMoves(s));
    if (!moves.length) return null;
    const depth = level >= 3 ? 3 : level === 2 ? 2 : 1;
    let best = [], bestSc = -Infinity;
    for (const m of moves) {
      let sc = -negamax(make(s, m), depth - 1, -Infinity, -bestSc + 1, 1);
      if (level === 1) sc += Math.random() * 180 - 90; // Easy: thoda random
      if (sc > bestSc) { bestSc = sc; best = [m]; }
      else if (sc === bestSc) best.push(m);
    }
    return best[Math.floor(Math.random() * best.length)];
  }

  function perft(s, d) {
    if (d === 0) return 1;
    let n = 0;
    for (const m of legalMoves(s)) n += perft(make(s, m), d - 1);
    return n;
  }

  const api = { START, fromFEN, legalMoves, make, status, inCheck, bestMove, perft, colorOf };
  if (typeof module !== "undefined") module.exports = api;
  else root.ChessEngine = api;
})(this);
