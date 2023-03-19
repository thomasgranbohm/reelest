import { FC, ReactElement } from "react";
import {
	FocusRing as AriaFocusRing,
	useFocusRing as useAriaFocusRing,
} from "react-aria";

export const useFocusRing = () => {
	const { focusProps, isFocusVisible, isFocused } = useAriaFocusRing();

	return {
		focusProps,
		focusVisibleClass: isFocusVisible && "focus-ring",
		isFocusVisible,
		isFocused,
	};
};

const FocusRing: FC<FocusRingProps> = ({ children }) => {
	return (
		<AriaFocusRing focusRingClass="focus-ring">{children}</AriaFocusRing>
	);
};

interface FocusRingProps {
	children: ReactElement;
}

export default FocusRing;
