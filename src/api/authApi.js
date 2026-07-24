import axiosClient from "./axiosClient";
import { getApiData } from "../utils/apiError";

export const login = (body) => axiosClient.post("/auth/login", body);

export const getMe = () => axiosClient.get("/auth/me").then((res) => getApiData(res));
