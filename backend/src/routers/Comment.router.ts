import { Router } from "express";

import CommentController from "../controllers/Comment.controller";
import Authentication from "../middlewares/Authentication";
import Pagination from "../middlewares/Pagination";

const CommentRouter = Router();

CommentRouter.post(
	"/:videoId",
	Authentication,
	CommentController.createComment
);

CommentRouter.post(
	"/:videoId/:threadId",
	Authentication,
	CommentController.replyToComment
);

CommentRouter.get("/:videoId", Pagination, CommentController.getThreads);

CommentRouter.get(
	"/:videoId/:threadId",
	Pagination,
	CommentController.getThreadComments
);

export default CommentRouter;
