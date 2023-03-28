import { Comment, ProfilePicture, Thread, User, Video } from "@prisma/client";

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

interface UntransformedComment extends Partial<Comment> {
	user?: UntransformedUser;
}

interface UntransformedThread extends Partial<Thread> {
	createdAt?: Date;
	replies?: UntransformedComment[];
	user?: UntransformedUser;
}

interface TransformedComment extends Partial<Comment> {
	userId: string;
}

interface TransformedVideoThreads {
	threads: TransformedThread[];
	users: Record<string, TransformedUser>;
}

interface TransformedThread {
	comments: TransformedComment[];
	users: Record<string, TransformedUser>;
}

const transformComment = <T extends UntransformedComment>({
	content,
	createdAt,
	id,
	replyToId,
	user,
	userId,
}: T) => {
	const comment = {
		content,
		createdAt,
		id,
		replyToId,
		userId: userId || user.id,
	} as unknown as TransformedComment;
	return comment;
};

export const transformReplies = <T extends UntransformedThread>(_thread: T) => {
	const response = {
		comments: [],
		users: {},
	} as unknown as TransformedThread;

	if (_thread.replies) {
		response.users = {
			...response.users,
			...Object.fromEntries(
				_thread.replies
					.map((_c) => _c.user)
					.map((_u) => [_u.id, transformUser(_u)])
			),
		};
		console.log(_thread.replies[0]);

		response.comments = response.comments.concat(
			..._thread.replies.map(transformComment)
		);
	}

	return response;
};

export const transformThreads = <T extends UntransformedThread[]>(
	_threads: T
): VideoThreadsResponse => {
	const response = { threads: [], users: {} } as VideoThreadsResponse;

	for (const { content, createdAt, id, user } of _threads) {
		response.users = {
			...response.users,
			[user.id]: transformUser(user),
		};
		response.threads = [
			...response.threads,
			{ content, createdAt, id, userId: user.id },
		];
	}

	return response;
};

interface ThreadBase {
	content: string;
	createdAt: Date;
	id: string;
	userId: string;
}

interface VideoThreadsResponse {
	threads: Array<ThreadBase>;
	users: Record<string, TransformedUser>;
}

interface VideoRepliesResponse {
	replies: Array<TransformedComment>;
	users: Record<string, TransformedUser>;
}
