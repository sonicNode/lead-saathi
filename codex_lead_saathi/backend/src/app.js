const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const env = require("./config/env");
const healthRoutes = require("./routes/healthRoutes");
const userRoutes = require("./routes/userRoutes");
const leadRoutes = require("./routes/leadRoutes");
const voiceRoutes = require("./routes/voiceRoutes");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");

const app = express();
const frontendDistPath = path.resolve(__dirname, "../../frontend/dist");

app.use(
  cors({
    origin: env.clientUrl
  })
);
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/api/health", healthRoutes);
app.use("/api/users", userRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/voice", voiceRoutes);
app.use(express.static(frontendDistPath));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    next();
    return;
  }

  res.sendFile(path.join(frontendDistPath, "index.html"));
});

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
