import {test, beforeEach} from "node:test";
import assert from "node:assert/strict";
import {reset, actor, listing, env, waitFor} from "./helpers/foundry.js";
const {AssetFilepaths} = await import("../src/apps/asset-filepaths.js");
beforeEach(reset);

async function openAudit({invalidOnly = true} = {}) {
    const app = new AssetFilepaths();
    app.showInvalidOnly = invalidOnly;
    app.singularType = "Actor";
    await app.render();
    await waitFor(() => app._scanState.phase === "complete" && app.element.querySelector('.asset-scan-status')?.dataset.state === 'complete');
    return app;
}

test("the real template renders a shell before a delayed directory scan and then a completed state", async () => {
    actor();
    let release;
    env.listings.set("data|images|directory", () => new Promise(resolve => { release = resolve; }));
    const app = new AssetFilepaths();app.singularType = "Actor";
    await app.render();
    assert(app.element.querySelector('progress'));
    assert.equal(app._scanBusy, true);
    await waitFor(() => release);
    assert.equal(app.element.querySelector('.recheck-assets-button').disabled, true);
    listing("data", "images", []);
    release({files: []});
    await waitFor(() => app._scanState.phase === "complete" && app.element.querySelector('progress').hidden);
    assert.match(app.element.querySelector('.asset-scan-message').textContent, /Scan complete/);
    assert.equal(app.element.querySelector('.recheck-assets-button').disabled, false);
});
test("file picker selection autosaves and removes only the repaired invalid row", async () => {
    const subject = actor("scout");
    actor("other");
    listing("data", "images", ["images/fixed.webp"]);
    const app = await openAudit();
    const rows = [...app.element.querySelectorAll('.asset-row')];
    assert.equal(rows.length, 2);
    const row = rows.find(row => row.querySelector('.asset-identity').textContent.includes('scout'));
    const unrelated = rows.find(candidate => candidate !== row);
    unrelated.querySelector('.path-input').value = 'unsaved.webp';
    row.querySelector('.browse-button').click();
    assert.equal(env.pickers.length, 1);
    assert.equal(row.isConnected, true, "opening picker must not replace the row");
    await env.pickers[0].options.callback("images/fixed.webp");
    assert.equal(subject.img, "images/fixed.webp");
    assert.equal(row.isConnected, false);
    assert.equal(unrelated.querySelector('.path-input').value, 'unsaved.webp');
    assert.equal(app.element.querySelectorAll('.asset-row').length, 1);
    assert.equal(env.updates.length, 1);
});
test("manual input needs Save; Reset preserves other draft rows", async () => {
    const subject = actor("scout");actor("other");
    const app = await openAudit();
    const rows = [...app.element.querySelectorAll('.asset-row')];
    const row = rows.find(row => row.querySelector('.asset-identity').textContent.includes('scout'));
    const unrelated = rows.find(candidate => candidate !== row);
    unrelated.querySelector('.path-input').value = 'other-draft.webp';
    const input = row.querySelector('.path-input');
    input.value = 'images/new.webp';input.dispatchEvent(new window.Event('input'));
    assert.equal(env.updates.length, 0);
    assert.equal(row.querySelector('.update-button').disabled, false);
    row.querySelector('.reset-button').click();
    assert.equal(input.value, subject.img);
    assert.equal(unrelated.querySelector('.path-input').value, 'other-draft.webp');
});
test("an open picker cannot save a detached row after a new scan", async () => {
    const subject = actor();
    const app = await openAudit();
    app.element.querySelector('.browse-button').click();
    const picker = env.pickers[0];
    await app.refresh();
    await waitFor(() => !app._scanBusy && app._scanState.phase === 'complete');
    await picker.options.callback('images/new.webp');
    assert.equal(subject.img, 'images/old.webp');
    assert.equal(env.updates.length, 0);
});
test("a scan requested during a save waits for the write", async () => {
    const subject = actor();listing("data", "images", ["images/fixed.webp"]);
    const app = await openAudit();
    const row = app.element.querySelector('.asset-row');
    const button = $(row.querySelector('.update-button'));
    row.querySelector('.path-input').value = 'images/fixed.webp';
    let release;
    const original = subject.update.bind(subject);
    subject.update = async patch => { await new Promise(resolve => { release = resolve; }); return original(patch); };
    const pending = app.saveAssetRow(button, $(app.element));
    await waitFor(() => release);
    await app.refresh();
    assert.equal(app._scanBusy, false);
    assert.equal(row.querySelector('.path-input').disabled, true);
    release();await pending;
    await waitFor(() => !app._scanBusy && app._scanState.phase === 'complete');
    assert.equal(subject.img, 'images/fixed.webp');
    assert.equal(app.element.querySelectorAll('.asset-row').length, 0);
});
test("names are escaped by the template and row keys address the correct duplicate-name actor", async () => {
    const first = actor('one');const second = actor('two');
    first.name = second.name = '<img src=x onerror=alert(1)>';
    const app = await openAudit();
    const entries = app.context.assets.flatMap(group => group.assets);
    assert.equal(entries.length, 2);
    assert.equal(app.findAsset(entries[1].openKey).asset, second);
    assert.equal(app.element.querySelector('.asset-identity img'), null);
    assert.match(app.element.querySelector('.asset-identity').textContent, /<img/);
});

test("empty replacement never writes; replacement is restricted to the current result set", async () => {
    const subject = actor('scout');const hidden = actor('hidden');
    const app = await openAudit();
    app.context.assets.forEach(group => { group.assets = group.assets.filter(entry => entry.asset === subject); });
    app.currentSearchInput = '';
    await app.performReplacement($(app.element));
    assert.equal(env.updates.length, 0);
    app.currentSearchInput = 'images/';app.replaceText = 'portraits/';
    await app.performReplacement($(app.element));
    await waitFor(() => !app._scanBusy);
    assert.equal(subject.img, 'portraits/old.webp');
    assert.equal(hidden.img, 'images/old.webp');
});
test("a failed scan retains previous results and reports failure", async t => {
    actor();const app = await openAudit();
    const previous = app._assets;
    t.mock.method(console, 'error', () => {});
    t.mock.method(game.collections, 'get', () => { throw Error('Index unavailable'); });
    await app.scanAssets();
    assert.equal(app._scanState.phase, 'error');assert.equal(app._assets, previous);
    assert.match(app.element.querySelector('.asset-scan-message').textContent, /Scan failed/);
    assert.equal(app.element.querySelector('.recheck-assets-button').disabled, false);
});
test("failed saves keep a retryable row and never remove its invalid entry", async t => {
    const subject = actor();const app = await openAudit();
    subject.update = async () => { throw Error('Write rejected'); };
    t.mock.method(console, 'error', () => {});
    const row = app.element.querySelector('.asset-row');
    const input = row.querySelector('.path-input');input.value = 'images/fixed.webp';
    await app.saveAssetRow($(row.querySelector('.update-button')), $(app.element));
    assert.equal(row.isConnected, true);assert.equal(input.disabled, false);
    assert.equal(row.querySelector('.update-button').disabled, false);
    assert.equal(app._savingAssets.size, 0);assert.equal(env.notifications.at(-1).type, 'error');
});
