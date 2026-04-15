import jwt from "jsonwebtoken";

const issuer = "job-board";

/** Dev-only default so local `npm run dev` works without .env; set JWT_SECRET in production. */
export function secretOrDevDefault(): string {
  return process.env.JWT_SECRET ?? "dev-only-change-me";
}

export type EmployerJwtPayload = {
  sub: string;
  orgId: string;
  role: string;
};

export function signEmployerToken(input: {
  userId: string;
  organizationId: string;
  role: string;
}): string {
  return jwt.sign(
    { orgId: input.organizationId, role: input.role },
    secretOrDevDefault(),
    {
      subject: input.userId,
      expiresIn: "7d",
      issuer,
      algorithm: "HS256",
    },
  );
}

export function verifyEmployerToken(token: string): EmployerJwtPayload {
  const decoded = jwt.verify(token, secretOrDevDefault(), {
    issuer,
    algorithms: ["HS256"],
  });
  if (typeof decoded === "string" || !decoded.sub) {
    throw new Error("Invalid token payload");
  }
  const orgId = (decoded as jwt.JwtPayload).orgId;
  const role = (decoded as jwt.JwtPayload).role;
  if (typeof orgId !== "string" || typeof role !== "string") {
    throw new Error("Invalid token claims");
  }
  return { sub: decoded.sub, orgId, role };
}
