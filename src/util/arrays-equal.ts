export function arraysEqual<T>(
	a: T[] | null | undefined,
	b: T[] | null | undefined
): boolean {
	if (a === null && b === null) return true;
	if (a === undefined && b === undefined) return true;
	if (!a || !b) return false;
	if (a?.length !== b?.length) return false;
	const sortetdA = [...a].sort();
	const sortedB = [...b].sort();

	return sortetdA.every((val, index) => val === sortedB[index]);
}
