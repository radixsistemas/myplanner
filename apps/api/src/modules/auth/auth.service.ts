import type { User } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/http-error";
import { hashPassword, comparePassword } from "../../lib/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt";
import { hashToken } from "../../lib/token-hash";
import type { LoginInput, RegisterInput } from "./auth.schemas";

async function issueTokenPair(userId: string) {
  const accessToken = signAccessToken(userId);
  const { token: refreshToken, expiresAt } = signRefreshToken(userId);

  await prisma.refreshToken.create({
    data: { userId, tokenHash: hashToken(refreshToken), expiresAt },
  });

  return { accessToken, refreshToken };
}

function sanitizeUser(user: User) {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw HttpError.conflict("Já existe uma conta com este e-mail");

  const isFirstUser = (await prisma.user.count()) === 0;

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      globalRole: isFirstUser ? "ADMIN" : "MEMBER",
      notificationPreference: { create: {} },
    },
  });

  const tokens = await issueTokenPair(user.id);
  return { user: sanitizeUser(user), ...tokens };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) throw HttpError.unauthorized("E-mail ou senha inválidos");

  const valid = await comparePassword(input.password, user.passwordHash);
  if (!valid) throw HttpError.unauthorized("E-mail ou senha inválidos");

  const tokens = await issueTokenPair(user.id);
  return { user: sanitizeUser(user), ...tokens };
}

export async function refresh(refreshTokenInput: string) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshTokenInput);
  } catch {
    throw HttpError.unauthorized("Refresh token inválido ou expirado");
  }

  const tokenHash = hashToken(refreshTokenInput);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw HttpError.unauthorized("Refresh token inválido ou expirado");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) throw HttpError.unauthorized("Usuário não encontrado");

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });

  const tokens = await issueTokenPair(user.id);
  return { user: sanitizeUser(user), ...tokens };
}

export async function logout(refreshTokenInput: string) {
  const tokenHash = hashToken(refreshTokenInput);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
