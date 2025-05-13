export const openSettingsMenuCache = new Map<string, boolean>();

export function settingsMenuOpen(guildId: string): boolean {
	const key = guildId;

	const menuIsOpen = openSettingsMenuCache.get(key);

	if (menuIsOpen && menuIsOpen === true) {
		return true;
	} else return false;
}
