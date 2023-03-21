import { forwardRef, useEffect, useState, VideoHTMLAttributes } from "react";
import Hls, { HlsConfig, ManifestParsedData } from "hls.js";

export interface HlsPlayerProps extends VideoHTMLAttributes<HTMLVideoElement> {
	hlsConfig?: Partial<HlsConfig>;
	onHlsLoad?: (hls: Hls) => void;
	onManifestLoad?: (manifest: ManifestParsedData) => void;
	src: string;
}

const HlsPlayer = forwardRef<HTMLVideoElement, HlsPlayerProps>(
	(
		{ autoPlay, hlsConfig, onHlsLoad, onManifestLoad, src, ...props },
		ref
	) => {
		const [hls, setHls] = useState<Hls>();

		useEffect(() => {
			if (!Hls.isSupported()) {
				return;
			}

			if (hls) {
				return;
			}

			const newHandler = new Hls({
				enableWorker: true,
				...hlsConfig,
			});

			newHandler.on(Hls.Events.MEDIA_ATTACHED, () => {
				newHandler.loadSource(src);

				if (onHlsLoad) {
					onHlsLoad(newHandler);
				}
			});

			newHandler.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
				if (onManifestLoad) {
					onManifestLoad(data);
				}
			});

			newHandler.on(Hls.Events.ERROR, (_, data) => {
				if (data.fatal) {
					switch (data.type) {
						case Hls.ErrorTypes.NETWORK_ERROR:
							newHandler.startLoad();
							break;
						case Hls.ErrorTypes.MEDIA_ERROR:
							newHandler.recoverMediaError();
							break;
						default:
							console.error(data);
							break;
					}
				}
			});

			if (ref !== null && "current" in ref && ref.current !== null) {
				newHandler.attachMedia(ref.current);
			}

			setHls(newHandler);
		}, [src, hlsConfig, hls, ref, onHlsLoad]);

		if (typeof window !== "undefined" && Hls.isSupported()) {
			return <video ref={ref} {...props} />;
		}

		console.log("Regular ass video player");

		return <video ref={ref} src={src} autoPlay={autoPlay} {...props} />;
	}
);

HlsPlayer.displayName = "HlsPlayer";

export default HlsPlayer;
