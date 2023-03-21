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
		underlayValue,
		value = 0,
	} = props;
	const { labelProps, progressBarProps } = useProgressBar(props);

	const percentage = (value - minValue) / (maxValue - minValue);
	const barWidth = `${Math.round(percentage * 100)}%`;
	const underlayPercentage =
		underlayValue && (underlayValue - minValue) / (maxValue - minValue);
	const underlayWidth =
		underlayPercentage && `${Math.round(underlayPercentage * 100)}%`;

	return (
		<div {...progressBarProps} className={className}>
			<VisuallyHidden>
				{label && <span {...labelProps}>{label}</span>}
				{showValueLabel && (
					<span>{progressBarProps["aria-valuetext"]}</span>
				)}
			</VisuallyHidden>
			<div className="relative h-full w-full rounded-md bg-black bg-opacity-20">
				<div
					className="absolute z-10 h-full rounded-md bg-white"
					style={{ width: barWidth }}
				/>
				{underlayValue && (
					<div
						className="absolute z-0 h-full rounded-md bg-white bg-opacity-40"
						style={{ width: underlayWidth }}
					/>
				)}
			</div>
		</div>
	);
};

interface ProgressBarProps extends WithClassname, AriaProgressBarProps {
	underlayValue?: number;
}

export default ProgressBar;
