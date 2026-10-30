import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { query } from "../db/pool.js";

function createToken(userId) {
  return jwt.sign(
    {},
    process.env.JWT_SECRET,
    {
      subject: userId,
      expiresIn: "7d",
    }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
  };
}

export async function register(req, res) {
  try {
    const {
      name,
      email,
      password,
      username,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Nome, e-mail e senha são obrigatórios.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "A senha precisa ter pelo menos 6 caracteres.",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    let normalizedUsername =
      username?.trim().toLowerCase() || null;

    if (normalizedUsername?.startsWith("@")) {
      normalizedUsername =
        normalizedUsername.substring(1);
    }

    const existing = await query(
      `SELECT id
       FROM users
       WHERE email = ?
          OR (? IS NOT NULL AND username = ?)
       LIMIT 1`,
      [
        normalizedEmail,
        normalizedUsername,
        normalizedUsername,
      ]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message:
          "E-mail ou nome de usuário já está em uso.",
      });
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

    const userId = randomUUID();

    await query(
      `INSERT INTO users
       (id, name, email, username, password_hash)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        name.trim(),
        normalizedEmail,
        normalizedUsername,
        passwordHash,
      ]
    );

    const userRows = await query(
      `SELECT id, name, email, username
       FROM users
       WHERE id = ?`,
      [userId]
    );

    const user = userRows[0];

    return res.status(201).json({
      user: publicUser(user),
      token: createToken(user.id),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erro ao criar conta.",
    });
  }
}

export async function login(req, res) {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message:
          "E-mail e senha são obrigatórios.",
      });
    }

    const rows = await query(
      `SELECT *
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email.trim().toLowerCase()]
    );

    const user = rows[0];

    if (
      !user ||
      !(await bcrypt.compare(
        password,
        user.password_hash
      ))
    ) {
      return res.status(401).json({
        message:
          "E-mail ou senha incorretos.",
      });
    }

    return res.json({
      user: publicUser(user),
      token: createToken(user.id),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Erro ao entrar.",
    });
  }
}

export async function me(req, res) {
  try {
    const rows = await query(
      `SELECT
         id,
         name,
         email,
         username,
         created_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [req.user.id]
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: "Usuário não encontrado.",
      });
    }

    return res.json({
      user: rows[0],
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        "Erro ao buscar usuário.",
    });
  }
}
