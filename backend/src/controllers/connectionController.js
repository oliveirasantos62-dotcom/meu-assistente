import { randomUUID } from "crypto";
import { query } from "../db/pool.js";

export async function searchUsers(req, res) {
  try {
    const term = String(
      req.query.q || ""
    ).trim().toLowerCase();

    if (term.length < 2) {
      return res.json({
        users: [],
      });
    }

    const rows = await query(
      `SELECT
         id,
         name,
         username
       FROM users
       WHERE id <> ?
         AND (
           LOWER(name) LIKE ?
           OR LOWER(COALESCE(username, '')) LIKE ?
         )
       ORDER BY name
       LIMIT 20`,
      [
        req.user.id,
        `%${term}%`,
        `%${term}%`,
      ]
    );

    return res.json({
      users: rows,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        "Erro ao pesquisar usuários.",
    });
  }
}

export async function listConnections(req, res) {
  try {
    const rows = await query(
      `SELECT
         c.id,
         c.status,
         c.requester_id,
         c.receiver_id,
         c.created_at,
         u.id AS user_id,
         u.name,
         u.username,
         CASE WHEN c.receiver_id = ? THEN 1 ELSE 0 END AS is_receiver
       FROM connections c
       INNER JOIN users u
         ON u.id =
           CASE
             WHEN c.requester_id = ?
             THEN c.receiver_id
             ELSE c.requester_id
           END
       WHERE c.requester_id = ?
          OR c.receiver_id = ?
       ORDER BY c.created_at DESC`,
      [
        req.user.id,
        req.user.id,
        req.user.id,
        req.user.id,
      ]
    );

    return res.json({
      connections: rows,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        "Erro ao buscar conexões.",
    });
  }
}

export async function createConnection(
  req,
  res
) {
  try {
    const { userId } = req.body;

    if (
      !userId ||
      userId === req.user.id
    ) {
      return res.status(400).json({
        message:
          "Usuário inválido.",
      });
    }

    const target = await query(
      `SELECT id
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [userId]
    );

    if (!target[0]) {
      return res.status(404).json({
        message:
          "Usuário não encontrado.",
      });
    }

    const existing = await query(
      `SELECT
         id,
         status
       FROM connections
       WHERE
         (
           requester_id = ?
           AND receiver_id = ?
         )
         OR
         (
           requester_id = ?
           AND receiver_id = ?
         )
       LIMIT 1`,
      [
        req.user.id,
        userId,
        userId,
        req.user.id,
      ]
    );

    if (existing[0]) {
      return res.status(409).json({
        message:
          `Já existe uma conexão com status "${existing[0].status}".`,
      });
    }

    const connectionId =
      randomUUID();

    await query(
      `INSERT INTO connections
       (id, requester_id, receiver_id)
       VALUES (?, ?, ?)`,
      [
        connectionId,
        req.user.id,
        userId,
      ]
    );

    const rows = await query(
      `SELECT
         id,
         status,
         created_at
       FROM connections
       WHERE id = ?`,
      [connectionId]
    );

    return res.status(201).json({
      connection: rows[0],
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        "Erro ao enviar solicitação.",
    });
  }
}

export async function updateConnection(
  req,
  res
) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (
      ![
        "accepted",
        "rejected",
        "blocked",
      ].includes(status)
    ) {
      return res.status(400).json({
        message:
          "Status inválido.",
      });
    }

    const existing = await query(
      `SELECT
         id,
         requester_id,
         receiver_id,
         status
       FROM connections
       WHERE id = ?
         AND (
           requester_id = ?
           OR receiver_id = ?
         )
       LIMIT 1`,
      [
        id,
        req.user.id,
        req.user.id,
      ]
    );

    if (!existing[0]) {
      return res.status(404).json({
        message:
          "Conexão não encontrada.",
      });
    }

    // Aceitar/recusar só pode ser feito por quem recebeu o convite.
    // Bloquear pode ser feito por qualquer participante da conexão.
    if (status !== "blocked" && existing[0].receiver_id !== req.user.id) {
      return res.status(403).json({
        message: "Somente quem recebeu o convite pode aceitar ou recusar.",
      });
    }

    if (status !== "blocked" && existing[0].status !== "pending") {
      return res.status(409).json({
        message: "Este convite não está mais pendente.",
      });
    }

    await query(
      `UPDATE connections
       SET status = ?
       WHERE id = ?`,
      [status, id]
    );

    const rows = await query(
      `SELECT
         id,
         status,
         requester_id,
         receiver_id
       FROM connections
       WHERE id = ?`,
      [id]
    );

    return res.json({
      connection: rows[0],
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message:
        "Erro ao atualizar conexão.",
    });
  }
}
