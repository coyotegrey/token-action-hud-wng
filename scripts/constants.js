/**
 * Module-based constants
 */
export const MODULE = {
    ID: 'token-action-hud-wng'
};

/**
 * Core module
 */
export const CORE_MODULE = {
    ID: 'token-action-hud-core'
};

/**
 * Core module version required by the system module
 */
export const REQUIRED_CORE_MODULE_VERSION = '2.0';

/**
 * Action types
 */
export const ACTION_TYPE = {
    combat: 'tokenActionHud.wng.combat',
    stats: 'tokenActionHud.wng.stats',
    talent: 'TYPES.Item.talent',
    gear: 'TYPES.Item.gear',
    condition: 'tokenActionHud.wng.condition',
    utility: 'tokenActionHud.utility'
};

/**
 * Groups
 */
export const GROUP = {
    combatWeapons: { id: 'combatWeapons', name: 'TYPES.Item.weapon', type: 'system' },
    combatPowers: { id: 'combatPowers', name: 'TITLE.PSYCHIC_POWERS', type: 'system' },
    combatAbilities: { id: 'combatAbilities', name: 'TITLE.ABILITIES', type: 'system' },
    combatTests: { id: 'combatTests', name: 'tokenActionHud.wng.tests', type: 'system' },

    attributes: { id: 'attributes', name: 'TITLE.ATTRIBUTES', type: 'system' },
    skills: { id: 'skills', name: 'TITLE.SKILLS', type: 'system' },

    talents: { id: 'talents', name: 'TITLE.TALENTS', type: 'system' },
    abilities: { id: 'abilities', name: 'TITLE.ABILITIES', type: 'system' },
    powers: { id: 'powers', name: 'TITLE.PSYCHIC_POWERS', type: 'system' },

    armour: { id: 'armour', name: 'TYPES.Item.armour', type: 'system' },
    gear: { id: 'gear', name: 'TYPES.Item.gear', type: 'system' },
    ammo: { id: 'ammo', name: 'TYPES.Item.ammo', type: 'system' },
    weapons: { id: 'weapons', name: 'TYPES.Item.weapon', type: 'system' },
    weaponUpgrade: { id: 'weaponUpgrade', name: 'TYPES.Item.weaponUpgrade', type: 'system' },
    augmetic: { id: 'augmetic', name: 'TYPES.Item.augmentic', type: 'system' },

    conditions: { id: 'conditions', name: 'tokenActionHud.wng.conditions', type: 'system' },

    combat: { id: 'combat', name: 'tokenActionHud.combat', type: 'system' },
    token: { id: 'token', name: 'tokenActionHud.token', type: 'system' },
    rests: { id: 'rests', name: 'tokenActionHud.rests', type: 'system' },
    utility: { id: 'utility', name: 'tokenActionHud.utility', type: 'system' }
};

/**
 * Item types
 */
export const ITEM_TYPE = {
    ability: { groupId: 'abilities' },
    ammo: { groupId: 'ammo' },
    armour: { groupId: 'armour' },
    augmentic: { groupId: 'augmetic' },
    gear: { groupId: 'gear' },
    psychicPower: { groupId: 'powers' },
    talent: { groupId: 'talents' },
    weapon: { groupId: 'weapons' },
    weaponUpgrade: { groupId: 'weaponUpgrade' }
};
