import { useState } from "react";
import { publicAPI } from "api";
import axios, { isAxiosError } from "axios";
import { Form, Formik } from "formik";
import { NextPage } from "next";
import { useRouter } from "next/router";
import * as Yup from "yup";

import Heading from "components/Heading";
import TextField from "components/TextField";

const RegisterSchema = Yup.object().shape({
	displayName: Yup.string()
		.min(4, "Too short")
		.max(48, "Too long")
		.matches(
			/^(?=.{4,48}$)(?!.*[ -]{2})[a-zA-Z][a-zA-Z0-9 -]*[a-zA-Z0-9]$/,
			"Invalid display name"
		)
		.required("Display name is required"),
	email: Yup.string().email("Invalid email").required("Email is required"),
	password: Yup.string()
		.matches(/^[a-zA-Z0-9]{3,30}$/, "Invalid password")
		.required("Password is required"),
	username: Yup.string()
		.min(3, "Too short")
		.max(30, "Too long")
		.matches(/^[a-zA-Z0-9_-]+$/, "Invalid username")
		.required("Username is required"),
});

const RegisterPage: NextPage<RegisterPageProps> = () => {
	const router = useRouter();
	const [error, setError] = useState<string>();

	console.log(error);

	return (
		<section className="mx-auto max-w-2xl">
			<Heading type="h1">Register</Heading>
			<Formik
				initialValues={{
					confirmPassword: "",
					displayName: "",
					email: "",
					password: "",
					username: "",
				}}
				onSubmit={async (e) => {
					try {
						setError("");

						const { status } = await publicAPI.post(
							"/users/register",
							e
						);

						if (status !== 201) {
							throw new Error("Something went wrong");
						}

						router.push("/login");
					} catch (error) {
						if (isAxiosError(error)) {
							if (error.response) {
								return setError(
									error.response.data.error.details
								);
							}
						}

						setError(JSON.stringify(error));
					}
				}}
				validationSchema={RegisterSchema}
			>
				{({ errors, touched }) => (
					<Form>
						<TextField
							label="Username"
							name="username"
							type="text"
							errorMessage={touched.username && errors.username}
							isRequired
						/>
						<TextField
							label="Email"
							name="email"
							type="email"
							errorMessage={touched.email && errors.email}
							isRequired
						/>
						<TextField
							label="Display name"
							name="displayName"
							type="text"
							errorMessage={
								touched.displayName && errors.displayName
							}
							isRequired
						/>
						<TextField
							label="Password"
							name="password"
							type="password"
							errorMessage={touched.password && errors.password}
							isRequired
						/>
						<TextField
							label="Confirm password"
							name="confirmPassword"
							type="password"
							errorMessage={
								touched.confirmPassword &&
								errors.confirmPassword
							}
							isRequired
						/>
						<button
							className="mt-4 rounded-md bg-violet-500 py-4 px-8 text-lg font-bold text-white transition-colors hover:bg-violet-700"
							type="submit"
						>
							Register
						</button>
						{error && (
							<p className="mt-4 text-base text-red-600">
								{error}
							</p>
						)}
					</Form>
				)}
			</Formik>
		</section>
	);
};

interface RegisterPageProps {
	// Remove me
}

export default RegisterPage;
