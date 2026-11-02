// Website ki files (index, css, js, games, icons) app/www mein copy karta hai
const fs = require("fs");
const path = require("path");
const SRC = path.join(__dirname, "..", "..");
const OUT = path.join(__dirname, "..", "www");
const ITEMS = ["index.html", "css", "js", "games", "icons"];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
let count = 0;
function copy(src, dst) {
  if (fs.statSync(src).isDirectory()) {
    fs.mkdirSync(dst, { recursive: true });
    for (const f of fs.readdirSync(src)) copy(path.join(src, f), path.join(dst, f));
  } else {
    fs.copyFileSync(src, dst);
    count++;
  }
}
for (const it of ITEMS) copy(path.join(SRC, it), path.join(OUT, it));
console.log(`www ready: ${count} files`);
