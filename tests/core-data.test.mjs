import {readFile} from "node:fs/promises";
import {test} from "node:test";
import assert from "node:assert/strict";

for (const name of ["Actor", "Item", "JournalEntryPage", "PlaylistSound", "Scene", "AmbientSoundDocument", "TileDocument", "TokenDocument", "User"]) {
    globalThis[name] = class {};
    Object.defineProperty(globalThis[name], "name", {value: name});
}
globalThis.foundry = {data: {PrototypeToken: class {}}};
globalThis.navigator ??= {};
const source = await readFile(new URL("../src/scripts/asset-aggregation.js", import.meta.url), "utf8");
const aggregation = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
let listings;
globalThis.FilePicker = {async browse(storage, path, options = {}) {
    const key = `${storage}:${path}:${Boolean(options.wildcard)}`;
    if (!listings.has(key)) throw new Error("Directory unavailable");
    return {files: listings.get(key)};
}};
function setup(path, entries) {
    listings = new Map(entries);
    const sound = Object.assign(new PlaylistSound(), {_id: "sound", name: "Dice", path});
    const collections = new Map(["Actor", "JournalEntry", "Playlist", "Scene", "User"].map(name => [name, []]));
    collections.get("Playlist").push({sounds: [sound]});
    globalThis.game = {collections};
}
async function scan() {
    const groups = await aggregation.getAllAssets(false, "", "PlaylistSound");
    return groups[0].assets[0];
}
test("Core Data sound is valid when User Data browsing fails", async () => {
    setup("sounds/dice.wav", [["public:sounds:false", ["sounds/dice.wav"]]]);
    assert.equal((await scan()).isValid, true);
});
test("User Data sound remains valid when Core Data browsing fails", async () => {
    setup("sounds/custom.wav", [["data:sounds:false", ["sounds/custom.wav"]]]);
    assert.equal((await scan()).isValid, true);
});
test("missing sound stays invalid and reports its Core Data parent", async () => {
    setup("sounds/missing.wav", [["public:sounds:false", ["sounds/dice.wav"]]]);
    const result = await scan();
    assert.equal(result.isValid, false);
    assert.equal(result.lastValidPath, "sounds");
});
test("wildcards resolve in Core Data and stay invalid without matches", async () => {
    setup("sounds/*.wav", [["public:sounds/*.wav:true", ["sounds/dice.wav"]]]);
    assert.equal((await scan()).isValid, true);
    listings.clear();
    assert.equal((await scan()).isValid, false);
});
