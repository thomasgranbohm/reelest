import { FC } from "react";

import { WithClassname } from "types/components";

/**
 * @param value Time in seconds
 */
const TimeDisplay: FC<TimeDisplayProps> = ({ className, value }) => {
	return (
		<span className={className}>
			{new Date(value * 1e3).toLocaleTimeString("sv-SE", {
				hour: value > 60e3 ? "2-digit" : undefined,
				minute: "numeric",
				second: "2-digit",
				timeZone: "UTC",
			})}
		</span>
	);
};

interface TimeDisplayProps extends WithClassname {
	value: number;
}

export default TimeDisplay;
