// System Module Imports
import { ACTION_TYPE, ITEM_TYPE } from './constants.js';
import { Utils } from './utils.js';

export let ActionHandler = null;

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    /**
     * Extends Token Action HUD Core's ActionHandler class and builds system-defined actions for the HUD
     */
    ActionHandler = class ActionHandler extends coreModule.api.ActionHandler {
        #characterTypes = ['agent', 'threat'];
        #equippableTypes = ['weapon', 'armour'];
        #combatTypes = ['weapon', 'psychicPower', 'ability'];
        #talentTypes = ['talent', 'ability', 'psychicPower', 'mutation', 'traumaticInjury', 'memorableInjury'];
        #combatActions = new Map(Object.entries({
            'determination': {'name': coreModule.api.Utils.i18n('ROLL.DETERMINATION')},
            'corruption': {'name': coreModule.api.Utils.i18n('ROLL.CORRUPTION')},
            'mutation': {'name': coreModule.api.Utils.i18n('ROLL.MUTATION')},
            'fear': {'name': coreModule.api.Utils.i18n('ROLL.FEAR')},
            'terror': {'name': coreModule.api.Utils.i18n('ROLL.TERROR')},
            'influence': {'name': coreModule.api.Utils.i18n('ROLL.INFLUENCE')}
        }));

        /**
         * Build system actions
         * Called by Token Action HUD Core
         * @override
         * @param {array} groupIds
         */
        async buildSystemActions (groupIds) {
            this.actorType = this.actor?.type;

            // Settings
            this.displayUnequipped = Utils.getSetting('displayUnequipped');

            // Set items variable
            if (this.actor) {
                this.items = coreModule.api.Utils.sortItemsByName(this.actor.items);
                this.attributes = this.actor.attributes ?? {};
                this.skills = this.actor.skills ?? {};
            }

            if (this.#characterTypes.includes(this.actorType)) {
                await this.#buildCharacterActions();
            } else if (!this.actor) {
                this.#buildMultipleTokenActions();
            }
        }

        /**
         * Build character actions
         * @private
         */
        async #buildCharacterActions () {
            await this.#buildCombat();
            await this.#buildStats();
            await this.#buildInventory();
            await this.#buildConditions();
            await this.#buildUtility();
        }

        /**
         * Build multiple token actions
         * @private
         * @returns {object}
         */
        #buildMultipleTokenActions () {}

        /**
         * Build combat actions
         * @private
         */
        async #buildCombat () {
            const inventoryMap = new Map();

            for (const [itemId, itemData] of this.items) {
                if (!this.#combatTypes.includes(itemData.type)) continue;
                if (itemData.type === 'weapon' && !itemData.system.isEquipped) continue;

                const type = itemData.type;
                const typeMap = inventoryMap.get(type) ?? new Map();
                typeMap.set(itemId, itemData);
                inventoryMap.set(type, typeMap);
            }

            for (const [type, typeMap] of inventoryMap) {
                const actionTypeId = 'combat';
                const groupId =
                    type === 'weapon' ? 'combatWeapons' :
                    type === 'psychicPower' ? 'combatPowers' :
                    'combatAbilities';
                const groupData = { id: groupId, type: 'system' };
                const actions = this.#getItemActions(typeMap, actionTypeId);
                this.addActions(actions, groupData);
            }

            const groupData = { id: 'combatTests', type: 'system' };
            const actions = this.#getItemActions(this.#combatActions, 'combat');
            this.addActions(actions, groupData);
        }

        /**
         * Build stats
         * @private
         */
        async #buildStats () {
            const config = game.wng?.config ?? {};
            const statTypes = {
                attribute: { stats: this.attributes, labels: config.attributes ?? {} },
                skill: { stats: this.skills, labels: config.skills ?? {} }
            };

            for (const [statId, { stats, labels }] of Object.entries(statTypes)) {
                const actionTypeId = statId;
                const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId]);
                const groupData = { id: `${statId}s`, type: 'system' };
                const actions = [];

                for (const id of Object.keys(labels)) {
                    const statData = stats[id];
                    if (!statData) continue;

                    const label = statData.label || labels[id];
                    const name = `${coreModule.api.Utils.i18n(label)} (${statData.total})`;
                    const listName = `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`;

                    actions.push({
                        id,
                        name,
                        listName,
                        system: { actionType: actionTypeId, actionId: id }
                    });
                }

                this.addActions(actions, groupData);
            }
        }

        /**
         * Build inventory
         * @private
         */
        async #buildInventory () {
            const inventoryMap = new Map();

            for (const [itemId, itemData] of this.items) {
                const type = itemData.type;
                if (!this.displayUnequipped && this.#equippableTypes.includes(type) && !itemData.system.isEquipped) continue;

                const typeMap = inventoryMap.get(type) ?? new Map();
                typeMap.set(itemId, itemData);
                inventoryMap.set(type, typeMap);
            }

            for (const [type, typeMap] of inventoryMap) {
                const actionTypeId = this.#talentTypes.includes(type) ? 'talent' : 'gear';
                const groupId = ITEM_TYPE[type]?.groupId;

                if (!groupId) continue;

                const groupData = { id: groupId, type: 'system' };
                const actions = this.#getItemActions(typeMap, actionTypeId);

                // TAH Core method to add actions to the action list
                this.addActions(actions, groupData);
            }
        }

        /**
         * Build conditions
         * @private
         */
        async #buildConditions () {
            // V14 changed CONFIG.statusEffects from an array to an object keyed by id; handle both
            const conditions = Object.values(CONFIG.statusEffects).filter((condition) => condition.id);
            if (conditions.length === 0) return;

            const actionTypeId = 'condition';
            const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId]);
            const groupData = { id: 'conditions', type: 'system' };

            const actions = conditions.map((condition) => {
                const id = condition.id;
                const name = coreModule.api.Utils.i18n(condition.name);
                const listName = `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`;
                const img = coreModule.api.Utils.getImage(condition.img);
                const active = this.actor.statuses.has(id) ? ' active' : '';

                return {
                    id,
                    name,
                    listName,
                    img,
                    cssClass: `toggle${active}`,
                    system: { actionType: actionTypeId, actionId: id }
                };
            });

            this.addActions(actions, groupData);
        }

        /**
         * Build utility
         * @private
         */
        async #buildUtility () {
            // Activate/deactivate relies on W&G's custom Combat class, which is not used with the optional initiative rule
            if (!game.combat?.started || typeof game.combat.setComplete !== 'function') return;

            const combatant = game.combat.getCombatantsByActor(this.actor)[0];
            if (!combatant) return;

            const typeMap = new Map();

            // add activate combatant?
            if (!combatant.isCurrent && !combatant.isComplete) {
                typeMap.set('setTurn', {'name': coreModule.api.Utils.i18n('tokenActionHud.wng.activate')});
            }
            // add deactivate combatant?
            if (combatant.isCurrent) {
                typeMap.set('endTurn', {'name': coreModule.api.Utils.i18n('tokenActionHud.wng.deactivate')});
            }

            if (typeMap.size > 0) {
                const groupData = { id: 'combat', type: 'system' };
                const actions = this.#getItemActions(typeMap, 'utility');
                this.addActions(actions, groupData);
            }
        }

        /**
         * Get actions
         * @private
         */
        #getItemActions (typeMap, actionTypeId) {
            return [...typeMap].map(([itemId, itemData]) => {
                const id = itemId;
                const name = itemData.name;
                const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId]);
                const listName = `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`;
                const img = coreModule.api.Utils.getImage(itemData.img);

                const active = actionTypeId === 'gear' && itemData.system?.isEquipped ? ' active' : '';
                const cssClass = `toggle${active}`;

                return {
                    id,
                    name,
                    listName,
                    img,
                    cssClass,
                    system: { actionType: actionTypeId, actionId: id }
                };
            });
        }
    };
});
