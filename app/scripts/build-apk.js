// Ek command mein poora APK:  (app folder mein)  node scripts/build-apk.js   ya   npm run apk
// 1) Firebase bundle  2) website files copy  3) Capacitor sync  4) Gradle release build  5) download/GameZone.apk
// npm/npx ke bina seedhe Node se chalta hai (Windows par npm kabhi-kabhi atak jaata hai)
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const APP = path.join(__dirname, "..");
const NODE = `"${process.execPath}"`;
const run = (cmd, cwd = APP) => {
  console.log("\n> " + cmd);
  execSync(cmd, { cwd, stdio: "inherit" });
};

console.log("\n> firebase bundle");
require("esbuild").buildSync({
  entryPoints: [path.join(APP, "src", "firebase-entry.js")],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2019",
  legalComments: "none",
  outfile: path.join(APP, "..", "js", "vendor", "firebase.js"),
});
run(`${NODE} scripts/copy-web.js`);
run(`${NODE} node_modules/@capacitor/cli/bin/capacitor sync android`);
// Poora path do: kuch Windows setups current folder ke .bat ko naam se nahi dhoondhte
const gradle = process.platform === "win32" ? ".\\gradlew.bat" : "./gradlew";
run(`${gradle} assembleRelease`, path.join(APP, "android"));

const apk = path.join(APP, "android", "app", "build", "outputs", "apk", "release", "app-release.apk");
const outDir = path.join(APP, "..", "download");
fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(apk, path.join(outDir, "GameZone.apk"));
const mb = (fs.statSync(apk).size / 1048576).toFixed(1);
console.log(`\nAPK ready: download/GameZone.apk (${mb} MB)`);

// version.json: purani app isse padh ke "Naya update aaya" dikhati hai (GitHub par push hone ke baad)
const gradleFile = fs.readFileSync(path.join(APP, "android", "app", "build.gradle"), "utf8");
const versionCode = +gradleFile.match(/versionCode (\d+)/)[1];
const versionName = gradleFile.match(/versionName "([^"]+)"/)[1];
const notes = JSON.parse(fs.readFileSync(path.join(APP, "release-notes.json"), "utf8")).notes;
const info = {
  versionCode,
  versionName,
  notes,
  apk: "https://raw.githubusercontent.com/Shubhamgoyal183/Game/main/download/GameZone.apk",
  date: new Date().toISOString().slice(0, 10),
};
fs.writeFileSync(path.join(APP, "..", "version.json"), JSON.stringify(info, null, 2) + "\n");
console.log(`version.json ready: ${versionName} (code ${versionCode}) — GitHub par push karo taaki purani app ko update dikhe`);
