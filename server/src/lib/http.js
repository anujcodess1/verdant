export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function badRequest(message, details) {
  return new ApiError(400, message, details);
}

export function unauthorized(message = 'Sign in required') {
  return new ApiError(401, message);
}

export function notFound(message = 'Not found') {
  return new ApiError(404, message);
}

export function conflict(message = 'Conflict') {
  return new ApiError(409, message);
}
