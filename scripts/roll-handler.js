export let RollHandler = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    /**
     * Extends Token Action HUD Core's RollHandler class and handles action events triggered when an action is clicked
     */
    RollHandler = class RollHandler extends coreModule.api.RollHandler {
        /**
         * Handle action click
         * Called by Token Action HUD Core when an action is left or right-clicked
         * @override
         * @param {object} event        The event
         * @param {string} encodedValue The encoded value
         */
        async handleActionClick (event, encodedValue) {
            const [actionTypeId, actionId] = encodedValue.split('|');

            const renderable = ['item'];

            if (renderable.includes(actionTypeId) && this.isRenderItem()) {
                return this.doRenderItem(this.actor, actionId);
            }

            const knownCharacters = ['character']

            // If single actor is selected
            if (this.actor) {
                await this.#handleAction(event, this.actor, this.token, actionTypeId, actionId);
                return;
            }

            const controlledTokens = canvas.tokens.controlled
                .filter((token) => knownCharacters.includes(token.actor?.type));

            // If multiple actors are selected
            for (const token of controlledTokens) {
                const actor = token.actor;
                await this.#handleAction(event, actor, token, actionTypeId, actionId);
            }
        }

        /**
         * Handle action hover
         * Called by Token Action HUD Core when an action is hovered on or off
         * @override
         * @param {object} event        The event
         * @param {string} encodedValue The encoded value
         */
        async handleActionHover (event, encodedValue) {};

        /**
         * Handle group click
         * Called by Token Action HUD Core when a group is right-clicked while the HUD is locked
         * @override
         * @param {object} event The event
         * @param {object} group The group
         */
        async handleGroupClick (event, group) {};

        /**
         * Handle action
         * @private
         * @param {object} event        The event
         * @param {object} actor        The actor
         * @param {object} token        The token
         * @param {string} actionTypeId The action type id
         * @param {string} actionId     The actionId
         */
        async #handleAction (event, actor, token, actionTypeId, actionId) {
            switch (actionTypeId) {
                case 'combat':
                    this.#handleCombatAction(event, actor, actionId);
                    break;
                case 'attribute':
                    this.#handleAttributeAction(event, actor, actionId);
                    break;
                case 'skill':
                    this.#handleSkillAction(event, actor, actionId);
                    break;
                case 'talent':
                case 'gear':
                    this.#handleItemAction(event, actor, actionId);
                    break
                case 'condition':
                    this.#handleConditionAction(event, actor, actionId);
                    break
                case 'utility':
                    this.#handleUtilityAction(actor, token, actionId);
                    break
            }
        }

        /**
         * Handle combat action
         */
        #handleCombatAction (event, actor, actionId) {
            const itemType = actor.items.get(actionId)?.type || actionId;
            switch (itemType) {
                case 'weapon':
                    actor.setupWeaponTest(actionId);
                    break;
                case 'psychicPower':
                    actor.setupPowerTest(actionId);
                    break;
                case 'ability':
                    const ability = actor.items.get(actionId);
                    actor.setupAbilityRoll(ability);
                    break;
                default:
                    actor.setupGenericTest(itemType);
            }
        }

        /**
         * Handle attribute action
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {string} actionId The action id
         */
        #handleAttributeAction (event, actor, actionId) {
            actor.setupAttributeTest(actionId);
        }

        /**
         * Handle skill action
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {string} actionId The action id
         */
        #handleSkillAction (event, actor, actionId) {
            actor.setupSkillTest(actionId);
        }

        /**
         * Handle item action
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {string} actionId The action id
         */
        #handleItemAction (event, actor, actionId) {
            const item = actor.items.get(actionId);
            if (!this.isRightClick) {
                item.sendToChat(event);
            } else if (item.system.equippable) {
                item.system.equipped = !item.system.equipped;
                return Hooks.callAll('forceUpdateTokenActionHud');
            }
        }

        /**
         * Handle condition action
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {string} actionId The action id
         */
        #handleConditionAction (event, actor, actionId) {
            const condition = CONFIG.statusEffects.find(c => c.id == actionId);
            if (actor.hasCondition(actionId)) {
                actor.removeCondition(actionId);
            } else {
                actor.addCondition(actionId);
            }

            return Hooks.callAll('forceUpdateTokenActionHud');
        }

        /**
         * Handle utility action
         * @private
         * @param {object} actor    The actor
         * @param {object} token    The token
         * @param {string} actionId The action id
         */
        async #handleUtilityAction (actor, token, actionId) {
            const combatant = game.combat?.getCombatantByActor(actor);
            switch (actionId) {
                case 'setTurn':
                    if (!combatant?.isCurrent && !combatant?.isComplete) {
                        game.combat.setTurn(combatant.id);
                    }
                    break;
                case 'endTurn':
                    if (combatant?.isCurrent) {
                        game.combat.runEndTurnScripts(combatant);
                        combatant?.update(combatant.setComplete());
                    }
                    break;
            }
        }
    }
})
