import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.ts";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

router.post("/signup", (req, res) => {
  const { login_id, email, password, name, role } = req.body;
  
  // Validation
  if (!login_id || login_id.length < 6 || login_id.length > 12) {
    return res.status(400).json({ error: "Login ID must be between 6 and 12 characters" });
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ error: "Password must contain at least one uppercase letter, one lowercase letter, one special character, and be at least 8 characters long" });
  }

  try {
    const hash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare("INSERT INTO users (login_id, email, password, name, role) VALUES (?, ?, ?, ?, ?)");
    const info = stmt.run(login_id, email, hash, name, role || "staff");
    res.status(201).json({ id: info.lastInsertRowid, login_id, email, name, role });
  } catch (error: any) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      if (error.message.includes("login_id")) {
        res.status(400).json({ error: "Login ID already exists" });
      } else {
        res.status(400).json({ error: "Email already exists" });
      }
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

router.post("/login", (req, res) => {
  const { login_id, password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE login_id = ?").get(login_id) as any;

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "Invalid Login ID or Password" });
  }

  const token = jwt.sign({ id: user.id, login_id: user.login_id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, {
    expiresIn: "1d",
  });

  res.json({ token, user: { id: user.id, login_id: user.login_id, email: user.email, role: user.role, name: user.name } });
});

router.post("/forgot-password", (req, res) => {
  const { login_id } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE login_id = ?").get(login_id) as any;

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 15 * 60000).toISOString(); // 15 mins

  db.prepare("UPDATE users SET otp = ?, otp_expiry = ? WHERE id = ?").run(otp, expiry, user.id);

  // In a real app, send this via email/SMS. For now, just return it for testing.
  res.json({ message: "OTP generated", otp }); 
});

router.post("/reset-password", (req, res) => {
  const { login_id, otp, new_password } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE login_id = ?").get(login_id) as any;

  if (!user || user.otp !== otp || new Date(user.otp_expiry) < new Date()) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  if (!passwordRegex.test(new_password)) {
    return res.status(400).json({ error: "Password must contain at least one uppercase letter, one lowercase letter, one special character, and be at least 8 characters long" });
  }

  const hash = bcrypt.hashSync(new_password, 10);
  db.prepare("UPDATE users SET password = ?, otp = NULL, otp_expiry = NULL WHERE id = ?").run(hash, user.id);

  res.json({ message: "Password reset successfully" });
});

export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

export const authorizeRole = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }
    next();
  };
};

router.get("/users", authenticateToken, authorizeRole(["admin"]), (req, res) => {
  const users = db.prepare("SELECT id, login_id, email, name, role FROM users").all();
  res.json(users);
});

router.post("/users", authenticateToken, authorizeRole(["admin"]), (req, res) => {
  const { login_id, email, password, name, role } = req.body;
  
  if (!login_id || login_id.length < 6 || login_id.length > 12) {
    return res.status(400).json({ error: "Login ID must be between 6 and 12 characters" });
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ error: "Password must contain at least one uppercase letter, one lowercase letter, one special character, and be at least 8 characters long" });
  }

  try {
    const hash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare("INSERT INTO users (login_id, email, password, name, role) VALUES (?, ?, ?, ?, ?)");
    const info = stmt.run(login_id, email, hash, name, role || "staff");
    res.status(201).json({ id: info.lastInsertRowid, login_id, email, name, role });
  } catch (error: any) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      if (error.message.includes("login_id")) {
        res.status(400).json({ error: "Login ID already exists" });
      } else {
        res.status(400).json({ error: "Email already exists" });
      }
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

router.put("/users/:id", authenticateToken, authorizeRole(["admin"]), (req, res) => {
  const { id } = req.params;
  const { name, role, email } = req.body;
  
  try {
    const stmt = db.prepare("UPDATE users SET name = ?, role = ?, email = ? WHERE id = ?");
    stmt.run(name, role, email, id);
    res.json({ id, name, role, email });
  } catch (error: any) {
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(400).json({ error: "Email already exists" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

router.delete("/users/:id", authenticateToken, authorizeRole(["admin"]), (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if user has operations
    const opsCount = db.prepare("SELECT COUNT(*) as count FROM operations WHERE user_id = ?").get(id) as { count: number };
    if (opsCount.count > 0) {
      return res.status(400).json({ error: "Cannot delete user with existing operations" });
    }

    db.prepare("DELETE FROM users WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/me", authenticateToken, (req: any, res) => {
  res.json(req.user);
});

export default router;
