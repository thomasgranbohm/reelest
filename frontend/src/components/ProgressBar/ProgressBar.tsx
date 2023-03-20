import { FC } from "react";
import {
	AriaProgressBarProps,
	useProgressBar,
	VisuallyHidden,
} from "react-aria";

import { WithClassname } from "types/components";

const ProgressBar: FC<ProgressBarProps> = ({ className, ...props }) => {
	const {
		label,
		maxValue = 0,
		minValue = 100,
		showValueLabel = !!label,
		value = 0,
	} = props;
	const { labelProps, progressBarProps } = useProgressBar(props);

	const percentage = (value - minValue) / (maxValue - minValue);
	const barWidth = `${Math.round(percentage * 100)}%`;

	return (
		<div {...progressBarProps} className={className}>
			<VisuallyHidden>
				{label && <span {...labelProps}>{label}</span>}
				{showValueLabel && (
					<span>{progressBarProps["aria-valuetext"]}</span>
				)}
			</VisuallyHidden>
			<div className="relative h-full w-full rounded-md bg-gray-500">
				<div
					className="absolute h-full rounded-md bg-white"
					style={{ width: barWidth }}
				/>
			</div>
		</div>
	);
};

interface ProgressBarProps extends WithClassname, AriaProgressBarProps {
	// Remove me
}

export default ProgressBar;
