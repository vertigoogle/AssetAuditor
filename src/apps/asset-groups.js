const parentLabels = {
    Scene: "asset-auditor.app.context-Scene",
    Actor: "asset-auditor.app.context-Actor",
    Playlist: "asset-auditor.app.context-Playlist",
    JournalEntry: "asset-auditor.app.context-JournalEntry"
};

// Group display rows, not documents: each usage remains individually editable.
export function buildPathGroups(groups, localize) {
    for (const group of groups) {
        const paths = new Map();
        for (const entry of group.assets) {
            const parent = entry.asset.parent;
            const parentType = parent?.documentName;
            entry.contextLabel = parent?.name && parentLabels[parentType]
                ? `${localize(parentLabels[parentType])}: ${parent.name}` : "";
            let pathGroup = paths.get(entry.path);
            if (!pathGroup) {
                pathGroup = {path: entry.path, assets: [], count: 0,
                    countKey: group.type === "TokenDocument" ? "asset-auditor.app.token-usages" : "asset-auditor.app.asset-usages"};
                paths.set(entry.path, pathGroup);
            }
            pathGroup.assets.push(entry);
            pathGroup.count = pathGroup.assets.length;
            pathGroup.isMultiple = pathGroup.count > 1;
        }
        group.pathGroups = Array.from(paths.values());
    }
    return groups;
}
