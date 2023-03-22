import { ProfilePicture, User, Video } from "@prisma/client";

import config from "../config";

type TransformedProfilePictures = Partial<
	Record<keyof typeof config.ffmpeg.profiles, Partial<ProfilePicture>>
>;

interface TransformedUser extends Partial<User> {
	profilePictures?: TransformedProfilePictures;
}

interface UntransformedUser extends Partial<User> {
	profilePictures?: Partial<ProfilePicture>[];
}

export const transformUser = <T extends UntransformedUser>(
	_user: T
): TransformedUser => {
	const user = { ..._user } as unknown as TransformedUser;

	if (_user.profilePictures) {
		const KV = Object.entries(config.ffmpeg.profiles);

		user.profilePictures = Object.fromEntries(
			_user.profilePictures.map((picture) => [
				KV.find(([, v]) => picture.width === v.size)[0],
				picture,
			])
		);
	}

	return user;
};

interface TransformedVideo extends Partial<Video> {
	user?: TransformedUser;
}

interface UntransformedVideo extends Partial<Video> {
	user?: UntransformedUser;
}

export const transformVideo = <T extends UntransformedVideo>(_video: T) => {
	const video = { ..._video } as unknown as TransformedVideo;

	if (_video.user) {
		video.user = transformUser(_video.user);
	}

	return video;
};
