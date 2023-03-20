import { FC, SVGAttributes } from "react";

import FullscreenExitSVG from "assets/icons/fullscreen_exit.svg";
import FullscreenOpenSVG from "assets/icons/fullscreen_open.svg";
import PauseSVG from "assets/icons/pause.svg";
import PlaySVG from "assets/icons/play.svg";
import ReplaySVG from "assets/icons/replay.svg";
import SettingsSVG from "assets/icons/settings.svg";
import VolumeMuteSVG from "assets/icons/volume_mute.svg";
import VolumeOffSVG from "assets/icons/volume_off.svg";
import VolumeUpSVG from "assets/icons/volume_up.svg";
import { WithClassname } from "types/components";

const Icon: FC<IconProps> = ({ className, variant, ...props }) => {
	let Element;

	switch (variant) {
		case "fullscreen_exit":
			Element = FullscreenExitSVG;
			break;
		case "fullscreen_open":
			Element = FullscreenOpenSVG;
			break;
		case "pause":
			Element = PauseSVG;
			break;
		case "play":
			Element = PlaySVG;
			break;
		case "replay":
			Element = ReplaySVG;
			break;
		case "settings":
			Element = SettingsSVG;
			break;
		case "volume_mute":
			Element = VolumeMuteSVG;
			break;
		case "volume_off":
			Element = VolumeOffSVG;
			break;
		case "volume_up":
			Element = VolumeUpSVG;
			break;
	}

	return <Element {...props} className={className} />;
};

interface IconProps extends WithClassname, SVGAttributes<SVGElement> {
	variant:
		| "fullscreen_exit"
		| "fullscreen_open"
		| "pause"
		| "play"
		| "replay"
		| "settings"
		| "volume_mute"
		| "volume_mute"
		| "volume_off"
		| "volume_up";
}

export default Icon;
