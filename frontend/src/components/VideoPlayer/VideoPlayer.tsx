import { FC, useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import Hls, { Level } from "hls.js";

import Button from "components/Button";
import HlsPlayer from "components/HlsPlayer";
import Icon from "components/Icon";
import ProgressBar from "components/ProgressBar";
import TimeDisplay from "components/TimeDisplay";
import { IVideo } from "types/video";
import getVideoThumbnail from "utils/getVideoThumbnail";

interface VideoPlayerProps {
	video: IVideo;
}

enum VideoState {
	ENDED = "ENDED",
	NOT_STARTED = "NOT_STARTED",
	PAUSED = "PAUSED",
	PLAYING = "PLAYING",
}

const VideoPlayer: FC<VideoPlayerProps> = ({ video }) => {
	const { id } = video;
	const containerRef = useRef<HTMLDivElement>(null);
	const videoRef = useRef<HTMLVideoElement>(null);

	const [fullscreen, setFullscreen] = useState<boolean>(false);
	const [mute, setMute] = useState<boolean>(false);
	const [playState, setPlayState] = useState<VideoState>(
		VideoState.NOT_STARTED
	);
	const [showControls, setShowControls] = useState<boolean>(true);
	const [showSettings, setShowSettings] = useState<boolean>(false);
	const [currentTime, setCurrentTime] = useState<number>(0);

	const [timer, setTimer] = useState<NodeJS.Timer | null>(null);

	const [levels, setLevels] = useState<Level[]>([]);
	const [level, setLevel] = useState<number>(-1);
	const [hls, setHls] = useState<Hls>();

	useEffect(() => {
		if (hls) {
			hls.currentLevel = level;
			setShowSettings(false);
		}
	}, [hls, level]);

	const cancelTimer = () => {
		if (timer !== null) {
			clearTimeout(timer);
		}
	};

	const toggleFullscreenState = useCallback(() => {
		if (containerRef.current) {
			if (document.fullscreenElement === null) {
				containerRef.current
					.requestFullscreen()
					.catch(() => console.log("Fullscreen denied"));
			} else if (document.fullscreenElement?.nodeName) {
				document.exitFullscreen();
			}
		}
	}, []);

	const toggleMuteState = useCallback(() => {
		if (videoRef.current) {
			videoRef.current.muted = !videoRef.current.muted;
		}
	}, []);

	const togglePlayState = useCallback(() => {
		if (videoRef.current) {
			if (videoRef.current.paused) {
				videoRef.current.play();
			} else {
				videoRef.current.pause();
			}
		}
	}, []);

	const onKeyPress = useCallback(
		(e: KeyboardEvent) => {
			e.preventDefault();

			switch (e.code) {
				case "KeyF":
					toggleFullscreenState();
					break;
				case "KeyM":
					toggleMuteState();
					break;
				case "Space":
					togglePlayState();
					break;
			}
		},
		[toggleFullscreenState, toggleMuteState, togglePlayState]
	);

	const onFullscreenChange = () => {
		setFullscreen(document.fullscreenElement !== null);
	};

	const restartTimer = useCallback(() => {
		if (!showControls) {
			setShowControls(true);
		}

		cancelTimer();

		if (
			playState !== VideoState.NOT_STARTED &&
			playState !== VideoState.PAUSED
		) {
			setTimer(
				setTimeout(() => {
					if (!showSettings) {
						setShowControls(false);
					}
				}, 1e3)
			);
		}
	}, [playState, timer, showControls, showSettings, cancelTimer]);

	const onPlay = () => {
		if (videoRef.current) {
			setPlayState(
				videoRef.current.paused ? VideoState.PAUSED : VideoState.PLAYING
			);

			if (videoRef.current.paused) {
				setShowControls(true);
			} else {
				cancelTimer();

				setTimer(
					setTimeout(() => {
						if (!showSettings) {
							setShowControls(false);
						}
					}, 1e3)
				);
			}
		}
	};

	const onVolumeChange = () => {
		if (videoRef.current) {
			setMute(videoRef.current.muted);
		}
	};

	const onTimeUpdate = () => {
		if (videoRef.current) {
			setCurrentTime(videoRef.current.currentTime);
		}
	};

	const onEnded = () => {
		if (videoRef.current) {
			setPlayState(VideoState.ENDED);
		}
	};

	useEffect(() => {
		document.addEventListener("fullscreenchange", onFullscreenChange);
		document.addEventListener("keypress", onKeyPress);

		return () => {
			document.removeEventListener(
				"fullscreenchange",
				onFullscreenChange
			);
			document.removeEventListener("keypress", onKeyPress);
		};
	}, [onKeyPress, toggleFullscreenState, togglePlayState]);

	return (
		<div
			ref={containerRef}
			className="group relative aspect-video w-full overflow-hidden"
		>
			<HlsPlayer
				ref={videoRef}
				className="absolute top-0 bottom-0 z-0 h-full w-full "
				src={`/api/videos/${id}/stream/master.m3u8`}
				poster={getVideoThumbnail(video, 1280)}
				onManifestLoad={(manifest) => setLevels(manifest.levels)}
				onHlsLoad={setHls}
				playsInline
				onClick={togglePlayState}
				onDoubleClick={toggleFullscreenState}
				onPlay={onPlay}
				onPause={onPlay}
				onVolumeChange={onVolumeChange}
				onTimeUpdate={onTimeUpdate}
				onEnded={onEnded}
				onMouseMove={restartTimer}
			/>
			<div
				className={clsx(
					"absolute -bottom-28 z-10 flex h-28 w-full flex-col items-stretch justify-end bg-opacity-50 bg-gradient-to-t from-black to-transparent text-white transition-all",
					showControls && "!-bottom-0"
				)}
				onMouseLeave={restartTimer}
				onMouseEnter={cancelTimer}
			>
				{videoRef.current && (
					<div
						className="group/progress mx-4 cursor-pointer pt-2"
						onClick={(e) =>
							videoRef.current
								? (videoRef.current.currentTime =
										(e.nativeEvent.offsetX /
											e.currentTarget.clientWidth) *
										videoRef.current.duration)
								: null
						}
					>
						<ProgressBar
							className="h-1 w-full transition-all group-hover/progress:h-2"
							minValue={0}
							maxValue={videoRef.current.duration}
							value={currentTime}
							underlayValue={
								videoRef.current?.buffered.length > 0
									? videoRef.current?.buffered.end(0)
									: undefined
							}
							label="Progress"
						/>
					</div>
				)}
				<div className="flex h-16 w-full items-center justify-between">
					<div className="flex h-full items-center">
						<Button
							onPress={togglePlayState}
							className="h-full p-3 pl-6"
							title={
								playState === VideoState.ENDED
									? "Replay"
									: playState === VideoState.PLAYING
									? "Pause"
									: "Play"
							}
						>
							<Icon
								className="aspect-square h-full"
								variant={
									playState === VideoState.ENDED
										? "replay"
										: playState === VideoState.PLAYING
										? "pause"
										: "play"
								}
							/>
						</Button>
						<Button
							onPress={toggleMuteState}
							className="h-full p-3"
						>
							<Icon
								className="aspect-square h-full"
								variant={mute ? "volume_mute" : "volume_up"}
							/>
						</Button>
						<p className="mx-2">
							<TimeDisplay value={currentTime} />
							<span className="mx-2">/</span>
							<TimeDisplay
								value={
									videoRef.current?.duration || video.duration
								}
							/>
						</p>
					</div>
					<div className="flex h-full items-center">
						<div className="group/settings relative h-full p-3">
							<Button
								onPress={() => setShowSettings(!showSettings)}
								className="h-full"
							>
								<Icon
									className={clsx(
										"aspect-square h-full transition-transform",
										showSettings
											? "rotate-[30deg]"
											: "rotate-0"
									)}
									variant="settings"
								/>
							</Button>
							{levels && (
								<ul
									className={clsx(
										"absolute bottom-[125%] left-[50%] hidden min-w-full translate-x-[-50%] rounded-md bg-black bg-opacity-60",
										showSettings && "!block"
									)}
								>
									{levels.map((_level, i) => (
										<li key={i}>
											<Button
												className={clsx(
													"w-full px-4 py-2 text-center",
													level === i &&
														"bg-white text-black"
												)}
												onPress={() => setLevel(i)}
											>
												{_level.height + "p"}
											</Button>
										</li>
									))}
									<li>
										<Button
											className="w-full px-4 py-2 text-center"
											onPress={() => setLevel(-1)}
										>
											Auto
										</Button>
									</li>
								</ul>
							)}
						</div>
						<Button
							className="h-full p-3 pr-7"
							onPress={toggleFullscreenState}
						>
							<Icon
								className="aspect-square h-full"
								variant={
									fullscreen
										? "fullscreen_exit"
										: "fullscreen_open"
								}
							/>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default VideoPlayer;
