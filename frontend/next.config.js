/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [{ hostname: "placekitten.com", protocol: "https" }],
	},
	reactStrictMode: true,
	async rewrites() {
		return [
			{
				destination: `${process.env.API_URL}/:path*`,
				source: "/api/:path*",
			},
		];
	},
	swcMinify: true,
	webpack(config) {
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
				type: "asset", // *.svg?url
			},
			{
				issuer: /\.[jt]sx?$/,
				resourceQuery: { not: [/url/] },
				test: /\.svg$/i, // exclude react component if *.svg?url
				use: ["@svgr/webpack"],
			},
		];

		return config;
	},
};

module.exports = nextConfig;
