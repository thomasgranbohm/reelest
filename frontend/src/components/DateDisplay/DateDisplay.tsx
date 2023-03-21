import { FC } from "react";
import { useDateFormatter, useLocale } from "react-aria";

import { WithClassname } from "types/components";

// Stolen from https://stackoverflow.com/questions/6108819/javascript-timestamp-to-relative-time
const units: Partial<Record<Intl.RelativeTimeFormatUnit, number>> = {
	day: 24 * 60 * 60 * 1000,
	hour: 60 * 60 * 1000,
	minute: 60 * 1000,
	month: (24 * 60 * 60 * 1000 * 365) / 12,
	second: 1000,
	year: 24 * 60 * 60 * 1000 * 365,
};

const DateDisplay: FC<DateDisplayProps> = ({ className, date, relative }) => {
	const { locale } = useLocale();

	const _date = new Date(
		new Date(date).toLocaleString("en-us", {
			timeZone: "UTC",
		})
	);

	const rtf = new Intl.RelativeTimeFormat(locale, {
		localeMatcher: "best fit",
		numeric: "always",
		style: "long",
	});

	const getRelativeTime = (
		d1: Date,
		d2 = new Date(new Date().toLocaleString("en-US", { timeZone: "UTC" }))
	) => {
		const elapsed = d1.getTime() - d2.getTime();

		for (const [k, v] of Object.entries(units)) {
			if (Math.abs(elapsed) > v || k == "second") {
				return rtf.format(
					Math.round(elapsed / v),
					k as Intl.RelativeTimeFormatUnit
				);
			}
		}
	};

	const ltf = useDateFormatter();

	return (
		<div className={className}>
			<time dateTime={_date.toISOString()}>
				{relative ? getRelativeTime(_date) : ltf.format(_date)}
			</time>
		</div>
	);
};

interface DateDisplayProps extends WithClassname {
	date: string;
	relative?: boolean;
}

export default DateDisplay;
