# Changelog

## v1.1.0
- Updated for Foundry VTT v14, Wrath & Glory v8.1.2 and Token Action HUD Core v2.1.1. Foundry v13 is no longer supported (W&G v8 is v14-only).
- Actions now use `system` data instead of the deprecated `encodedValue`.
- Fixed errors when multiple tokens are selected (removed `_getActors`) and multi-token actions never firing.
- Replaced removed `doRenderItem` with `renderItem`.
- Replaced `getCombatantByActor` with `getCombatantsByActor`; turn actions are hidden when the optional initiative rule is enabled.
- Attribute and skill labels now read from `game.wng.config`.
- Added Mutations and Injuries groups.
- The "Display Unequipped" setting now works and has proper labels.
- Right-clicking equippable gear now toggles equipped state instead of opening the item sheet.
- Attribute and skill actions now show their type prefix in the HUD search list.
- Removed the unused "Rests" group, which displayed an untranslated key.
- Multi-token actions now only apply to tokens the user owns.
- Release workflow no longer uses third-party actions and validates the release tag.

## v1.0.2
- Cleaned up unused files.
- Attempting to clean up manifest loop.

## v1.0.1
- Fixes #4: attribute and skill names are blank in the stats menu unless an official archetype is added.

## v1.0.0
* Initial release
- Module currently offers: 
  - Fully working rolling of Attributes, Skills, Psychic Powers, and Weapons
  - Post other Items such as Abilities, Talents, and Gear to chat
  - Toggle equipped gear and conditions
  - Add agents and threats to combat and start/end turns
  
