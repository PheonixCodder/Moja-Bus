import { type Router as ExpressRouter, Router } from "express";

export function createHealthRouter(): ExpressRouter {
  const router = Router();

  router.get("/health", (_req, res) => {
    res.json({
      status: "ok",
    });
  });

  return router;
}
