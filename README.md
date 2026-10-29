# Asset Auditor

Asset Auditor helps Foundry Virtual Tabletop GMs find and repair broken references
to images, maps and audio. It brings file validation, document navigation and path
editing into one overview, making asset reorganizations easier to review.

This is [vertigoogle's development fork](https://github.com/vertigoogle/AssetAuditor)
of [Asset Auditor by The Comamba](https://github.com/TheComamba/AssetAuditor).
The Foundry v14 improvements are available on
[`improve-asset-auditing-v14`](https://github.com/vertigoogle/AssetAuditor/tree/improve-asset-auditing-v14)
and are being reviewed in [draft pull request #1](https://github.com/vertigoogle/AssetAuditor/pull/1).

## Features

- **Clear audit overview:** a resizable ApplicationV2 window with fixed tools and
  a separately scrolling result list.
- **Visible scan progress:** stage counters show directory listing, reference
  checking and the preparation of repair hints, followed by a completion summary.
- **User Data and Core Data validation:** both storage sources contribute to file
  checks, including wildcard patterns and their matching-file counts.
- **Grouped usages:** references sharing a file path are grouped, with scene,
  actor, playlist and journal labels identifying each individual usage.
- **Direct navigation:** open the document or configuration associated with a
  reference to inspect it in its original context.
- **Immediate repair feedback:** file selection saves automatically, validates the
  stored path and updates the invalid-only results and group counts.
- **Reliable document targeting:** parent-qualified identities distinguish embedded
  documents, while prototype-token changes are saved through their owning Actor.
- **Coordinated editing:** picker callbacks, document writes and rescans share a
  controlled workflow with visible error recovery.
- **English and German localization**, backed by automated tests and GitHub Actions.

## Usage

Enable the module and open **Asset Filepaths** from the Settings sidebar. The
window displays progress while the audit runs, then shows its result summary.
Use **Recheck** to repeat the audit.

### Find the affected usage

Results are organized by document type and exact file path. Expand a group to see
its individual usages. Context labels distinguish similarly named objects across
scenes and other parent documents. **Open original** opens the associated editor.

Missing paths show a warning icon and the last valid parent directory. Enable
**Show only invalid filepaths** to focus on references requiring attention.
Wildcard entries show the number of distinct matching file URLs; zero matches
identify a pattern requiring repair.

### Repair a reference

Choosing a file in the browser **saves immediately**. For manual path edits, use
**Save** or **Reset** on the affected row. Each successful save triggers a fresh
validation, and repaired entries disappear from the invalid-only results.

Selecting an individual file for a wildcard reference replaces its pattern. The
picker displays a reminder before selection. To retain a pattern, edit its folder
or expression in the path field and save manually.

### Search and replace

**Search** filters by document name, path or parent name. Submit a query using its
button or Enter. **Replace all** applies the replacement to the current result set
when a search term is provided. Back up the world before bulk changes. If a
replacement stops partway through, use **Recheck** to review the saved results.

The module also offers an audit-on-startup setting and best-effort reachability
checks for external URLs.

## Development and validation

The draft includes **22 passing automated tests** and GitHub Actions checks for
module behavior, syntax, version consistency and localization. The tests import
the actual ES modules and exercise the Handlebars template and DOM handlers in
jsdom with simulated Foundry APIs.

The [testing guide](https://github.com/vertigoogle/AssetAuditor/blob/improve-asset-auditing-v14/docs/testing.md)
tracks native Foundry validation and provides reproducible manual test cases.

Use Node.js 24.15 or newer to run the development checks:

```sh
npm ci --ignore-scripts
npm test
npm run check
```

## Trying the development version

Use a test world and back up your data first.

1. Check out the
   [`improve-asset-auditing-v14` branch](https://github.com/vertigoogle/AssetAuditor/tree/improve-asset-auditing-v14).
2. Copy **the contents of `src/`** into
   `<Foundry User Data>/Data/modules/asset-auditor/`.
3. Restart Foundry, enable Asset Auditor in the test world and reload the browser.
4. Follow the
   [manual test checklist](https://github.com/vertigoogle/AssetAuditor/blob/improve-asset-auditing-v14/docs/testing.md).

The `src/` directory is the installable module payload. This branch is distributed
as a development source checkout; release packaging is coordinated with the
upstream maintainer.

## Contributing

Feedback and review are welcome in the
[draft pull request](https://github.com/vertigoogle/AssetAuditor/pull/1).

To add a language, create `src/lang/<language-code>.json` and register it in
`src/module.json`. Match the English localization keys and interpolation
placeholders. CI runs the upstream localization consistency check.

## License and attribution

Asset Auditor was created by [The Comamba](https://github.com/TheComamba/AssetAuditor).
This fork continues the project under its [MIT license](LICENSE).
