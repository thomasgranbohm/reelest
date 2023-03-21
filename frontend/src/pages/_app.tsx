import { I18nProvider, SSRProvider } from "react-aria";
import type { AppProps } from "next/app";
import { Ubuntu } from "next/font/google";

import "styles/globals.scss";

const ubuntuFont = Ubuntu({
	fallback: ["sans-serif"],
	style: ["italic", "normal"],
	subsets: ["latin-ext"],
	weight: ["400", "500", "700"],
});

function CustomApp({ Component, pageProps }: AppProps) {
	return (
		<SSRProvider>
			<I18nProvider locale="en-FR">
				<div className={ubuntuFont.className}>
					<Component {...pageProps} />
				</div>
				{process.env.NODE_ENV !== "production" && (
					<pre>
						<code>{JSON.stringify(pageProps, null, 4)}</code>
					</pre>
				)}
			</I18nProvider>
		</SSRProvider>
	);
}

export default CustomApp;
