function plopFunction(
	/** @type {import('plop').NodePlopAPI} */
	plop
) {
	plop.setHelper("ifOr", function (a, b, options) {
		if (a || b) {
			return options.fn(this);
		}

		return options.inverse(this);
	});
	plop.setGenerator("component", {
		description: "Create a component",
		prompts: [
			{
				type: "input",
				name: "name",
				message: "Component name:",
			},
			{
				type: "confirm",
				default: false,
				message: "With children",
				name: "children",
			},
			{
				type: "confirm",
				default: true,
				message: "With classname",
				name: "className",
			},
			{
				type: "confirm",
				default: false,
				message: "Is Aria component",
				name: "aria",
			},
		],
		actions: [
			{
				type: "add",
				templateFile: "templates/component/exports.hbs",
				path: "src/components/{{#if aria}}aria/{{/if}}{{ properCase name }}/index.ts",
			},
			{
				type: "add",
				templateFile: "templates/component/stories.hbs",
				path: "src/components/{{#if aria}}aria/{{/if}}{{ properCase name }}/{{ properCase name }}.stories.tsx",
			},
			{
				type: "add",
				templateFile: "templates/component/styling.hbs",
				path: "src/components/{{#if aria}}aria/{{/if}}{{ properCase name }}/{{ properCase name }}.module.scss",
			},
			{
				type: "add",
				templateFile: "templates/component/typescript.hbs",
				path: "src/components/{{#if aria}}aria/{{/if}}{{ properCase name }}/{{ properCase name }}.tsx",
			},
		],
	});
	plop.setGenerator("page", {
		description: "Creates a page",
		prompts: [
			{
				type: "input",
				name: "name",
				message: "Page name:",
			},
			{
				type: "input",
				message: "Path",
				name: "path",
			},
			{
				type: "confirm",
				default: true,
				message: "With serverside props",
				name: "ssr",
			},
		],
		actions: [
			{
				type: "add",
				templateFile: "templates/page.hbs",
				path: "src/pages/{{ path }}",
			},
		],
	});
}

module.exports = plopFunction;
