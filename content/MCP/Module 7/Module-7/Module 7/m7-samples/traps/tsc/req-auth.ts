import type { RequestHandler } from "express";
export const whoami: RequestHandler = (req, res) => void res.json({ sub: req.auth?.extra?.["sub"] });
