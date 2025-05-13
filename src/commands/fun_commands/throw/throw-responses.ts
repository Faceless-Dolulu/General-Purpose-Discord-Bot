export const throwResponses = {
	miss: [
		`{user} tried to throw **{item}** at {target}, but tripped.`,
		`{user} rolled a nat 1 while targeting {target} with **{item}**... complete miss.`,
		`{user} launched **{item}** towards {target}, but it disappeared into a pocket dimension.`,
		`{target} sidestepped {user}'s **{item}** with perfect timing.`,
		"{user} aimed carefully, then hit themselves with **{item}**...",
	],
	oneItem: [
		`{user} hurled **{item}** at {target}, scoring a clean hit for 1d10 damage.`,
		`{user} aimed well and struck {target} with **{item}**.`,
		`{user}'s throw connected — **{item}** slammed into {target}.`,
		`{user} lined up a shot and nailed {target} with **{item}**.`,
		`{user} delivered a quick hit to {target} using **{item}**.`,
	],
	twoItem: [
		`{user} launched **{item1}** followed by **{item2}**, dealing 1d10 + 1d8 damage to {target}.`,
		`{user} rolled a dirty 20 and hit {target} with a clever combo: **{item1}** and **{item2}**.`,
		`{user}'s twin attack landed solidly - **{item1}** and **{item2}** struck {target} in quick succession.`,
		`{target} took a heavy hit from {user}'s two-item throw: **{item1}**, then **{item2}**.`,
		`{user} surprised {target} with a one-two punch: **{item1}** and **{item2}**.`,
	],
	threeItem: [
		`{user} rolled a critical hit and unleashed **{item1}**, **{item2}**, and **{item3}** on {target} for massive damage.`,
		`{user} fired off a full combo: **{item1}**, **{item2}**, and **{item3}**. {target} couldn't react in time.`,
		`{target} was overwhelmed by {user}'s rapid barrage of **{item1}**, **{item2}**, and **{item3}**.`,
		`{user} scored a perfect throw and pelted {target} with **{item1}**, **{item2}**, and **{item3}**.`,
		`{user} delivered a devastating critical hit - all three items hit their mark: **{item1}**, **{item2}**, and **{item3}**. {target} stood no chance.`,
	],
};
