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
ApplicationV2 rendering lifecycle are stubbed. The manual checks below cover native Foundry rendering, audio playback, module
interoperability and runtime performance.

Fixtures use synthetic documents and paths, making the suite reproducible across
development environments.

## In-Foundry verification

Use a disposable Foundry world and back it up first. The ApplicationV2 window targets Foundry 14 and declares Foundry 13 as its minimum.
Record the Foundry generation used for each verification run.

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

## Validation scope

- Progress reports completed work within each named scan stage.
- Relative paths are checked against User Data and Core Data.
- External URLs use a best-effort network check cached by origin.
- The audited fields are defined in `src/scripts/asset-aggregation.js`.
- Prototype-token validation uses the token texture path and preserves the
  associated random-image setting.
- Release metadata is maintained in `package.json` and `src/module.json`.
