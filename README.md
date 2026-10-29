# Asset Auditor

## Development fork

This is [vertigoogle's development fork](https://github.com/vertigoogle/AssetAuditor)
of [Asset Auditor by The Comamba](https://github.com/TheComamba/AssetAuditor).
The original module finds broken asset references in Foundry Virtual Tabletop.
This fork prepares improvements to path validation, repair workflows and the audit
window for Foundry v14.

**Development status:** the improvements below are on
[`improve-asset-auditing-v14`](https://github.com/vertigoogle/AssetAuditor/tree/improve-asset-auditing-v14),
with [draft pull request #1](https://github.com/vertigoogle/AssetAuditor/pull/1)
tracking the contribution. The default `main` branch still contains the original
module code; this README is the fork's development overview. There is no fork
release yet, and no pull request has been submitted upstream.

### Improvements in the draft

- Resizable ApplicationV2 window, fixed tools and separately scrolling results.
- Visible scan stages, progress counters and explicit completion or failure states.
- Validation against both User Data and Core Data, including wildcard match counts.
- Grouped file usages with scene/parent labels and navigation to the original object.
- Automatic saving after file selection, fresh validation and removal of repaired
  entries from the invalid-only result without losing unrelated draft edits.
- Parent-qualified embedded-document identities and actor-owned prototype writes.
- Stale-picker protection, deferred rescans during writes and explicit error recovery.
- English and German localization, 22 automated tests and GitHub Actions checks.

The automated checks pass. **Native Foundry UI and interoperability validation are
still pending**, so this remains a draft rather than a production release. See the
[testing guide and manual checklist](https://github.com/vertigoogle/AssetAuditor/blob/improve-asset-auditing-v14/docs/testing.md).
Tokenizer is optional; this fork does not introduce a Tokenizer dependency or claim
to audit its editing layers, caches or dynamic-ring subject fields.

## Usage

Enable the module and open **Asset Filepaths** from the Settings sidebar. The audit
window uses Foundry's ApplicationV2 frame, with a resizable layout, fixed tools and
a separately scrolling result list.

The window opens before scanning starts. Progress reports directory listing, asset
checking and locating valid parent directories as separate stages. Completion is
explicit, including zero-result scans. Use **Recheck** to run the scan again.

### Results and navigation

Entries are organized by document type and exact file path. Repeated paths are
collapsed into groups of usages; expand one to edit an individual reference. Scene,
actor, playlist and journal labels distinguish otherwise identical names. The
**Open original** button opens the related document or configuration. Navigating
to a placed token does not switch or activate its scene.

Missing paths show a warning icon and the last valid parent directory. Enable
**Show only invalid filepaths** to focus on unresolved references. User Data and
Core Data are both checked. Wildcard patterns show their number of distinct matching
file URLs; a pattern with no matches is invalid.

### Repairing paths

Choosing a file in the browser **saves immediately**. Typing a path manually enables
**Save** and **Reset** for that row. A successful save is followed by a fresh check;
valid entries leave the invalid-only list and their usage count updates.

For wildcard token paths, selecting a single file replaces the pattern. A warning
explains this before the picker opens. To preserve random image selection, edit the
folder or pattern manually. Auditing itself does not change the random-image flag.

Use **Search** to filter by document name, path or parent name. Search runs when
its button or Enter is pressed. **Replace all** operates on the current result set;
back up your world before making bulk changes. An empty search does not perform a
replacement. A stopped replacement may have already saved earlier entries; recheck
before retrying.

The existing setting to audit on world startup remains available. External URLs
retain a best-effort reachability check; cross-origin restrictions prevent this
from proving that an individual remote file exists.

See [Testing](https://github.com/vertigoogle/AssetAuditor/blob/improve-asset-auditing-v14/docs/testing.md) for automated checks, the pending in-Foundry checklist
and the exact scope of the supported paths.

## Contributing

For feedback on these changes, use the
[draft pull request](https://github.com/vertigoogle/AssetAuditor/pull/1).
The upstream project is [TheComamba/AssetAuditor](https://github.com/TheComamba/AssetAuditor);
its author and MIT license are retained. An upstream submission can follow after
review and the pending in-Foundry validation.

To run the development checks, use Node.js 24.15 or newer:

```sh
npm ci --ignore-scripts
npm test
npm run check
```

To add a language, create `src/lang/<language-code>.json` and register it in
`src/module.json`. Keep localization keys and placeholders consistent with the
English source. The upstream `foundry_scripts/check_localizations_consistency.sh`
check is also run by CI.

## Trying the development version

Use a disposable Foundry world and back up your data first.

1. Check out the
   [`improve-asset-auditing-v14` branch](https://github.com/vertigoogle/AssetAuditor/tree/improve-asset-auditing-v14).
2. Copy **the contents of `src/`** into
   `<Foundry User Data>/Data/modules/asset-auditor/`.
3. Restart Foundry to reload the module manifest, enable Asset Auditor in the test
   world, and reload the browser.
4. Follow the
   [manual test checklist](https://github.com/vertigoogle/AssetAuditor/blob/improve-asset-auditing-v14/docs/testing.md).

`node_modules/`, tests and other development files do not belong in the installed
module folder. The manifest version and upstream manifest/download URLs are
intentionally unchanged for maintainer-controlled release management. **Do not
use those URLs expecting to install this fork's draft**, and be aware that an
ordinary module update can replace a manually installed development copy.

## License

This software is distributed under the [MIT](https://choosealicense.com/licenses/mit/) license. In a nutshell this means that all code is made public, and you are free to use it without any charge.
