/**
 * Parses time units and returns them to a universal format (ex. d, day, days => days)
 * @param rawUnit The time unit in string format that is to be parsed to a universal form within this project
 */
export function normalizeTimeUnit(
	rawUnit: string
):
	| `seconds`
	| `minutes`
	| `hours`
	| `days`
	| `weeks`
	| `months`
	| `years`
	| undefined {
	const u = rawUnit.toLowerCase();
	switch (u) {
		case "s":
		case "sec":
		case "second":
		case "seconds":
			return "seconds";
		case "m":
		case "min":
		case "minute":
		case "minutes":
			return "minutes";
		case "h":
		case "hour":
		case "hours":
			return "hours";
		case "d":
		case "day":
		case "days":
			return "days";
		case "w":
		case "week":
		case "weeks":
			return "weeks";
		case "m":
		case "month":
		case "months":
			return "months";
		case "y":
		case "year":
		case "years":
			return "years";
		default:
			return undefined;
	}
}
