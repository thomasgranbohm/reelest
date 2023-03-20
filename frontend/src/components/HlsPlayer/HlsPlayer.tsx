import { forwardRef, useEffect, useState, VideoHTMLAttributes } from "react";
import Hls, { HlsConfig, ManifestParsedData } from "hls.js";

export interface HlsPlayerProps extends VideoHTMLAttributes<HTMLVideoElement> {
	hlsConfig?: Partial<HlsConfig>;
	onManifestLoad?: (manifest: ManifestParsedData) => void;
	src: string;
}

const HlsPlayer = forwardRef<HTMLVideoElement, HlsPlayerProps>(
	({ autoPlay, hlsConfig, onManifestLoad, src, ...props }, ref) => {
		const [hls, setHls] = useState<Hls>();

		useEffect(() => {
			function initPlayer() {
				if (hls !== null && hls !== undefined) {
					hls.destroy();
				}

				const newHls = new Hls({
					enableWorker: false,
					...hlsConfig,
				});

				newHls.on(Hls.Events.MEDIA_ATTACHED, () => {
					newHls.loadSource(src);

					newHls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
						if (onManifestLoad) {
							onManifestLoad(data);
						}

						if (autoPlay) {
							if (
								ref !== null &&
								"current" in ref &&
								ref.current !== null
							) {
								ref.current
									?.play()
									.catch(() =>
										console.log("Could not autoplay")
									);
							}
						}
					});
				});

				newHls.on(Hls.Events.ERROR, function (_, data) {
					if (data.fatal) {
						switch (data.type) {
							case Hls.ErrorTypes.NETWORK_ERROR:
								newHls.startLoad();
								break;
							case Hls.ErrorTypes.MEDIA_ERROR:
								newHls.recoverMediaError();
								break;
							default:
								initPlayer();
								break;
						}
					}
				});

				setHls(newHls);
			}

			if (Hls.isSupported()) {
				initPlayer();
			}

			return () => {
				if (hls !== null && hls !== undefined) {
					hls.destroy();
				}
			};
		}, [src, autoPlay, hlsConfig]);

		useEffect(() => {
			if (
				hls &&
				ref !== null &&
				"current" in ref &&
				ref.current !== null
			) {
				hls.attachMedia(ref.current);
			}
		}, [hls, ref]);

		if (typeof window !== "undefined" && Hls.isSupported()) {
			return <video ref={ref} {...props} />;
		}

		return <video ref={ref} src={src} autoPlay={autoPlay} {...props} />;
	}
);

HlsPlayer.displayName = "HlsPlayer";

export default HlsPlayer;
