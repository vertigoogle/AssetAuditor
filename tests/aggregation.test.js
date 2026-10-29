import {test, beforeEach} from "node:test";
import assert from "node:assert/strict";
import {reset, listing, actor, env} from "./helpers/foundry.js";
const {getAllAssets, checkAssetPath, setAssetPath} = await import("../src/scripts/asset-aggregation.js");
beforeEach(reset);

test("Core Data is accepted when the User Data directory is unavailable", async () => {
    listing("public", "sounds", ["sounds/dice.wav"]);
    assert.equal(await checkAssetPath("sounds/dice.wav?v=1"), true);
    assert.equal(await checkAssetPath("sounds/missing.wav"), false);
});
test("both storage sources are merged without treating the browser OS as the server OS", async () => {
    listing("data", "images", ["images/User.webp"]);
    listing("public", "images", ["images/Core.webp"]);
    assert.equal(await checkAssetPath("images/User.webp"), true);
    assert.equal(await checkAssetPath("images/Core.webp"), true);
    assert.equal(await checkAssetPath("images/user.webp"), false);
});
test("URL-encoded filenames match the same local filename", async () => {
    listing("data", "images", ["images/Scout's Portrait.webp"]);
    assert.equal(await checkAssetPath("images/Scout%27s%20Portrait.webp"), true);
});
test("wildcard counts deduplicate URLs from both sources and retain the pattern", async () => {
    const subject = actor("scout", "tokens/*.webp?v=2");
    subject.prototypeToken.randomImg = true;
    Object.seal(subject.prototypeToken);
    listing("data", "tokens/*.webp", ["tokens/a.webp", "tokens/b.webp"], true);
    listing("public", "tokens/*.webp", ["tokens/a.webp"], true);
    const all = await getAllAssets(false, "", "PrototypeToken");
    assert.equal(all[0].assets[0].wildcardCount, 2);
    assert.equal(all[0].assets[0].isValid, true);
    assert.equal(subject.prototypeToken.texture.src, "tokens/*.webp?v=2");
    assert.equal(subject.prototypeToken.randomImg, true);
    assert.equal(Object.hasOwn(subject.prototypeToken, "_id"), false);
    assert.equal(env.updates.length, 0);
});
test("zero wildcard matches remain visible in invalid-only results", async () => {
    actor("scout", "tokens/*.webp");
    const all = await getAllAssets(true, "", "PrototypeToken");
    assert.equal(all[0].assets[0].wildcardCount, 0);
    assert.equal(all[0].assets[0].isValid, false);
});
test("reused token IDs in different scenes are preserved", async () => {
    const scenes = [new Scene({_id: "one", name: "Camp", tiles: [], sounds: [], tokens: []}), new Scene({_id: "two", name: "Road", tiles: [], sounds: [], tokens: []})];
    for (const scene of scenes) scene.tokens.push(new TokenDocument({_id: "same", name: "Scout", texture: {src: "missing.webp"}}, scene));
    game.collections.set("Scene", scenes);
    const all = await getAllAssets(true, "", "TokenDocument");
    assert.equal(all[0].assets.length, 2);
    assert.notEqual(all[0].assets[0].id, all[0].assets[1].id);
    const filtered = await getAllAssets(true, "Road", "TokenDocument");
    assert.equal(filtered[0].assets.length, 1);
});
test("prototype writes go through their owning actor and preserve random-image settings", async () => {
    const subject = actor();
    subject.prototypeToken.randomImg = true;
    const result = await setAssetPath(subject.prototypeToken, "tokens/new-*.webp");
    assert.equal(result, subject.prototypeToken);
    assert.deepEqual(env.updates[0].patch, {"prototypeToken.texture.src": "tokens/new-*.webp"});
    assert.equal(subject.prototypeToken.randomImg, true);
});
test("progress is monotonic within each stage and completes even with no results", async () => {
    actor();
    listing("data", "images", ["images/old.webp"]);
    const progress = [];
    const result = await getAllAssets(true, "", "Actor", step => progress.push(step));
    assert.equal(result[0].assets.length, 0);
    for (const phase of ["directories", "documents", "hints"]) {
        const steps = progress.filter(step => step.phase === phase);
        assert.equal(steps[0].completed, 0);
        assert.equal(steps.at(-1).completed, steps.at(-1).total);
        steps.forEach((step, index) => { if (index) assert(step.completed >= steps[index - 1].completed); });
    }
});
