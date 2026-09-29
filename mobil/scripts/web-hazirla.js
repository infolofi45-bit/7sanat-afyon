/* ../public/index.html dosyasını uygulama için www/ klasörüne hazırlar:
   - Tailwind CDN yerine derlenmiş, telefona gömülü CSS kullanılır (hızlı açılır)
   - Panel kodu webdeki ile birebir aynıdır; tek kaynak public/index.html */
const fs = require("fs"), path = require("path"), { execSync } = require("child_process");
const kok = path.join(__dirname, "..");
const kaynak = path.join(kok, "..", "public", "index.html");
const www = path.join(kok, "www");
fs.mkdirSync(www, { recursive: true });

let html = fs.readFileSync(kaynak, "utf8");
const cdn = /<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>\s*<script>\s*tailwind\.config[\s\S]*?<\/script>/;
if (!cdn.test(html)) throw new Error("index.html içinde Tailwind CDN bloğu bulunamadı.");
html = html.replace(cdn, '<link rel="stylesheet" href="tailwind.css" />');
fs.writeFileSync(path.join(www, "index.html"), html);

const girdi = path.join(kok, "scripts", "tailwind-girdi.css");
fs.writeFileSync(girdi, "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n");
execSync(`npx tailwindcss -c tailwind.config.js -i "${girdi}" -o www/tailwind.css --minify`, { cwd: kok, stdio: "inherit" });
console.log("✓ www/ hazır (" + Math.round(fs.statSync(path.join(www, "tailwind.css")).size / 1024) + " KB CSS)");
