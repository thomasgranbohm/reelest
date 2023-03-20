import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useProgressBar } from "react-aria";
import clsx from "clsx";

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
	const [show, setShow] = useState<boolean>(true);
	const [currentTime, setCurrentTime] = useState<number>(0);

	const [timer, setTimer] = useState<NodeJS.Timer | null>(null);

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

	const onMouseMove = useCallback(() => {
		if (!show) {
			setShow(true);
		}

		if (timer !== null) {
			clearTimeout(timer);
		}

		if (playState !== VideoState.NOT_STARTED) {
			setTimer(setTimeout(() => setShow(false), 1e3));
		}
	}, [show, timer, playState]);

	const onPlay = () => {
		if (videoRef.current) {
			setPlayState(
				videoRef.current.paused ? VideoState.PAUSED : VideoState.PLAYING
			);
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
			onMouseMove={onMouseMove}
		>
			<HlsPlayer
				ref={videoRef}
				className="absolute top-0 bottom-0 z-0 h-full w-full "
				src={`/api/videos/${id}/stream/master.m3u8`}
				poster={getVideoThumbnail(video, 1920)}
				onManifestLoad={console.log}
				playsInline
				onClick={togglePlayState}
				onDoubleClick={toggleFullscreenState}
				onPlay={onPlay}
				onPause={onPlay}
				onVolumeChange={onVolumeChange}
				onTimeUpdate={onTimeUpdate}
				onEnded={onEnded}
			/>
			<div
				className={clsx(
					"absolute -bottom-28 z-10 h-28 w-full bg-opacity-50 bg-gradient-to-t from-black to-transparent  pt-4 text-white transition-all",
					show && "!-bottom-4"
				)}
			>
				<div className="flex h-16 w-full items-center justify-between">
					<div className="p flex h-full items-center">
						<Button
							onPress={togglePlayState}
							className="aspect-square h-full p-3"
							title={
								playState === VideoState.ENDED
									? "Replay"
									: playState === VideoState.PLAYING
									? "Pause"
									: "Play"
							}
						>
							<Icon
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
							className="aspect-square h-full p-3"
						>
							<Icon
								variant={mute ? "volume_mute" : "volume_up"}
							/>
						</Button>
						{videoRef.current &&
							!isNaN(videoRef.current.duration) && (
								<p className="mx-2">
									<TimeDisplay value={currentTime} />
									<span className="mx-2">/</span>
									<TimeDisplay
										value={videoRef.current.duration}
									/>
								</p>
							)}
					</div>
					<div className="flex h-full items-center">
						<Icon
							className="aspect-square h-full p-4"
							variant="settings"
						/>
						<Button
							className="aspect-square h-full p-3"
							onPress={toggleFullscreenState}
						>
							<Icon
								variant={
									fullscreen
										? "fullscreen_exit"
										: "fullscreen_open"
								}
							/>
						</Button>
					</div>
				</div>
				{videoRef.current && (
					<ProgressBar
						className="h-1 w-full px-4"
						minValue={0}
						maxValue={videoRef.current.duration}
						value={currentTime}
						label="Progress"
					/>
				)}
			</div>
		</div>
	);
};

export default VideoPlayer;
