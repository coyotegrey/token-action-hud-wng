export let RollHandler = null

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    /**
     * Extends Token Action HUD Core's RollHandler class and handles action events triggered when an action is clicked
     */
    RollHandler = class RollHandler extends coreModule.api.RollHandler {
        #characterTypes = ['agent', 'threat'];

        /**
         * Handle action click
         * Called by Token Action HUD Core when an action is left or right-clicked
         * @override
         * @param {object} event The event
         */
        async handleActionClick (event) {
            const { actionType, actionId } = this.action?.system ?? {};
            if (!actionType) return;

            // If single actor is selected
            if (this.actor) {
                await this.#handleAction(event, this.actor, this.token, actionType, actionId);
                return;
            }

            const controlledTokens = coreModule.api.Utils.getControlledTokens()
                .filter((token) => token.actor?.isOwner && this.#characterTypes.includes(token.actor.type));

            // If multiple actors are selected
            for (const token of controlledTokens) {
                await this.#handleAction(event, token.actor, token, actionType, actionId);
            }
        }

        /**
         * Handle action hover
         * Called by Token Action HUD Core when an action is hovered on or off
         * @override
         * @param {object} event The event
         */
        async handleActionHover (event) {}

        /**
         * Handle group click
         * Called by Token Action HUD Core when a group is right-clicked while the HUD is locked
         * @override
         * @param {object} event The event
         * @param {object} group The group
         */
        async handleGroupClick (event, group) {}

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
                    await this.#handleCombatAction(event, actor, actionId);
                    break;
                case 'attribute':
                    await this.#handleAttributeAction(event, actor, actionId);
                    break;
                case 'skill':
                    await this.#handleSkillAction(event, actor, actionId);
                    break;
                case 'talent':
                case 'gear':
                    await this.#handleItemAction(event, actor, actionId);
                    break;
                case 'condition':
                    await this.#handleConditionAction(event, actor, actionId);
                    break;
                case 'utility':
                    await this.#handleUtilityAction(actor, token, actionId);
                    break;
            }
        }

        /**
         * Handle combat action
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {string} actionId The action id
         */
        async #handleCombatAction (event, actor, actionId) {
            const item = actor.items.get(actionId);
            switch (item?.type) {
                case 'weapon':
                    return actor.setupWeaponTest(item.id);
                case 'psychicPower':
                    return actor.setupPowerTest(item.id);
                case 'ability':
                    return actor.setupAbilityRoll(item);
                default:
                    return actor.setupGenericTest(actionId);
            }
        }

        /**
         * Handle attribute action
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {string} actionId The action id
         */
        async #handleAttributeAction (event, actor, actionId) {
            return actor.setupAttributeTest(actionId);
        }

        /**
         * Handle skill action
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {string} actionId The action id
         */
        async #handleSkillAction (event, actor, actionId) {
            return actor.setupSkillTest(actionId);
        }

        /**
         * Handle item action
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {string} actionId The action id
         */
        async #handleItemAction (event, actor, actionId) {
            const item = actor.items.get(actionId);
            if (!item) return;

            // Right-click toggles equipped state for equippable items; checked before
            // isRenderItem(), which is true for any unmodified right-click
            if (this.isRightClick && item.system.equippable) {
                await item.update({ 'system.equipped': !item.system.equipped });
                Hooks.callAll('forceUpdateTokenActionHud');
                return;
            }

            if (this.isRenderItem()) {
                return this.renderItem(actor, actionId);
            }

            if (!this.isRightClick) {
                return item.postItem();
            }
        }

        /**
         * Handle condition action
         * @private
         * @param {object} event    The event
         * @param {object} actor    The actor
         * @param {string} actionId The action id
         */
        async #handleConditionAction (event, actor, actionId) {
            if (actor.hasCondition(actionId)) {
                await actor.removeCondition(actionId);
            } else {
                await actor.addCondition(actionId);
            }

            Hooks.callAll('forceUpdateTokenActionHud');
        }

        /**
         * Handle utility action
         * @private
         * @param {object} actor    The actor
         * @param {object} token    The token
         * @param {string} actionId The action id
         */
        async #handleUtilityAction (actor, token, actionId) {
            const combat = game.combat;
            const combatant = combat?.getCombatantsByActor(actor)[0];
            if (!combatant) return;

            switch (actionId) {
                case 'setTurn':
                    if (!combatant.isCurrent && !combatant.isComplete) {
                        await combat.setTurn(combatant.id);
                    }
                    break;
                case 'endTurn':
                    if (combatant.isCurrent) {
                        await combat.setComplete(combatant.id);
                    }
                    break;
            }
        }
    }
})
