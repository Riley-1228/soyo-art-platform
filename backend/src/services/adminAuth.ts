import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";

import type {
  NextFunction,
  Request,
  Response,
} from "express";

import {
  getDbPool,
} from "../db";

export const ADMIN_COOKIE_NAME =
  "soyo_admin_session";

const DEFAULT_SESSION_HOURS =
  12;

type AdminSessionRow = {
  admin_email: string;
  expires_at: Date | string;
};

function getSessionHours() {
  const configured =
    Number(
      process.env.SOYO_ADMIN_SESSION_HOURS
    );

  if (
    Number.isFinite(configured) &&
    configured > 0 &&
    configured <= 168
  ) {
    return configured;
  }

  return DEFAULT_SESSION_HOURS;
}

function shouldUseSecureCookie() {
  return (
    process.env.SOYO_ADMIN_COOKIE_SECURE ===
      "true" ||
    process.env.NODE_ENV ===
      "production"
  );
}

export function getAdminCookieOptions() {
  const secure =
    shouldUseSecureCookie();

  return {
    httpOnly: true,
    secure,
    sameSite:
      secure
        ? ("none" as const)
        : ("lax" as const),
    path: "/",
    maxAge:
      getSessionHours() *
      60 *
      60 *
      1000,
  };
}

export function getConfiguredAdminEmail() {
  const email =
    process.env.SOYO_ADMIN_EMAIL
      ?.trim()
      .toLowerCase();

  if (!email) {
    throw new Error(
      "SOYO_ADMIN_EMAIL is not configured."
    );
  }

  return email;
}

function getConfiguredPasswordHash() {
  const storedHash =
    process.env.SOYO_ADMIN_PASSWORD_HASH
      ?.trim();

  if (!storedHash) {
    throw new Error(
      "SOYO_ADMIN_PASSWORD_HASH is not configured."
    );
  }

  return storedHash;
}

export function verifyAdminPassword(
  password: string
) {
  const storedHash =
    getConfiguredPasswordHash();

  const parts =
    storedHash.split("$");

  if (
    parts.length !== 3 ||
    parts[0] !== "scrypt"
  ) {
    throw new Error(
      "SOYO_ADMIN_PASSWORD_HASH has an invalid format."
    );
  }

  const saltHex =
    parts[1];

  const hashHex =
    parts[2];

  if (
    !saltHex ||
    !hashHex
  ) {
    throw new Error(
      "SOYO_ADMIN_PASSWORD_HASH has an invalid format."
    );
  }

  const salt =
    Buffer.from(
      saltHex,
      "hex"
    );

  const expected =
    Buffer.from(
      hashHex,
      "hex"
    );

  if (
    salt.length === 0 ||
    expected.length === 0
  ) {
    throw new Error(
      "SOYO_ADMIN_PASSWORD_HASH has an invalid format."
    );
  }

  const actual =
    scryptSync(
      password,
      salt,
      expected.length
    );

  return (
    actual.length ===
      expected.length &&
    timingSafeEqual(
      actual,
      expected
    )
  );
}

function hashSessionToken(
  token: string
) {
  return createHash(
    "sha256"
  )
    .update(token)
    .digest("hex");
}

function readCookie(
  request: Request,
  name: string
) {
  const header =
    request.headers.cookie;

  if (!header) {
    return null;
  }

  for (
    const part of
      header.split(";")
  ) {
    const separator =
      part.indexOf("=");

    if (separator < 0) {
      continue;
    }

    const key =
      part
        .slice(
          0,
          separator
        )
        .trim();

    if (key !== name) {
      continue;
    }

    const rawValue =
      part
        .slice(
          separator + 1
        )
        .trim();

    try {
      return decodeURIComponent(
        rawValue
      );
    } catch {
      return rawValue;
    }
  }

  return null;
}

export async function createAdminSession(
  adminEmail: string
) {
  const token =
    randomBytes(32)
      .toString("base64url");

  const tokenHash =
    hashSessionToken(
      token
    );

  const sessionHours =
    getSessionHours();

  const expiresAt =
    new Date(
      Date.now() +
        sessionHours *
          60 *
          60 *
          1000
    );

  await getDbPool().query(
    `
      INSERT INTO admin_sessions (
        token_hash,
        admin_email,
        expires_at
      )
      VALUES ($1, $2, $3)
    `,
    [
      tokenHash,
      adminEmail,
      expiresAt,
    ]
  );

  return {
    token,
    expiresAt,
  };
}

export async function deleteExpiredAdminSessions() {
  await getDbPool().query(
    `
      DELETE FROM admin_sessions
      WHERE expires_at <= now()
    `
  );
}

export async function getAdminSessionFromRequest(
  request: Request
) {
  const token =
    readCookie(
      request,
      ADMIN_COOKIE_NAME
    );

  if (!token) {
    return null;
  }

  const tokenHash =
    hashSessionToken(
      token
    );

  const result =
    await getDbPool().query<AdminSessionRow>(
      `
        UPDATE admin_sessions
        SET last_used_at = now()
        WHERE token_hash = $1
          AND expires_at > now()
        RETURNING
          admin_email,
          expires_at
      `,
      [
        tokenHash,
      ]
    );

  const session =
    result.rows[0];

  if (!session) {
    return null;
  }

  return {
    email:
      session.admin_email,
    expiresAt:
      session.expires_at,
  };
}

export async function deleteAdminSessionFromRequest(
  request: Request
) {
  const token =
    readCookie(
      request,
      ADMIN_COOKIE_NAME
    );

  if (!token) {
    return;
  }

  await getDbPool().query(
    `
      DELETE FROM admin_sessions
      WHERE token_hash = $1
    `,
    [
      hashSessionToken(
        token
      ),
    ]
  );
}

export async function requireAdmin(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const admin =
      await getAdminSessionFromRequest(
        request
      );

    if (!admin) {
      return response
        .status(401)
        .json({
          ok: false,
          authenticated:
            false,
          error:
            "Admin authentication is required.",
        });
    }

    response.locals.admin =
      admin;

    next();
  } catch (error) {
    console.error(
      "SOYO admin authentication error:",
      error
    );

    return response
      .status(500)
      .json({
        ok: false,
        authenticated:
          false,
        error:
          "The admin session could not be verified.",
      });
  }
}
