import { RequestHandler } from "express";

const Pagination: RequestHandler = (req, _, next) => {
	const limit = parseInt(req.query.limit?.toString(), 10);
	const offset = parseInt(req.query.offset?.toString(), 10);

	req.pagination = {
		limit: isNaN(limit) || limit > 10 ? 10 : limit,
		offset: isNaN(offset) ? 0 : offset,
	};

	next();
};

export default Pagination;
