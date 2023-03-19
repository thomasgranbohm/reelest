/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./src/**/*.{js,ts,jsx,tsx}"],
	plugins: [],
	safelist: [
		{
			pattern: /ml-\d{1,2}\/12/,
			variants: ["sm", "md", "lg", "xl", "2xl"],
		},
		{ pattern: /w-\d{1,2}\/12/, variants: ["sm", "md", "lg", "xl", "2xl"] },
	],
	theme: {
		extend: {
			margin: {
				"1/12": "8.33%",
				"10/12": "83.33%",
				"11/12": "91.66%",
				"12/12": "100%",
				"2/12": "16.66%",
				"3/12": "25%",
				"4/12": "33.33%",
				"5/12": "41.66%",
				"6/12": "50%",
				"7/12": "58.34%",
				"8/12": "66.66%",
				"9/12": "75%",
			},
		},
	},
};
