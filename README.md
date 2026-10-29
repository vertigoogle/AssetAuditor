# Asset Auditor

Asset Auditor helps Foundry Virtual Tabletop GMs find and repair broken references
to images, maps and audio. It brings file validation, document navigation and path
editing into one overview, making asset reorganizations easier to review.

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

Both input fields can be cleared with their clear button or Escape. Enter in the
replacement field runs the replacement, just as its button does.

### Check paths when the world starts

Open **Game Settings → Configure Settings → Module Settings**, find Asset Auditor
and enable **Run asset audit on startup**. Each world startup then runs an audit
and displays an error notification with the number of invalid references found.

### External URLs

Paths beginning with `http://` or `https://` receive a best-effort network
reachability check, cached by origin. Browser cross-origin restrictions make this
a domain-level indicator; the local file checks use the directory listings from
User Data and Core Data.

## Development and validation

Automated tests and GitHub Actions cover module behavior, syntax, version
consistency and localization. The tests import
the actual ES modules and exercise the Handlebars template and DOM handlers in
jsdom with simulated Foundry APIs.

The [testing guide](docs/testing.md) describes the test environment and provides
reproducible in-Foundry checks.

Use Node.js 24.15 or newer to run the development checks:

```sh
npm ci --ignore-scripts
npm test
npm run check
```

## Manual installation

The `src/` directory contains the installable module. For a development checkout,
use a test world and back up your data first.

1. Clone or download this repository and check out the revision you want to test.
2. Copy **the contents of `src/`** into
   `<Foundry User Data>/Data/modules/asset-auditor/`.
3. Restart Foundry, enable Asset Auditor in the world and reload the browser.
4. Open **Asset Filepaths** or follow the [manual test checklist](docs/testing.md).

### Symbolic link on Linux and macOS

For development, a symbolic link lets Foundry use the source directory directly:

```sh
ln -s "/path/to/AssetAuditor/src" "/path/to/FoundryUserData/Data/modules/asset-auditor"
```

Replace both paths with your local locations. The destination directory must be
available for the link. Restart Foundry after creating it.

## Contributing

Bug reports, feature requests and pull requests are welcome. Check the existing
[issues](https://github.com/TheComamba/AssetAuditor/issues) before opening a report
and include reproduction steps, the Foundry version and the affected document type.

To add a language, create `src/lang/<language-code>.json` using its
[two-letter ISO 639-1 code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes)
and register it in `src/module.json`. Match the English localization keys and
interpolation placeholders. Run the consistency check used by CI:

```sh
./foundry_scripts/check_localizations_consistency.sh
```

The helper scripts are provided by the repository's `foundry_scripts` submodule.

## License and attribution

Asset Auditor was created by [The Comamba](https://github.com/TheComamba/AssetAuditor).
The project is distributed under the [MIT license](LICENSE).
