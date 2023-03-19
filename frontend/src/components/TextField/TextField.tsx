import { FC, useRef } from "react";
import {
	AriaTextFieldProps,
	mergeProps,
	useTextField,
	VisuallyHidden,
} from "react-aria";
import clsx from "clsx";
import { Field, useField } from "formik";

import FocusRing, { useFocusRing } from "components/FocusRing";
import Typography from "components/Typography";
import { WithClassname } from "types/components";

import classes from "./TextField.module.scss";

const TextField: FC<TextFieldProps> = ({ className, ...props }) => {
	const { description, errorMessage, label } = props;
	const ref = useRef(null);
	const { descriptionProps, errorMessageProps, inputProps, labelProps } =
		useTextField(props, ref);

	const [field, meta] = useField({ ...inputProps, name: props.name });

	return (
		<div className={"mt-4 flex w-full flex-col"}>
			<label {...labelProps} className="font-medium">
				{label}
				{props.isRequired && (
					<span className="ml-1 select-none text-red-600" aria-hidden>
						*
					</span>
				)}
			</label>
			<FocusRing>
				<input
					{...mergeProps(inputProps, field)}
					ref={ref}
					className={
						"mt-2 rounded-md border-2 border-solid p-3 transition-[border-color] hover:border-gray-400"
					}
				/>
			</FocusRing>
			{description && (
				<p {...descriptionProps} className="mt-2 text-sm">
					{description}
				</p>
			)}
			{meta.touched && meta.error && errorMessage && (
				<p {...errorMessageProps} className="mt-2 text-sm text-red-600">
					{errorMessage}
				</p>
			)}
		</div>
	);
};

interface TextFieldProps extends WithClassname, AriaTextFieldProps {
	name: string;
}

export default TextField;
