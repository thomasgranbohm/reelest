import { RequestHandler } from "express";

const Pagination: RequestHandler = (req, _, next) => {
	const take = parseInt(req.query.take?.toString(), 10);
	const skip = parseInt(req.query.skip?.toString(), 10);

	req.pagination = {
		skip: isNaN(skip) ? 0 : skip,
		take: isNaN(take) || take > 10 ? 10 : take,
	};

	next();
};

export default Pagination;
