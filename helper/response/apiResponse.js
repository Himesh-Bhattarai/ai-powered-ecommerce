// lib/apiResponse.js
import { NextResponse } from "next/server";

function formatError(error) {
  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    return error;
  }

  return typeof error === "string" ? error : undefined;
}

function jsonResponse({ success, message, data = null, error, status }) {
  return NextResponse.json(
    {
      success,
      message,
      data,
      ...(error !== undefined ? { error: formatError(error) } : {}),
    },
    { status }
  );
}

export function successResponse(message, data, status = 200) {
  return jsonResponse({
    success: true,
    message,
    data,
    status,
  });
}

export function errorResponse(message, error, status = 500) {
  return jsonResponse({
    success: false,
    message,
    error,
    status,
  });
}

export const apiResponse = {
  ok: (data = null, message = "Success") =>
    jsonResponse({ success: true, message, data, status: 200 }),
  created: (data = null, message = "Created") =>
    jsonResponse({ success: true, message, data, status: 201 }),
  badRequest: (message = "Bad request", error) =>
    jsonResponse({ success: false, message, error, status: 400 }),
  unauthorized: (message = "Unauthorized", error) =>
    jsonResponse({ success: false, message, error, status: 401 }),
  forbidden: (message = "Forbidden", error) =>
    jsonResponse({ success: false, message, error, status: 403 }),
  notFound: (message = "Not found", error) =>
    jsonResponse({ success: false, message, error, status: 404 }),
  conflict: (message = "Conflict", error) =>
    jsonResponse({ success: false, message, error, status: 409 }),
  serverError: (message = "Server error", error) =>
    jsonResponse({ success: false, message, error, status: 500 }),
};

export const okResponse = (data, message = "Success") =>
  apiResponse.ok(data, message);
export const createdResponse = (data, message = "Created") =>
  apiResponse.created(data, message);
export const badRequestResponse = (message = "Bad request", error) =>
  apiResponse.badRequest(message, error);
export const unauthorizedResponse = (message = "Unauthorized", error) =>
  apiResponse.unauthorized(message, error);
export const forbiddenResponse = (message = "Forbidden", error) =>
  apiResponse.forbidden(message, error);
export const notFoundResponse = (message = "Not found", error) =>
  apiResponse.notFound(message, error);
export const conflictResponse = (message = "Conflict", error) =>
  apiResponse.conflict(message, error);
export const serverErrorResponse = (message = "Server error", error) =>
  apiResponse.serverError(message, error);
