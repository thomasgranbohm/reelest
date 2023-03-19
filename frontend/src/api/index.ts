import axios from "axios";
import getConfig from "next/config";

const { serverRuntimeConfig } = getConfig();

export const publicAPI = axios.create({
	baseURL: "/api",
});

export const privateAPI = axios.create({
	baseURL: process.env.API_URL,
});
