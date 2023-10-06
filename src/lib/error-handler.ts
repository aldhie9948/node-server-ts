import { Request, Response, NextFunction } from "express";

export default function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let message = "";
  if (err instanceof Error) {
    console.error(err.stack);
    message = err.message;
  }
  res.status(500);
  return res.json({ error: message });
}
