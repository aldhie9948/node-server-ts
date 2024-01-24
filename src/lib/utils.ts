import { Request } from "express";
import jwt, { JsonWebTokenError, JwtPayload } from "jsonwebtoken";
import { IMarketingUser } from "./types";

const secret_key = process.env.SECRET_KEY_APP;

// Function to check if an object has all properties of the interface
export function hasAllProperties<T>(obj: T, properties: (keyof T)[]): obj is T {
  // @ts-ignore
  return properties.every((prop) => prop in obj);
}

export function verifyAuthorization(req: Request) {
  const { authorization } = req.headers;
  if (!authorization) throw new Error("Authorization is required");
  const token = authorization.replace("Bearer ", "");
  const isAuthValid = jwt.verify(token, <string>secret_key) as Partial<
    IMarketingUser & { iat: number; exp: number }
  >;
  return isAuthValid;
}
