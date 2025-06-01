import { ApiError } from "../utils/ApiError.js"; 

export const errorHandler = (err, req, res, next) => {
    console.error("Error in handler:", err);
    const statusCode = err instanceof ApiError && err.status? err.status : 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Something went wrong",
    errors: err.errors || [],
  });
};
