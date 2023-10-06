import { log } from "console";
import { NextFunction, Request, Response } from "express";

export default function logger(
  req: Request,
  res: Response,
  next: NextFunction
) {
  log("PATH \t: ", req.path);
  log("METHOD \t: ", req.method);
  log("BODY \t: ", req.body);
  log("PARAM \t: ", req.params);
  log("QUERY \t: ", req.query);
  log("");
  next();
}
