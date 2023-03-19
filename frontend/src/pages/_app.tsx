import { SSRProvider } from "react-aria";
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
			<main className={ubuntuFont.className}>
				<Component {...pageProps} />
			</main>
		</SSRProvider>
	);
}

export default CustomApp;
