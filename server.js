const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 3000;

const credentials = {
  admin: "admin@hema",
  hema: "hema@30",
  friends: "frnds@123",
};

const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadsDir));
app.use(express.static(__dirname));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "-").toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    files: 100,
    fileSize: 1024 * 1024 * 150,
  },
});

const db = new sqlite3.Database(path.join(__dirname, "birthday.db"), (err) => {
  if (err) {
    console.error("Database connection error:", err);
    process.exit(1);
  }
  initDb();
});

function initDb() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS wishes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        friendName TEXT NOT NULL,
        message TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS uploads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mediaType TEXT NOT NULL,
        originalName TEXT NOT NULL,
        filePath TEXT NOT NULL,
        uploadedBy TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS final_video (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        originalName TEXT NOT NULL,
        filePath TEXT NOT NULL,
        uploadedBy TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });
}

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
});

app.post("/api/login", (req, res) => {
  const { role, password } = req.body;
  if (!role || !password || credentials[role] !== password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  return res.json({ role });
});

app.post("/api/friends/contribute", upload.array("media", 100), (req, res) => {
  const name = (req.body.name || "").trim();
  const message = (req.body.message || "").trim();

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  if (!message) {
    return res.status(400).json({ error: "Wish message is required" });
  }

  db.run(
    "INSERT INTO wishes (friendName, message) VALUES (?, ?)",
    [name, message],
    (wishErr) => {
      if (wishErr) {
        return res.status(500).json({ error: wishErr.message });
      }

      const files = req.files || [];
      if (!files.length) {
        return res.json({ success: true, uploadedFiles: 0 });
      }

      const stmt = db.prepare(
        "INSERT INTO uploads (mediaType, originalName, filePath, uploadedBy) VALUES (?, ?, ?, ?)"
      );

      for (const file of files) {
        const mediaType = file.mimetype.startsWith("video/") ? "video" : "photo";
        stmt.run(mediaType, file.originalname, `/uploads/${file.filename}`, name);
      }

      stmt.finalize((uploadErr) => {
        if (uploadErr) {
          return res.status(500).json({ error: uploadErr.message });
        }
        return res.json({ success: true, uploadedFiles: files.length });
      });
    }
  );
});

app.get("/api/wishes", (_req, res) => {
  db.all(
    `SELECT id, friendName, message, createdAt FROM wishes ORDER BY datetime(createdAt) DESC, id DESC`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      return res.json(rows);
    }
  );
});

app.get("/api/memories", (_req, res) => {
  db.all(
    `SELECT id, mediaType, originalName, filePath, uploadedBy, createdAt FROM uploads ORDER BY datetime(createdAt) DESC, id DESC`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      return res.json(rows);
    }
  );
});

app.get("/api/final-video", (_req, res) => {
  db.get(
    `SELECT id, originalName, filePath, uploadedBy, createdAt FROM final_video ORDER BY datetime(createdAt) DESC, id DESC LIMIT 1`,
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      return res.json(row || null);
    }
  );
});

function requireAdmin(req, res, next) {
  if (req.headers["x-role"] !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  return next();
}

app.delete("/api/admin/memories/:id", requireAdmin, (req, res) => {
  db.get("SELECT filePath FROM uploads WHERE id = ?", [req.params.id], (findErr, row) => {
    if (findErr) {
      return res.status(500).json({ error: findErr.message });
    }
    if (!row) {
      return res.status(404).json({ error: "Memory not found" });
    }

    db.run("DELETE FROM uploads WHERE id = ?", [req.params.id], (deleteErr) => {
      if (deleteErr) {
        return res.status(500).json({ error: deleteErr.message });
      }

      const absolutePath = path.join(__dirname, row.filePath.replace(/^\//, ""));
      fs.unlink(absolutePath, () => {
        return res.json({ success: true });
      });
    });
  });
});

app.delete("/api/admin/wishes/:id", requireAdmin, (req, res) => {
  db.run("DELETE FROM wishes WHERE id = ?", [req.params.id], function onDelete(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!this.changes) {
      return res.status(404).json({ error: "Wish not found" });
    }
    return res.json({ success: true });
  });
});

app.post("/api/admin/final-video", requireAdmin, upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Final video file is required" });
  }

  if (!req.file.mimetype.startsWith("video/")) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: "Only video files are allowed" });
  }

  db.all("SELECT filePath FROM final_video", (readErr, rows) => {
    if (readErr) {
      fs.unlink(req.file.path, () => {});
      return res.status(500).json({ error: readErr.message });
    }

    db.run("DELETE FROM final_video", (deleteErr) => {
      if (deleteErr) {
        fs.unlink(req.file.path, () => {});
        return res.status(500).json({ error: deleteErr.message });
      }

      for (const row of rows || []) {
        const oldPath = path.join(__dirname, row.filePath.replace(/^\//, ""));
        fs.unlink(oldPath, () => {});
      }

      const publicPath = `/uploads/${req.file.filename}`;
      db.run(
        "INSERT INTO final_video (originalName, filePath, uploadedBy) VALUES (?, ?, ?)",
        [req.file.originalname, publicPath, "admin"],
        function onInsert(insertErr) {
          if (insertErr) {
            fs.unlink(req.file.path, () => {});
            return res.status(500).json({ error: insertErr.message });
          }

          return res.json({
            id: this.lastID,
            originalName: req.file.originalname,
            filePath: publicPath,
            uploadedBy: "admin",
          });
        }
      );
    });
  });
});

app.listen(PORT, () => {
  console.log(`Birthday celebration server running at http://localhost:${PORT}`);
});
