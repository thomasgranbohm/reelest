import { create } from "domain";

interface CustomError {
	message: string;
	payload?: object;
	status: number;
}

const createCustomError =
	(status: number, message: string) =>
	(payload?: object): CustomError => ({
		message,
		payload,
		status,
	});

export const MalformedBodyError = createCustomError(400, "Malformed body");
export const UnauthorizedError = createCustomError(401, "Unauthorized");
export const InvalidCredentialsError = createCustomError(
	401,
	"Invalid credentials"
);
export const ForbiddenError = createCustomError(403, "Forbidden");
export const NotFoundError = createCustomError(404, "Not found");
export const TeapotError = createCustomError(418, "I'm a teapot");
export const StillProcessingError = createCustomError(
	425,
	"Video still processing"
);
export const InternalServerError = createCustomError(
	500,
	"Internal server error"
);

export default create;
