import { ApiError } from "../utils/ApiError.js"; 

export const errorHandler = (err, req, res, next) => {
    console.error("Error in handler:", err);
    const statusCode = err instanceof ApiError && err.statusCode ? err.statusCode : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Something went wrong",
    errors: err.errors || [],
  });
};
