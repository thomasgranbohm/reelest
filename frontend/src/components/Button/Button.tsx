import { ButtonHTMLAttributes, FC, useRef } from "react";
import { AriaButtonProps, useButton } from "react-aria";

import { WithClassname } from "types/components";

const Button: FC<ButtonProps> = ({
	children,
	className,
	onPress,
	...props
}) => {
	const ref = useRef<HTMLButtonElement>(null);

	const { buttonProps } = useButton({ onPress, ...props }, ref);

	return (
		<button {...props} {...buttonProps} className={className}>
			{children}
		</button>
	);
};

interface ButtonProps
	extends WithClassname,
		AriaButtonProps,
		Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof AriaButtonProps> {}

export default Button;
