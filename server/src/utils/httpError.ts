export interface HttpError extends Error {
  status: number;
  code: string;
}

export const httpError = (status: number, code: string, message: string): HttpError =>
  Object.assign(new Error(message), { status, code });
