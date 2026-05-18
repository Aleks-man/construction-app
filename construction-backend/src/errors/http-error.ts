export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function badRequest(message: string) {
  return new HttpError(400, message);
}

export function unauthorized(message: string) {
  return new HttpError(401, message);
}

export function forbidden(message: string) {
  return new HttpError(403, message);
}

export function notFound(message: string) {
  return new HttpError(404, message);
}

export function conflict(message: string) {
  return new HttpError(409, message);
}
