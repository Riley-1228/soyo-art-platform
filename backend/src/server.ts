import "dotenv/config";

import cors from "cors";
import express from "express";

import inquiryRouter from "./routes/inquiries";

const app =
  express();

const PORT =
  Number(
    process.env.PORT
  ) || 4000;

const allowedOrigins =
  (
    process.env.FRONTEND_ORIGINS ||
    "http://localhost:3000"
  )
    .split(",")
    .map(
      (origin) =>
        origin.trim()
    )
    .filter(Boolean);

app.use(
  cors({
    origin(
      origin,
      callback
    ) {
      if (!origin) {
        callback(
          null,
          true
        );

        return;
      }

      if (
        allowedOrigins.includes(
          origin
        )
      ) {
        callback(
          null,
          true
        );

        return;
      }

      callback(
        new Error(
          "Origin not allowed by CORS"
        )
      );
    },

    methods: [
      "GET",
      "POST",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
    ],
  })
);

app.use(
  express.json({
    limit: "100kb",
  })
);

app.get(
  "/health",
  (
    _request,
    response
  ) => {
    response.json({
      ok: true,
      service:
        "soyo-backend",
    });
  }
);

app.use(
  "/api/inquiries",
  inquiryRouter
);

app.listen(
  PORT,
  () => {
    console.log(
      `SOYO backend running on http://localhost:${PORT}`
    );
  }
);