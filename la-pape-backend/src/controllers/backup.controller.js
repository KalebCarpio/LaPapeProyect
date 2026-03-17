// src/controllers/backup.controller.js
import { spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

export const downloadBackup = async (req, res) => {
  // Nombre del archivo
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup-la-pape-${stamp}.sql`;
  const tmpPath = path.join(os.tmpdir(), filename);

  // Prepara args para pg_dump
  const args = [
    "-h", process.env.PGHOST,
    "-p", process.env.PGPORT || "5432",
    "-U", process.env.PGUSER,
    "-d", process.env.PGDATABASE,
    "--format=plain",
    "--no-owner",
    "--no-privileges",
  ];

  // pg_dump usa PGPASSWORD desde env
  const env = { ...process.env, PGPASSWORD: process.env.PGPASSWORD };

  const dump = spawn("pg_dump", args, { env });

  const writeStream = fs.createWriteStream(tmpPath);
  dump.stdout.pipe(writeStream);

  let err = "";
  dump.stderr.on("data", (d) => (err += d.toString()));

  dump.on("close", (code) => {
    if (code !== 0) {
      try { fs.existsSync(tmpPath) && fs.unlinkSync(tmpPath); } catch {}
      return res.status(500).json({
        message: "Error generando backup",
        details: err?.slice(0, 1200),
      });
    }

    res.download(tmpPath, filename, (e) => {
      try { fs.unlinkSync(tmpPath); } catch {}
      if (e) console.error("download error:", e);
    });
  });
};