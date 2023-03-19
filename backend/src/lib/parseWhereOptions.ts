const parseWhereOptions = <T>(obj: T): T => {
	return Object.fromEntries(
		Object.entries(obj)
			.map((obj) =>
				typeof obj[1] === "object"
					? [[obj[0]], parseWhereOptions(obj[1])]
					: obj
			)
			.filter(
				([, v]) =>
					v !== null &&
					(typeof v !== "object" || Object.keys(v).length > 0)
			)
	);
};

export default parseWhereOptions;
