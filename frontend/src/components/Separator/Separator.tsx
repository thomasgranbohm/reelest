import { FC } from "react";
import { SeparatorProps as AriaSeparatorProps, useSeparator } from "react-aria";

const Separator: FC<SeparatorProps> = ({ variant, ...props }) => {
	const { separatorProps } = useSeparator(props);

	switch (variant) {
		case "dot":
			return (
				<span {...separatorProps} className="mx-2">
					•
				</span>
			);
		case "line":
			return <div {...separatorProps} className="my-2"></div>;
		default:
			return null;
	}
};

interface SeparatorProps extends AriaSeparatorProps {
	variant?: "dot" | "line";
}

export default Separator;
