import type { NextFunction, Request, Response } from "express";
import { verifyEmployerToken } from "./employerToken.js";

export function requireEmployerJwt(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  const prefix = "Bearer ";
  if (!header?.startsWith(prefix)) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }
  const token = header.slice(prefix.length).trim();
  if (!token) {
    res.status(401).json({ error: "Missing token" });
    return;
  }
  try {
    const { sub, orgId, role } = verifyEmployerToken(token);
    req.employer = { userId: sub, organizationId: orgId, role };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
