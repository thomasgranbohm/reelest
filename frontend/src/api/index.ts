import axios from "axios";

export const publicAPI = axios.create({
	baseURL: "/api",
});

export const privateAPI = axios.create({
	baseURL: process.env.API_URL,
});
