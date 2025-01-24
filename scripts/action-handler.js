// System Module Imports
import { ACTION_TYPE, ITEM_TYPE } from './constants.js';
import { Utils } from './utils.js';

export let ActionHandler = null;

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    /**
     * Extends Token Action HUD Core's ActionHandler class and builds system-defined actions for the HUD
     */
    ActionHandler = class ActionHandler extends coreModule.api.ActionHandler {
        /**
         * Build system actions
         * Called by Token Action HUD Core
         * @override
         * @param {array} groupIds
         */
        #actorTypes = ['agent', 'threat', 'vehicle'];
        #equippableTypes = ['weapon', 'armour'];
        #combatTypes = ['weapon', 'psychicPower', 'ability'];
        #talentTypes = ['talent', 'ability', 'psychicPower'];
        #gearTypes = ['weapon', 'armour', 'gear', 'ammo', 'weaponUpgrade', 'augmentic'];
        #combatActions = new Map(Object.entries({
            'determination': {'name': coreModule.api.Utils.i18n('ROLL.DETERMINATION')},
            'corruption': {'name': coreModule.api.Utils.i18n('ROLL.CORRUPTION')},
            'mutation': {'name': coreModule.api.Utils.i18n('ROLL.MUTATION')},
            'fear': {'name': coreModule.api.Utils.i18n('ROLL.FEAR')},
            'terror': {'name': coreModule.api.Utils.i18n('ROLL.TERROR')},
            'influence': {'name': coreModule.api.Utils.i18n('ROLL.INFLUENCE')}
        }));

        async buildSystemActions (groupIds) {
            // Set actor and token variables
            this.actors = (!this.actor) ? this._getActors() : [this.actor];
            this.actorType = this.actor?.type;

            // Settings
            this.displayUnequipped = Utils.getSetting('displayUnequipped');

            // Set items variable
            if (this.actor) {
                let talents = this.actor.items.filter(i => !i.location?.value && this.#talentTypes.includes(i.type));
                let gear = this.actor.items.filter(i => !i.location?.value && this.#gearTypes.includes(i.type));

                this.items = coreModule.api.Utils.sortItemsByName(this.actor.items);
                this.attributes = this.actor.attributes;
                this.skills = this.actor.skills;
                this.talents = coreModule.api.Utils.sortItemsByName(talents);
                this.gear = coreModule.api.Utils.sortItemsByName(gear);
            }

            if (['agent','threat'].includes(this.actorType)) {
                this.#buildCharacterActions();
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
            if (this.items.size === 0) return;

            const inventoryMap = new Map();

            for (const [itemId, itemData] of this.items) {
                if (!this.#combatTypes.includes(itemData.type)) continue;
                if (itemData.type == 'weapon' && !itemData.system.isEquipped) continue;

                const type = itemData.type;
                const typeMap = inventoryMap.get(type) ?? new Map();
                typeMap.set(itemId, itemData);
                inventoryMap.set(type, typeMap);
            }

            for (const [type, typeMap] of inventoryMap) {
                const actionTypeId = 'combat';
                const groupId = 
                    type == 'weapon' ? 'combatWeapons' : 
                    type == 'psychicPower' ? 'combatPowers' :
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
            if (this.attributes.size === 0) return;
            if (this.skills.size === 0) return;

            const statTypes = {"attribute": this.attributes, "skill": this.skills};

            for (const statId in statTypes) {
                const statData = statTypes[statId];
                const actionTypeId = statId;
                const groupData = { id: `${statId}s`, type: 'system' };
                const actions = [];

                for (const itemId in statData) {
                    const id = itemId;
                    const itemData = statData[itemId];
                    const name = `${coreModule.api.Utils.i18n(itemData.label)} (${itemData.total})`;
                    const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId]);
                    const listName = `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`;
                    const encodedValue = [actionTypeId, id].join(this.delimiter);

                    const img = coreModule.api.Utils.getImage(itemData.img);

                    actions.push({
                        id,
                        name,
                        listName,
                        encodedValue,
                        img
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
            if (this.items.size === 0) return;

            const inventoryMap = new Map();

            for (const [itemId, itemData] of this.items) {
                const type = itemData.type;
                const equipped = itemData.equipped;

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
            const conditions = CONFIG.statusEffects.filter((condition) => condition.id !== '');
            if (conditions.length === 0) return;

            const actionTypeId = 'condition';
            const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId]);
            const groupData = { id: 'conditions', type: 'system' };
            const actions = [];

            for (const conditionId in conditions) {
                const id = conditions[conditionId].id;
                const conditionData = conditions[conditionId];
                const name = coreModule.api.Utils.i18n(conditionData.name);
                const listName = `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`;
                const encodedValue = [actionTypeId, id].join(this.delimiter);

                const img = coreModule.api.Utils.getImage(conditionData.img);

                const statusFound = this.actor.statuses.find(s => s == id);
                const active = statusFound ? ' active' : '';
                const cssClass = `toggle${active}`;

                actions.push({
                    id,
                    name,
                    listName,
                    encodedValue,
                    img,
                    cssClass
                });
            };

            this.addActions(actions, groupData);
        }

        /**
         * Build utility
         * @private
         */
        async #buildUtility () {
            if (game.combat?.started) {
                const combatant = game.combat.getCombatantByActor(this.actor);
                const typeMap = new Map();

                // add activate combatant?
                if (!combatant?.isCurrent && !combatant?.isComplete) {
                    typeMap.set('setTurn', {'name': coreModule.api.Utils.i18n('tokenActionHud.wng.activate')});
                }
                // add deactivate combatant?
                if (combatant?.isCurrent) {
                    typeMap.set('endTurn', {'name': coreModule.api.Utils.i18n('tokenActionHud.wng.deactivate')});
                }

                if (typeMap.size > 0) {
                    const groupData = { id: 'combat', type: 'system' };
                    const actions = this.#getItemActions(typeMap, 'utility');
                    this.addActions(actions, groupData);
                }
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
                const encodedValue = [actionTypeId, id].join(this.delimiter);

                const img = coreModule.api.Utils.getImage(itemData.img);

                //const statusFound = this.actor.statuses.find(s => s == id);
                const active = actionTypeId == 'gear' && itemData.system.isEquipped ? ' active' : '';
                const cssClass = `toggle${active}`; 

                return {
                    id,
                    name,
                    listName,
                    encodedValue,
                    img,
                    cssClass
                }
            })
        }
    };
});
