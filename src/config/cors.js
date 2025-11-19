import dotenv from "dotenv";
dotenv.config();

/**
 * @description CORS configuration options. it sets the allowed origin based on the environment (production vs. development) and enables credentials for secure HTTP only cookie handling.
 * @returns {object} The CORS options object, suitable for use with middleware like `cors`.
 */

const getCorsOptions = () => {
  // Determine the allowed origin based on the environment
  const allowedOrigin =
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_LINK
      : process.env.FRONTEND_LINK_DEV;

  const corsOptions = {
    // Only allow requests from the specified frontend URL
    origin: allowedOrigin,
    // This MUST be true for the browser to send/receive cookies (like your JWT cookie) when making cross-origin requests.
    credentials: true,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization",
  };

  return corsOptions;
};

export default getCorsOptions;
