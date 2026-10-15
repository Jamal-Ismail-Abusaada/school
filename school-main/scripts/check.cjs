const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, 'Duplicate IDs');
assert.match(html, /<html lang="ar" dir="rtl">/);
const stack = [];
const voidTags = new Set(['meta', 'link', 'img', 'br', 'input', 'hr', 'area', 'base', 'embed', 'source', 'wbr']);
for (const match of html.matchAll(/<(\/?)([a-z][\w-]*)\b([^>]*)>/gi)) {
  const [, closing, tag, attributes] = match;
  if (voidTags.has(tag) || /\/\s*$/.test(attributes)) continue;
  if (closing) assert.equal(stack.pop(), tag, `Incorrect closing tag: ${tag}`);
  else stack.push(tag);
}
assert.equal(stack.length, 0, 'Unclosed tags');
let assets = 0;
function checkAsset(reference, directory) {
  if (/^(?:https?:|mailto:|tel:|data:)/.test(reference)) return;
  if (reference.startsWith('#')) {
    assert.ok(ids.includes(reference.slice(1)), `Missing anchor: ${reference}`);
    return;
  }
  assert.ok(fs.existsSync(path.resolve(directory, reference)), `Missing asset: ${reference}`);
  assets++;
}
for (const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) checkAsset(match[1], root);
for (const name of fs.readdirSync(path.join(root, 'css'))) {
  if (!name.endsWith('.css')) continue;
  const css = fs.readFileSync(path.join(root, 'css', name), 'utf8');
  for (const match of css.matchAll(/url\(["']?([^)'"\s]+(?: [^)'"\s]+)*)["']?\)/g)) {
    checkAsset(match[1], path.join(root, 'css'));
  }
  assert.ok(!/\d+xp\b/.test(css), `Invalid CSS unit in ${name}`);
}
assert.ok(!html.includes('document.body.style.zoom'));
assert.ok(!/<button[^>]*href=/.test(html));
console.log(`PASS: HTML nesting, Arabic direction, ${ids.length} unique IDs, anchors and ${assets} local asset references.`);
