let filteredIds = $state<string[]>([]);

export const explorerFilter = {
	get filteredIds() {
		return filteredIds;
	},
	set filteredIds(v: string[]) {
		filteredIds = v;
	},
};
