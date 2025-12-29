import { useState } from "react";
import { publicAPI } from "api";
import axios, { isAxiosError } from "axios";
import { Form, Formik } from "formik";
import { NextPage } from "next";
import { useRouter } from "next/router";
import * as Yup from "yup";

import Heading from "components/Heading";
import TextField from "components/TextField";

const LoginSchema = Yup.object().shape({
	identifier: Yup.string()
		.matches(/^[^\s\t]+$/)
		.required("Identifier is required"),
	password: Yup.string().required("Password is required"),
});

const LoginPage: NextPage<LoginPageProps> = () => {
	const router = useRouter();
	const [error, setError] = useState<string>();

	return (
		<section className="mx-auto max-w-2xl">
			<Heading type="h1">Login</Heading>
			<Formik
				initialValues={{
					identifier: "",
					password: "",
				}}
				onSubmit={async (e) => {
					try {
						setError("");

						const { data, status } = await publicAPI.post(
							"/users/login",
							e
						);

						console.log(data, status);

						if (status >= 400) {
							throw new Error("Something went wrong");
						}

						document.cookie = `token=${data.data.token}`;

						router.push("/");
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
				validationSchema={LoginSchema}
			>
				{({ errors, touched }) => (
					<Form>
						<TextField
							label="Identifier"
							name="identifier"
							type="text"
							description="Identifier can be either email or username"
							errorMessage={
								touched.identifier && errors.identifier
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
						<button
							className="mt-4 rounded-md bg-violet-500 py-4 px-8 text-lg font-bold text-white transition-colors hover:bg-violet-700"
							type="submit"
						>
							Login
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

interface LoginPageProps {
	// Remove me
}

export default LoginPage;
