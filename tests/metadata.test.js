import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";
const json = path => JSON.parse(readFileSync(new URL(path, import.meta.url)));
test("English and German keys and interpolation placeholders agree", () => {
    const en = json("../src/lang/en.json"), de = json("../src/lang/de.json");
    assert.deepEqual(Object.keys(en).sort(), Object.keys(de).sort());
    for (const key of Object.keys(en)) assert.deepEqual(en[key].match(/\{\w+\}/g), de[key].match(/\{\w+\}/g), key);
});
test("manifest references available files and leaves release version consistent", () => {
    const manifest = json("../src/module.json"), pkg = json("../package.json"), lock = json("../package-lock.json");
    assert.equal(manifest.version, pkg.version);assert.equal(pkg.version, lock.version);
    for (const path of [...manifest.esmodules, ...manifest.styles, ...manifest.languages.map(lang => lang.path)]) assert(existsSync(new URL("../src/" + path, import.meta.url)), path);
});
