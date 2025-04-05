import fs from 'fs';
import path from 'path';
import mime from 'mime';
import { fileURLToPath } from 'url';

// Support for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === Settings ===
const DIST_JS_PATH = path.join(__dirname, 'dist', 'bundle.js');
const ASSETS_DIR = path.join(__dirname, 'assets');
const OUTPUT_HTML_PATH = path.join(__dirname, 'single', 'index.html');

function base64Encode(filePath) {
  const mimeType = mime.getType(filePath);
  const base64 = fs.readFileSync(filePath).toString("base64");
  return `data:${mimeType};base64,${base64}`;
}

function getAllAssets(dir) {
  const assets = {};
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isFile()) {
      assets[file] = base64Encode(fullPath);
    }
  }
  return assets;
}

function patchJS(jsCode, assets) {
  for (const [filename, dataUri] of Object.entries(assets)) {
    const assetPath = `/assets/${filename}`;
    const reg = new RegExp(`['"\`]${assetPath}['"\`]`, "g");
    jsCode = jsCode.replace(reg, `"${dataUri}"`);
  }

  // Patch GLTFLoader.load → parse
  jsCode = jsCode.replace(/loader\.load\(([^,]+),\s*([^)]+)\)/g, (match, url, callback) => {
    return `fetch(${url}).then(r => r.arrayBuffer()).then(b => loader.parse(b, "", ${callback}))`;
  });

  // Patch AudioLoader.load → parse
  jsCode = jsCode.replace(/audioLoader\.load\(([^,]+),\s*([^)]+)\)/g, (match, url, callback) => {
    return `fetch(${url}).then(r => r.arrayBuffer()).then(b => audioLoader.parse(b, ${callback}))`;
  });

  return jsCode;
}

function buildHTML(inlinedJS) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no" />
  <style>
    html, body { margin:0; padding:0; overflow:hidden; width:100%; height:100%; background:#000; }
    canvas { display:block; width:100%; height:100%; }
  </style>
</head>
<body>
<script>
  (function(){
    if (window.mraid) {
      if (mraid.getState() === 'loading') {
        mraid.addEventListener('ready', initPlayable);
      } else {
        initPlayable();
      }
    } else {
      initPlayable();
    }
    function initPlayable() {
      ${inlinedJS}
    }
  })();
</script>
</body>
</html>`;
}

function main() {
  if (!fs.existsSync(DIST_JS_PATH)) {
    console.error(`❌ File not found: ${DIST_JS_PATH}`);
    return;
  }

  const originalJS = fs.readFileSync(DIST_JS_PATH, "utf-8");
  const assets = getAllAssets(ASSETS_DIR);
  const patchedJS = patchJS(originalJS, assets);
  const finalHTML = buildHTML(patchedJS);

  fs.mkdirSync(path.dirname(OUTPUT_HTML_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_HTML_PATH, finalHTML);
  console.log(`✅ Done! Final file: ${OUTPUT_HTML_PATH}`);
}

main();
