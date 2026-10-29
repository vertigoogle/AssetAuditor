import { buildPathGroups } from "./asset-groups.js";
import { openAssetOriginal } from "./asset-original.js";
import { getAllAssets, getAllAssetTypes, getAssetPath, getLastValidPath, setAssetPath, checkAssetPath, containsWildcard } from "../scripts/asset-aggregation.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

class AssetFilepaths extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: "asset-auditor-filepaths",
        classes: ["asset-auditor"],
        tag: "div",
        window: {title: "asset-auditor.asset-filepaths", icon: "fas fa-file-circle-check", resizable: true},
        position: {width: 1100, height: 760}
    };

    static PARTS = {
        main: {template: "modules/asset-auditor/apps/asset-filepaths.hbs", scrollable: [".asset-results"]}
    };

    constructor(options = {}) {
        super(options);
        this.context = {};
        this._openSequence = 0;
        this._savingAssets = new Set();
        this.showInvalidOnly = false;
        this.currentSearchInput = '';
        this.searchText = '';
        this.replaceText = '';
        this.singularType = '';
        this._assets = [];
        this._scanRequested = true;
        this._scanBusy = false;
        this._scanState = {phase: "idle", completed: 0, total: 0};
    }

    async _prepareContext(options = {}) {
        this.context = await super._prepareContext(options);
        this.context.title = game.i18n.localize("asset-auditor.asset-filepaths");
        this.context.showInvalidOnly = this.showInvalidOnly
        this.context.currentSearchInput = this.currentSearchInput;
        this.context.searchText = this.searchText;
        this.context.replaceText = this.replaceText;
        this.context.assetTypes = getAllAssetTypes();
        this.context.singularType = this.singularType;
        this.context.assets = this._assets;
        this.context.scanBusy = this._scanBusy;
        this.context.scanMessage = this.scanMessage();
        this.context.scanFailed = this._scanState.phase === "error";
        this.context.scanCompleted = this._scanState.phase === "complete";
        this.context.hasResults = this._assets.some(group => group.assets.length > 0);
        for (const group of this.context.assets) {
            for (const asset of group.assets) asset.openKey = String(this._openSequence++);
        }
        buildPathGroups(this.context.assets, key => game.i18n.localize(key));
        return this.context;
    }

    _onRender(context, options) {
        super._onRender(context, options);
        this.activateListeners($(this.element));
        this.updateScanUI();
        if (this._scanRequested && !this._scanBusy) {
            void this.scanAssets().catch(error => console.error("Asset Auditor | Could not render scan results", error));
        }
    }

    scanMessage() {
        const {phase, completed, total} = this._scanState;
        if (phase === "complete") {
            const entries = this._assets.flatMap(group => group.assets);
            return game.i18n.format("asset-auditor.app.scan-complete", {
                count: entries.length, invalid: entries.filter(entry => !entry.isValid).length
            });
        }
        if (["directories", "documents", "hints"].includes(phase)) {
            return game.i18n.format(`asset-auditor.app.scan-${phase}`, {completed, total});
        }
        return game.i18n.localize(`asset-auditor.app.scan-${phase}`);
    }

    updateScanUI() {
        const root = this.element;
        if (!root) return;
        const status = root.querySelector('.asset-scan-status');
        if (!status) return;
        const {phase, completed, total} = this._scanState;
        status.dataset.state = phase;
        status.setAttribute('aria-busy', String(this._scanBusy));
        status.querySelector('.asset-scan-message').textContent = this.scanMessage();
        const progress = status.querySelector('progress');
        progress.hidden = !this._scanBusy;
        if (total > 0) { progress.max = total; progress.value = completed; }
        else progress.removeAttribute('value');
        status.querySelector('i').className = this._scanBusy ? 'fas fa-spinner fa-spin'
            : phase === 'error' ? 'fas fa-triangle-exclamation' : 'fas fa-circle-check';
        root.querySelector('.asset-results')?.setAttribute('aria-busy', String(this._scanBusy));
        // Freeze the current result set while it is being replaced. The next
        // completed render restores the individual controls' normal states.
        if (this._scanBusy) {
            root.querySelectorAll('.asset-toolbar button, .asset-toolbar input, .asset-toolbar select, .asset-results button, .asset-results input')
                .forEach(control => { control.disabled = true; });
        }
    }

    async scanAssets() {
        if (this._scanBusy) return;
        this._scanRequested = false;
        this._scanBusy = true;
        this._scanState = {phase: "starting", completed: 0, total: 0};
        this.updateScanUI();
        try {
            const assets = await getAllAssets(this.showInvalidOnly, this.searchText, this.singularType,
                progress => {
                    this._scanState = progress;
                    this.updateScanUI();
                });
            this._assets = assets;
            this._scanState = {phase: "complete", completed: 0, total: 0};
        } catch (error) {
            console.error("Asset Auditor | Asset scan failed", error);
            this._scanState = {phase: "error", completed: 0, total: 0};
        } finally {
            this._scanBusy = false;
            // Do not reopen a window closed while its scan was running.
            if (this.rendered) await this.render({force: true});
        }
    }

    activateListeners(html) {

        html.find('.recheck-assets-button').click(() => {
            this.refresh(html);
        });

        html.find('.open-original-button').click(async (event) => {
            const button = event.currentTarget;
            const key = button.dataset.openKey;
            const entry = this.context.assets.flatMap(group => group.assets)
                .find(asset => asset.openKey === key);
            button.disabled = true;
            try {
                await openAssetOriginal(entry?.asset);
            } catch (error) {
                console.error("Asset Auditor | Could not open original", error);
                ui.notifications.error(game.i18n.localize("asset-auditor.app.open-original-error"));
            } finally {
                button.disabled = false;
            }
        });

        html.find('.toggle-invalid').change(async (event) => {
            this.showInvalidOnly = event.target.checked;
            this.refresh(html);
        });

        html.find('.asset-type-dropdown').change((event) => {
            this.singularType = event.target.value;
            this.refresh(html);
        });

        html.find('.delete-search-button').click((event) => {
            this.performDeleteSearch(event, html);
        });

        html.find('.delete-replace-button').click((event) => {
            this.performDeleteReplace(event, html);
        });

        html.find('.search-button').click((_event) => {
            this.performSearch(html);
        });

        html.find('.replace-button').click(async (_event) => {
            await this.performReplacement(html);
        });

        html.find('.update-button').click(async (event) => {
            await this.saveAssetRow($(event.currentTarget), html);
        });

        html.find('.reset-button').click((event) => {
            const resetButton = $(event.currentTarget);
            const updateButton = resetButton.siblings('.update-button');
            const input = resetButton.siblings('.path-input');
            const originalValue = input.data('original-value');
            input.val(originalValue);
            resetButton.css('opacity', '');
            resetButton.prop('disabled', true);
            updateButton.css('opacity', '');
            updateButton.prop('disabled', true);
            this.refresh(html);
        });

        html.find('.browse-button').click(async (event) => {
            const browseButton = $(event.currentTarget);
            const input = browseButton.siblings('.path-input');
            const assetId = browseButton.data('asset-key');
            const asset = this.findAsset(assetId);
            if (!asset) {
                ui.notifications.error(game.i18n.format("asset-auditor.app.asset-not-found", { id: assetId }));
                return;
            }
            if (containsWildcard(input.val())) {
                ui.notifications.warn(game.i18n.localize("asset-auditor.app.wildcard-picker-warning"));
            }
            const lastValidPath = asset.lastValidPath;
            const filePicker = new FilePicker({
                type: 'any',
                current: lastValidPath,
                callback: async (path) => {
                    if (!input[0]?.isConnected || this._scanBusy || !this.findAsset(assetId)) return;
                    input.val(path).trigger('input');
                    await this.saveAssetRow(browseButton.siblings('.update-button'), html);
                },
                top: this.position.top + 40,
                left: this.position.left + 10
            });
            // browse() opens the picker; it does not wait for the user's selection.
            // Re-rendering here would detach the row captured by the callback.
            await filePicker.browse(lastValidPath);
        });

        html.find('.path-input').on('input', (event) => {
            const input = $(event.currentTarget);
            const originalValue = input.data('original-value');
            const currentValue = input.val();
            const resetButton = input.siblings('.reset-button');
            const updateButton = input.siblings('.update-button');
            if (currentValue !== originalValue) {
                resetButton.css('opacity', '');
                resetButton.prop('disabled', false);
                updateButton.css('opacity', '');
                updateButton.prop('disabled', false);
            } else {
                resetButton.css('opacity', '');
                resetButton.prop('disabled', true);
                updateButton.css('opacity', '');
                updateButton.prop('disabled', true);
            }
        });

        html.find('.search-input')
            .on('input', (event) => {
                const input = $(event.currentTarget);
                this.currentSearchInput = input.val();
                this.updateOperability(html);
            })
            .on('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    this.performSearch(html);
                } else if (event.key === 'Escape') {
                    this.performDeleteSearch(event, html);
                }
            });

        html.find('.replace-input')
            .on('input', (event) => {
                const input = $(event.currentTarget);
                this.replaceText = input.val();
                this.updateOperability(html);
            })
            .on('keydown', async (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    await this.performReplacement(html);
                } else if (event.key === 'Escape') {
                    this.performDeleteReplace(event, html);
                }
            });

        this.updateOperability(html);
    }

    performDeleteReplace(event, html) {
        const button = $(event.currentTarget);
        const input = button.siblings('.replace-input');
        input.val('');
        this.replaceText = '';
        this.refresh(html);
    }

    performDeleteSearch(event, html) {
        const button = $(event.currentTarget);
        const input = button.siblings('.search-input');
        input.val('');
        this.currentSearchInput = '';
        this.searchText = '';
        this.refresh(html);
    }

    async performReplacement(html) {
        if (!this.currentSearchInput.trim() || this._scanBusy || this._savingAssets.size) return;
        this.searchText = this.currentSearchInput;
        const assets = this.context.assets.flatMap(group => group.assets.map(entry => entry.asset));
        this._savingAssets.add("batch");
        $(this.element).find('button, input, select').prop('disabled', true);
        try {
            for (const asset of assets) {
                const currentPath = getAssetPath(asset);
                if (currentPath.includes(this.searchText)) {
                    await setAssetPath(asset, currentPath.replace(this.searchText, this.replaceText));
                }
            }
        } catch (error) {
            console.error("Asset Auditor | Replacement stopped", error);
            ui.notifications.error(game.i18n.localize("asset-auditor.app.save-error"));
        } finally {
            this._savingAssets.delete("batch");
            this.refresh(html);
        }
    }

    performSearch(html) {
        this.searchText = this.currentSearchInput;
        this.refresh(html);
    }

    refresh(html) {
        if (this._scanBusy) return;
        this._scanRequested = true;
        if (this._savingAssets.size) return;
        return this.render({force: true});
    }

    updateOperability(html) {
        const deleteSearchButton = html.find('.delete-search-button');
        const searchButton = html.find('.search-button');
        const replaceButton = html.find('.replace-button');
        if (this.currentSearchInput.trim() !== '') {
            deleteSearchButton.prop('disabled', false);
            deleteSearchButton.css('opacity', '');
            searchButton.prop('disabled', false);
            replaceButton.prop('disabled', false);
        } else {
            deleteSearchButton.prop('disabled', true);
            deleteSearchButton.css('opacity', '');
            searchButton.prop('disabled', true);
            replaceButton.prop('disabled', true);
        }
        const deleteReplaceButton = html.find('.delete-replace-button');
        if (this.replaceText.trim() !== '') {
            deleteReplaceButton.prop('disabled', false);
            deleteReplaceButton.css('opacity', '');
        } else {
            deleteReplaceButton.prop('disabled', true);
            deleteReplaceButton.css('opacity', '');
        }
    }

    async saveAssetRow(updateButton, html) {
        const assetId = updateButton.data('asset-key');
        if (this._scanBusy || this._savingAssets.has("batch") || this._savingAssets.has(assetId)) return;
        this._savingAssets.add(assetId);
        updateButton.prop('disabled', true);
        const rowControls = updateButton.closest('.asset-row').find('button, input');
        rowControls.prop('disabled', true);
        try {
            const resetButton = updateButton.siblings('.reset-button');
            const input = updateButton.siblings('.path-input');
            const inputValue = input.val();
            const savedEntry = await this.updateAssetPath(assetId, inputValue);
            if (!savedEntry) return;
            const savedPath = getAssetPath(savedEntry.asset);
            const isValid = await checkAssetPath(savedPath);
            input.val(savedPath);
            input.data('original-value', savedPath);
            resetButton.css('opacity', '');
            resetButton.prop('disabled', true);
            updateButton.css('opacity', '');
            updateButton.prop('disabled', true);
            if (this.showInvalidOnly && isValid) {
                // Remove only this repaired row; keep other unsaved edits intact.
                const row = updateButton.closest('.asset-row');
                const pathGroup = row.closest('.asset-path-group');
                row.next('.asset-invalid-hint').remove();
                row.remove();
                const remaining = pathGroup.find('.asset-row').length;
                if (remaining === 0) pathGroup.remove();
                else pathGroup.find('.asset-group-count').text(game.i18n.format(
                    pathGroup.data('count-key'), {count: remaining}
                ));
                for (const group of this.context.assets) {
                    group.assets = group.assets.filter(entry => entry !== savedEntry);
                }
                this.updateScanUI();
            } else {
                this.refresh(html);
            }
        } catch (error) {
            console.error("Asset Auditor | Could not save asset path", error);
            ui.notifications.error(game.i18n.localize("asset-auditor.app.save-error"));
            updateButton.css('opacity', '');
            updateButton.prop('disabled', false);
        } finally {
            this._savingAssets.delete(assetId);
            rowControls.prop('disabled', false);
            const rowInput = updateButton.siblings('.path-input');
            const dirty = rowInput.val() !== rowInput.data('original-value');
            updateButton.prop('disabled', !dirty);
            updateButton.siblings('.reset-button').prop('disabled', !dirty);
            if (!this._savingAssets.size && this._scanRequested) {
                await this.render({force: true});
            }
        }
    }

    findAsset(assetId) {
        for (const assetMap of this.context.assets) {
            const assetObject = assetMap.assets.find(asset => asset.openKey === String(assetId));
            if (assetObject) {
                return assetObject;
            }
        }
        return null;
    }

    async updateAssetPath(assetId, inputValue) {
        const asset = this.findAsset(assetId);
        if (!asset) {
            ui.notifications.error(game.i18n.format("asset-auditor.app.asset-not-found", { id: assetId }));
            return;
        }
        asset.asset = await setAssetPath(asset.asset, inputValue);
        return asset;
    };
}

export { AssetFilepaths };
