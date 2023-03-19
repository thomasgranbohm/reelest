const path = require("path");
const webpack = require("webpack");

const config = {
	addons: [
		"@storybook/addon-links",
		"@storybook/addon-essentials",
		"@storybook/addon-a11y",
		{
			name: "storybook-addon-next",
			options: {
				nextConfigPath: path.resolve(__dirname, "../next.config.js"),
			},
		},
	],
	core: { builder: "webpack5" },
	reactOptions: {
		fastRefresh: true,
	},
	staticDirs: ["../public"],
	stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)"],
	typescript: {
		reactDocgen: false,
	},
	webpackFinal: async (config) => {
		config.plugins?.push(
			new webpack.ProvidePlugin({
				Buffer: ["buffer", "Buffer"],
			})
		);

		if (config?.module?.rules) {
			const fileLoaderRule = config.module.rules.find(
				(rule) => rule.test && rule.test.test(".svg")
			);

			if (fileLoaderRule) {
				fileLoaderRule.exclude = /\.svg$/;
			}

			config.module.rules = [
				...config.module.rules,
				{
					resourceQuery: /url/,
					test: /\.svg$/i,
					type: "asset",
				},
				{
					issuer: /\.[jt]sx?$/,
					resourceQuery: { not: [/url/] },
					test: /\.svg$/i,
					use: ["@svgr/webpack"],
				},
			];
		}

		config.resolve?.modules?.push("..");

		return config;
	},
};

module.exports = config;
