# Asset Auditor

## About

Asset Auditor is a module for [Foundry Virtual Tabletop](https://foundryvtt.com/). The idea arose because I kept wondering why my music playlists would stop playing all the time. At some point I noticed that they do so once they try to load a file that doesn't exists. Checking all files by hand is a pain, though. So here we are.

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

See [Testing](docs/testing.md) for automated checks, the pending in-Foundry checklist
and the exact scope of the supported paths.

## Contributing

Asset Auditor is very close to feature complete in my opinion. If you disagree, either because you are missing some functionality, because I have overlooked an asset type, or because you suspect a bug, please let me know by [creating an issue](https://github.com/TheComamba/AssetAuditor/issues). Also have a look at the existing issues and let me know if you want me to prioritize one of them.

I am also open to pull requests.

If you want to add a new language, add a file called `src/lang/<new-lang>.json`, where `<new-lang>` is the corresponding [two-letter ISO 639-1 language code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes). In `src/module.json`, add a new entry in the `"languages"` array. Running `foundry_scripts/check_localizations_consistency.sh` will list all keys that are not translated into your language. It will also discover some typos.

## Manual Installation

To manually install Asset Auditor (e.g. for development), copy the src/ folder of this repository to the {userData}/Data/modules/ folder of Foundry, and then rename it to 'asset-auditor' (the id declared in module.json).

On POSIX compliant operating systems like Linux and Mac you can alternatively use a symbolic link. It can be created via e.g.

```bash
ln -s {folder containing git repo}/AssetAuditor/src {Foundry user data}/Data/modules/asset-auditor
```

## License

This software is distributed under the [MIT](https://choosealicense.com/licenses/mit/) license. In a nutshell this means that all code is made public, and you are free to use it without any charge.
