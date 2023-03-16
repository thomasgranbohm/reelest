import child_process from "child_process";
import ffmpegPath from "ffmpeg-static";
import util from "util";

export const generateStreamFiles = async (
	source: string,
	destination: string
) => {
	const command = util.format(
		"%s -i %s -c:v libx264 -crf 21 -preset veryfast -c:a aac -b:a 128k -ac 2 -f hls -hls_time 4 -hls_playlist_type event %s -y",
		ffmpegPath,
		source,
		destination
	);

	console.debug(command);
	await new Promise((res, rej) =>
		child_process.exec(command, (err, _, stderr) => {
			if (err) {
				console.error("Error while generating stream: %s", stderr);
				return rej(err);
			}
			res(true);
		})
	);

	return true;
};
