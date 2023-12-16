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

CommentRouter.get("/:videoId", Pagination, CommentController.getComments);

CommentRouter.delete(
	"/:videoId",
	Authentication,
	CommentController.deleteComment
);

export default CommentRouter;
