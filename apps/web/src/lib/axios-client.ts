import axios from "axios"

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3001"

export const axiosClient = axios.create({
  baseURL: SERVER_URL,
  withCredentials: true,
})
