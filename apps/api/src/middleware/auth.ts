import type { NextFunction, Request, Response } from "express";
import type { GlobalRole } from "@prisma/client";
import { verifyAccessToken } from "../lib/jwt";
import { HttpError } from "../lib/http-error";
import { prisma } from "../lib/prisma";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  globalRole: GlobalRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function authGuard(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(HttpError.unauthorized());
  }

  try {
    const payload = verifyAccessToken(header.slice("Bearer ".length));
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return next(HttpError.unauthorized());

    req.user = { id: user.id, name: user.name, email: user.email, globalRole: user.globalRole };
    next();
  } catch {
    next(HttpError.unauthorized("Token de acesso inválido ou expirado"));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.globalRole !== "ADMIN") return next(HttpError.forbidden("Apenas administradores podem realizar esta ação"));
  next();
}
