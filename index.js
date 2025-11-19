import e from "express";
import morgan from "morgan";
import cors from "cors";
import getCorsOptions from "./src/config/cors.js";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./src/config/db.js";
import { notFound, errorHandler } from "./src/middleware/error.middleware.js";

// route imports
import urlRoutes from "./src/routes/url.routes.js";
import redirect from "./src/routes/redirect.route.js";
import auth from "./src/routes/auth.routes.js";

connectDB();
const PORT = process.env.PORT || 8000;
let FRONTEND_LINK = "";
const app = e();

if (process.env.NODE_ENV == "production") {
  // minimal logging in prod
  app.use(morgan("tiny"));
  FRONTEND_LINK = process.env.FRONTEND_LINK;
} else {
  // detailed logging in development
  app.use(morgan("dev"));
  FRONTEND_LINK = process.env.FRONTEND_LINK_DEV;
}

// express middleware
// parse incoming requests with json payloads
app.use(e.json());
// parse incoming requests with url encoded payloads
app.use(e.urlencoded({ extended: true }));
// set security-related http header
app.use(helmet());
// enable cross-origin requests
app.use(cors(getCorsOptions()));
// parse cookie headers
app.use(cookieParser());

// API routes
app.use("/api/urls", urlRoutes);
app.use("/", redirect);
app.use("/api/auth", auth);

// the ROOT route should redirect to the landing page (frontend)
app.get("/", (req, res) => res.redirect(FRONTEND_LINK));

/**
 * @desc    Fetch server health
 * @route   GET /server/health
 * @access  PUBLIC
 */
app.get("/server/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
  });
});

// error middleware
app.use(notFound);
app.use(errorHandler);

// start server
app.listen(PORT, () => console.log(`API is live on http://localhost:${PORT}`));
