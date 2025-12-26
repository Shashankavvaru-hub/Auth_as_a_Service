import bcrypt from "bcrypt";
import { ClientApp } from "../modules/app/app.model.js";

export const appAuth = async (req, res, next) => {
  try {
    const appId = req.headers["x-app-id"];
    const appSecret = req.headers["x-app-secret"];

    if (!appId || !appSecret) {
      return res.status(401).json({ message: "App credentials missing" });
    }

    const app = await ClientApp.findOne({ appId });
    if (!app) {
      return res.status(401).json({ message: "Invalid app credentials" });
    }

    const ok = await bcrypt.compare(appSecret, app.appSecretHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid app credentials" });
    }

    // attach tenant to request
    req.app = app;
    next();
  } catch (err) {
    next(err);
  }
};
