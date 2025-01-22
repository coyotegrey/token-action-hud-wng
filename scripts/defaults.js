import { GROUP } from './constants.js';

/**
 * Default layout and groups
 */
export let DEFAULTS = null;

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
    const groups = GROUP;
    Object.values(groups).forEach(group => {
        group.name = coreModule.api.Utils.i18n(group.name);
        group.listName = `Group: ${coreModule.api.Utils.i18n(group.listName ?? group.name)}`;
    });
    const groupsArray = Object.values(groups)
    DEFAULTS = {
        layout: [
            {
                nestId: 'stats',
                id: 'stats',
                name: coreModule.api.Utils.i18n('tokenActionHud.wng.stats'),
                groups: [
                    { ...groups.attributes, nestId: 'stats_attributes' },
                    { ...groups.skills, nestId: 'stats_skills' }
                ]
            },
            {
                nestId: 'combat',
                id: 'combat',
                name: coreModule.api.Utils.i18n('tokenActionHud.wng.combat'),
                groups: [
                    { ...groups.combatWeapons, nestId: 'combat_combatWeapons' },
                    { ...groups.combatPowers, nestId: 'combat_combatPowers' },
                    { ...groups.combatAbilities, nestId: 'combat_combatAbilities' },
                    { ...groups.combatTests, nestId: 'combat_combatTests' }
                ]
            },
            {
                nestId: 'talents',
                id: 'talents',
                name: coreModule.api.Utils.i18n('tokenActionHud.wng.talents'),
                groups: [
                    { ...groups.talents, nestId: 'talents_talents' },
                    { ...groups.abilities, nestId: 'talents_abilities' },
                    { ...groups.powers, nestId: 'talents_powers' }
                ]
            },
            {
                nestId: 'gear',
                id: 'gear',
                name: coreModule.api.Utils.i18n('tokenActionHud.wng.gear'),
                groups: [
                    { ...groups.weapons, nestId: 'gear_weapons' },
                    { ...groups.armour, nestId: 'gear_armour' },
                    { ...groups.gear, nestId: 'gear_gear' },
                    { ...groups.ammo, nestId: 'gear_ammo' },
                    { ...groups.weaponUpgrade, nestId: 'gear_weaponUpgrade' },
                    { ...groups.augmetic, nestId: 'gear_augmetic' }
                ]
            },
            {
                nestId: 'conditions',
                id: 'conditions',
                name: coreModule.api.Utils.i18n('tokenActionHud.wng.conditions'),
                groups: [
                    { ...groups.conditions, nestId: 'conditions_conditions'}
                ]
            },
            {
                nestId: 'utility',
                id: 'utility',
                name: coreModule.api.Utils.i18n('tokenActionHud.utility'),
                groups: [
                    { ...groups.combat, nestId: 'utility_combat' },
                    { ...groups.token, nestId: 'utility_token' },
                    { ...groups.rests, nestId: 'utility_rests' },
                    { ...groups.utility, nestId: 'utility_utility' }
                ]
            }
        ],
        groups: groupsArray
    }
});
