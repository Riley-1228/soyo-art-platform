import {
  Request,
  Response,
  Router,
} from "express";

import {
  ADMIN_COOKIE_NAME,
  createAdminSession,
  deleteAdminSessionFromRequest,
  deleteExpiredAdminSessions,
  getAdminCookieOptions,
  getAdminSessionFromRequest,
  getConfiguredAdminEmail,
  verifyAdminPassword,
} from "../services/adminAuth";

const router =
  Router();

function cleanText(
  value: unknown,
  maxLength: number
) {
  if (
    typeof value !== "string"
  ) {
    return "";
  }

  return value
    .trim()
    .slice(
      0,
      maxLength
    );
}

router.post(
  "/login",
  async (
    request: Request,
    response: Response
  ) => {
    const email =
      cleanText(
        request.body.email,
        160
      ).toLowerCase();

    const password =
      typeof request.body.password ===
        "string"
        ? request.body.password
        : "";

    if (
      !email ||
      !password
    ) {
      return response
        .status(400)
        .json({
          ok: false,
          authenticated:
            false,
          error:
            "Email and password are required.",
        });
    }

    try {
      const configuredEmail =
        getConfiguredAdminEmail();

      const passwordMatches =
        verifyAdminPassword(
          password
        );

      if (
        email !==
          configuredEmail ||
        !passwordMatches
      ) {
        return response
          .status(401)
          .json({
            ok: false,
            authenticated:
              false,
            error:
              "Invalid admin credentials.",
          });
      }

      await deleteExpiredAdminSessions();

      const session =
        await createAdminSession(
          configuredEmail
        );

      response.cookie(
        ADMIN_COOKIE_NAME,
        session.token,
        getAdminCookieOptions()
      );

      return response
        .status(200)
        .json({
          ok: true,
          authenticated:
            true,
          admin: {
            email:
              configuredEmail,
          },
          expiresAt:
            session.expiresAt.toISOString(),
        });

    } catch (error) {
      console.error(
        "SOYO admin login error:",
        error
      );

      return response
        .status(500)
        .json({
          ok: false,
          authenticated:
            false,
          error:
            "Admin login is temporarily unavailable.",
        });
    }
  }
);

router.get(
  "/me",
  async (
    request: Request,
    response: Response
  ) => {
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
          });
      }

      return response.json({
        ok: true,
        authenticated:
          true,
        admin: {
          email:
            admin.email,
        },
        expiresAt:
          new Date(
            admin.expiresAt
          ).toISOString(),
      });

    } catch (error) {
      console.error(
        "SOYO admin session check error:",
        error
      );

      return response
        .status(500)
        .json({
          ok: false,
          authenticated:
            false,
          error:
            "The admin session could not be checked.",
        });
    }
  }
);

router.post(
  "/logout",
  async (
    request: Request,
    response: Response
  ) => {
    try {
      await deleteAdminSessionFromRequest(
        request
      );
    } catch (error) {
      console.error(
        "SOYO admin logout cleanup error:",
        error
      );
    }

    response.clearCookie(
      ADMIN_COOKIE_NAME,
      {
        ...getAdminCookieOptions(),
        maxAge:
          undefined,
      }
    );

    return response.json({
      ok: true,
      authenticated:
        false,
    });
  }
);

export default router;
