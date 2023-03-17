import { RequestHandler } from "express";

const PromiseHandler = (fn: RequestHandler) =>
	<RequestHandler>(
		((req, res, next) => Promise.resolve(fn(req, res, next)).catch(next))
	);

export default PromiseHandler;
