import { FC } from "react";
import { useNumberFormatter } from "react-aria";

import { WithClassname } from "types/components";

const NumberDisplay: FC<NumberDisplayProps> = ({
	className,
	value,
	...options
}) => {
	const formatter = useNumberFormatter(options);

	return <span className={className}>{formatter.format(value)}</span>;
};

interface NumberDisplayProps extends WithClassname, Intl.NumberFormatOptions {
	value: number;
}

export default NumberDisplay;
