// lib/apiResponse.js
import { NextResponse } from "next/server";

export function successResponse(message, data, status = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data: data ?? null,
    },
    { status }
  );
}

export function errorResponse(message, error, status = 500) {
  const isDev = process.env.NODE_ENV === "development";

  return NextResponse.json(
    {
      success: false,
      message,
      // in production, only expose the error if it's a plain string
      // avoids leaking stack traces or internal details to clients
      error: isDev
        ? error
        : typeof error === "string"
        ? error
        : undefined,
    },
    { status }
  );
}

export const okResponse          = (data, message = "Success")         => successResponse(message, data, 200);
export const createdResponse     = (data, message = "Created")         => successResponse(message, data, 201);
export const badRequestResponse  = (message = "Bad request",   error)  => errorResponse(message, error, 400);
export const unauthorizedResponse= (message = "Unauthorized",  error)  => errorResponse(message, error, 401);
export const forbiddenResponse   = (message = "Forbidden",     error)  => errorResponse(message, error, 403);
export const notFoundResponse    = (message = "Not found",     error)  => errorResponse(message, error, 404);
export const conflictResponse    = (message = "Conflict",      error)  => errorResponse(message, error, 409);
export const serverErrorResponse = (message = "Server error",  error)  => errorResponse(message, error, 500);