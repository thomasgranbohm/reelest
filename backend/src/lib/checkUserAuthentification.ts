import { Request } from "express";

const checkUserAuthentification = (req: Request): boolean =>
	req.auth !== undefined &&
	req.auth.token !== undefined &&
	req.auth.payload !== undefined;

export default checkUserAuthentification;
