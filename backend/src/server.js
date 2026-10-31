import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import connectionRoutes from "./routes/connectionRoutes.js";
import foguinhoRoutes from "./routes/foguinhoRoutes.js";
import studyRoutes from "./routes/studyRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import investmentRoutes from "./routes/investmentRoutes.js";
import appDataRoutes from "./routes/appDataRoutes.js";
import { initializeDatabase, query } from "./db/pool.js";

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error(
    "JWT_SECRET não configurado no arquivo .env."
  );
}

const app = express();

const PORT =
  process.env.PORT || 3001;

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:5173",
  })
);

app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await query("SELECT 1");
    res.json({
      ok: true,
      service: "meu-assistente-api",
      database: "TiDB/MySQL",
    });
  } catch (error) {
    console.error("Falha no health check do banco:", error);
    res.status(503).json({
      ok: false,
      service: "meu-assistente-api",
      database: "unavailable",
    });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/app-data", appDataRoutes);

app.use(
  "/api/connections",
  connectionRoutes
);

app.use(
  "/api/foguinho",
  foguinhoRoutes
);

app.use(
  "/api/study",
  studyRoutes
);

app.use(
  "/api/projects",
  projectRoutes
);

app.use(
  "/api/groups",
  groupRoutes
);

app.use(
  "/api/investments",
  investmentRoutes
);

app.use(
  (err, _req, res, _next) => {
    console.error(err);

    res.status(500).json({
      message:
        "Erro interno do servidor.",
    });
  }
);

async function start() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`API rodando em http://localhost:${PORT}`);
      console.log("Banco configurado: TiDB (compatível com MySQL)");
    });
  } catch (error) {
    console.error("Não foi possível inicializar o banco TiDB.", error);
    process.exit(1);
  }
}

start();
