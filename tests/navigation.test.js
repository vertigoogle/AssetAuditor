import {test, beforeEach} from "node:test";
import assert from "node:assert/strict";
import {reset, actor, env} from "./helpers/foundry.js";
const {openAssetOriginal} = await import("../src/apps/asset-original.js");
const {buildPathGroups} = await import("../src/apps/asset-groups.js");
beforeEach(reset);
test("prototype editor resolves the actor and PlaylistSound uses its v14 config", async () => {
    const subject = actor();
    await openAssetOriginal(subject.prototypeToken);
    assert.equal(env.opened[0].options.actor, subject);
    const sound = new PlaylistSound({_id: "sound", name: "Dice", path: "sounds/dice.wav"});
    await openAssetOriginal(sound);
    assert.equal(env.opened[1].type, "PlaylistSoundConfig");
    assert.equal(env.opened[1].options.document, sound);
});
test("journal navigation targets the page and placeable navigation never changes scenes", async () => {
    let pageId;
    const parent = {sheet: {render: async (force, options) => { pageId = options.pageId; }}};
    await openAssetOriginal(new JournalEntryPage({_id: "page"}, parent));
    assert.equal(pageId, "page");
    let opened = false;
    const scene = {activate() { throw Error("must not activate"); }, view() { throw Error("must not view"); }};
    const token = new TokenDocument({_id: "token", sheet: {render: async () => { opened = true; }}}, scene);
    await openAssetOriginal(token);
    assert.equal(opened, true);
    await assert.rejects(openAssetOriginal(null));
});
test("grouping keeps individual scene references and separates document types", () => {
    const entries = ["Camp", "Road"].map(name => ({path: "tokens/scout.webp", asset: {parent: {documentName: "Scene", name}}}));
    const groups = [{type: "TokenDocument", assets: entries}, {type: "Actor", assets: [{path: entries[0].path, asset: {}}]}];
    buildPathGroups(groups, key => game.i18n.localize(key));
    assert.equal(groups[0].pathGroups[0].count, 2);
    assert.equal(groups[0].pathGroups[0].isMultiple, true);
    assert.equal(groups[1].pathGroups[0].count, 1);
    assert.equal(entries[0].contextLabel, "Scene: Camp");
    assert.equal(entries[1].contextLabel, "Scene: Road");
});
