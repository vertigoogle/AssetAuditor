# Testing the audit window changes

## Automated checks

Use Node.js 24.15 or newer. The development dependencies are test-only and are not
included in Foundry's `src/` module payload.

```sh
npm ci --ignore-scripts
npm test
npm run check
```

The suite imports the real ES modules, compiles the real Handlebars template and
exercises its DOM handlers in jsdom. Foundry's document APIs, file storage and
ApplicationV2 rendering lifecycle are stubbed. These tests do **not** establish
native Foundry rendering, audio playback, module interoperability or performance.

Fixtures use synthetic documents and paths. No world exports, player data, local
installation paths or credentials are needed.

## Manual verification before marking the draft ready

Use a disposable Foundry world and back it up first. This branch has been prepared
for Foundry 14; the declared minimum remains 13 because ApplicationV2 is available
there, but runtime validation on both generations is still pending. Do not raise
the manifest's verified version based solely on these tests.

- [ ] Open Asset Filepaths. Verify the native ApplicationV2 frame, resize behavior,
  light/dark theme, keyboard navigation and the independently scrolling results.
- [ ] Observe an immediate loading shell, progress for each named stage and an
  explicit completion message, including when the result is empty.
- [ ] Close the window during a slow scan. It must not reopen itself.
- [ ] Select `sounds/dice.wav` from Core Data. It must not be marked missing merely
  because the User Data `sounds` directory is absent.
- [ ] Select a new file for an invalid Actor and PlaylistSound. Selection must
  autosave; a valid entry must leave the invalid-only result without refreshing
  unrelated draft fields.
- [ ] Type a path manually: no write until Save. Reset must affect only that row.
- [ ] Repair a PrototypeToken path and confirm its actor owns the write, while
  `randomImg` and dynamic-ring configuration stay unchanged.
- [ ] Check wildcard paths with zero, one and several matches. Confirm the count,
  the single-file replacement warning and that checking never rewrites a pattern.
- [ ] Place copies of the same actor on two scenes. Confirm grouping by exact path,
  scene labels, group counts and navigation to the correct individual token.
- [ ] Open a JournalEntryPage, an embedded Item and a PlaylistSound from the audit.
  Placeable navigation must not activate or view another scene.
- [ ] Open a picker, then change filters before making a selection. Its stale
  callback must not save into a different row.
- [ ] Request Recheck during a delayed write; the scan must wait for that write.
- [ ] Exercise a rejected write and an unavailable index. Verify visible failure
  states, retained entries and an available retry path.
- [ ] Search by name, path and parent scene; verify replacement affects only the
  displayed result set. Restore the test-world backup afterwards.

## Scope and limitations

- Progress is stage-local work completed, not a time estimate or overall percentage.
- Relative paths are checked against User Data and Core Data. Dedicated S3 and
  hosting-provider storage integrations are not added by this change.
- External URLs retain the existing best-effort network check. An opaque response
  cannot establish that the exact remote asset exists.
- The existing supported document fields are scanned. Arbitrary module flags,
  Tokenizer editing layers and dynamic-ring subject fields are not newly audited.
- Tokenizer remains optional; no module-specific API dependency is introduced.
- The original release version, author, license and upstream manifest/download URLs
  are intentionally retained for maintainer-controlled release management.
