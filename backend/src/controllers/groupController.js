import { randomUUID } from 'crypto';
import { query } from '../db/pool.js';

async function isMember(groupId, userId, roles = ['owner', 'admin', 'member']) {
  const rows = await query(
    `SELECT
       gm.*,
       g.name AS group_name
     FROM group_members gm
     INNER JOIN \`groups\` g
       ON g.id = gm.group_id
     WHERE gm.group_id = ?
       AND gm.user_id = ?
       AND gm.status = 'accepted'
     LIMIT 1`,
    [groupId, userId],
  );

  return rows[0] && roles.includes(rows[0].role) ? rows[0] : null;
}

async function notify(userId, type, title, message, data = {}) {
  await query(
    `INSERT INTO notifications
      (id, user_id, type, title, message, data_json)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [randomUUID(), userId, type, title, message, JSON.stringify(data)],
  );
}

/* =========================================================
   LISTAR GRUPOS
   ========================================================= */

export async function listGroups(req, res) {
  try {
    const rows = await query(
      `SELECT
         g.id,
         g.owner_id,
         g.name,
         g.description,
         g.privacy,
         g.created_at,
         g.updated_at,

         u.name AS owner_name,
         u.username AS owner_username,

         COUNT(
           DISTINCT CASE
             WHEN gm.status = 'accepted'
             THEN gm.user_id
           END
         ) AS member_count,

         COUNT(DISTINCT ga.id) AS activity_count,

         CASE
           WHEN g.owner_id = ?
           THEN 'owner'
           ELSE gm2.role
         END AS my_role

       FROM \`groups\` g

       INNER JOIN users u
         ON u.id = g.owner_id

       LEFT JOIN group_members gm
         ON gm.group_id = g.id

       LEFT JOIN group_activities ga
         ON ga.group_id = g.id

       LEFT JOIN group_members gm2
         ON gm2.group_id = g.id
         AND gm2.user_id = ?
         AND gm2.status = 'accepted'

       WHERE
         g.owner_id = ?

         OR EXISTS (
           SELECT 1
           FROM group_members x
           WHERE x.group_id = g.id
             AND x.user_id = ?
             AND x.status = 'accepted'
         )

       GROUP BY
         g.id,
         g.owner_id,
         g.name,
         g.description,
         g.privacy,
         g.created_at,
         g.updated_at,
         u.name,
         u.username,
         gm2.role

       ORDER BY g.updated_at DESC`,
      [req.user.id, req.user.id, req.user.id, req.user.id],
    );

    return res.json({
      groups: rows,
    });
  } catch (e) {
    console.error(e);

    return res.status(500).json({
      message: 'Erro ao buscar grupos.',
    });
  }
}

/* =========================================================
   CRIAR GRUPO
   ========================================================= */

export async function createGroup(req, res) {
  try {
    const { name, description = '', privacy = 'connections' } = req.body;

    if (!String(name || '').trim()) {
      return res.status(400).json({
        message: 'Nome do grupo é obrigatório.',
      });
    }

    if (!['private', 'connections'].includes(privacy)) {
      return res.status(400).json({
        message: 'Privacidade inválida.',
      });
    }

    const id = randomUUID();

    await query(
      `INSERT INTO \`groups\`
        (id, owner_id, name, description, privacy)
       VALUES (?, ?, ?, ?, ?)`,
      [
        id,
        req.user.id,
        String(name).trim(),
        String(description).trim(),
        privacy,
      ],
    );

    await query(
      `INSERT INTO group_members
        (id, group_id, user_id, role, status, joined_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [randomUUID(), id, req.user.id, 'owner', 'accepted'],
    );

    const rows = await query(
      `SELECT *
       FROM \`groups\`
       WHERE id = ?`,
      [id],
    );

    return res.status(201).json({
      group: rows[0],
    });
  } catch (e) {
    console.error(e);

    return res.status(500).json({
      message: 'Erro ao criar grupo.',
    });
  }
}

/* =========================================================
   ATUALIZAR GRUPO
   ========================================================= */

export async function updateGroup(req, res) {
  try {
    const me = await isMember(req.params.id, req.user.id, ['owner', 'admin']);

    if (!me) {
      return res.status(403).json({
        message: 'Você não pode administrar este grupo.',
      });
    }

    const { name, description, privacy } = req.body;

    if (privacy && !['private', 'connections'].includes(privacy)) {
      return res.status(400).json({
        message: 'Privacidade inválida.',
      });
    }

    await query(
      `UPDATE \`groups\`
       SET
         name = COALESCE(?, name),
         description = COALESCE(?, description),
         privacy = COALESCE(?, privacy)
       WHERE id = ?`,
      [
        name?.trim() || null,
        description === undefined ? null : String(description),
        privacy || null,
        req.params.id,
      ],
    );

    const rows = await query(
      `SELECT *
       FROM \`groups\`
       WHERE id = ?`,
      [req.params.id],
    );

    return res.json({
      group: rows[0],
    });
  } catch (e) {
    console.error(e);

    return res.status(500).json({
      message: 'Erro ao atualizar grupo.',
    });
  }
}

/* =========================================================
   EXCLUIR GRUPO
   ========================================================= */

export async function deleteGroup(req, res) {
  try {
    const groupId = req.params.id;

    // Somente o dono pode excluir o grupo.
    const me = await isMember(groupId, req.user.id, ['owner']);

    if (!me) {
      return res.status(403).json({
        message: 'Somente o dono pode excluir o grupo.',
      });
    }

    // Excluir primeiro os registros das atividades.
    await query(
      `DELETE gl
       FROM group_activity_logs gl
       INNER JOIN group_activities ga
         ON ga.id = gl.activity_id
       WHERE ga.group_id = ?`,
      [groupId],
    );

    // Excluir as atividades do grupo.
    await query(
      `DELETE FROM group_activities
       WHERE group_id = ?`,
      [groupId],
    );

    // Excluir os convites.
    await query(
      `DELETE FROM group_invitations
       WHERE group_id = ?`,
      [groupId],
    );

    // Excluir os membros.
    await query(
      `DELETE FROM group_members
       WHERE group_id = ?`,
      [groupId],
    );

    // Excluir o grupo.
    await query(
      `DELETE FROM \`groups\`
       WHERE id = ?
         AND owner_id = ?`,
      [groupId, req.user.id],
    );

    return res.json({
      ok: true,
      message: 'Grupo excluído com sucesso.',
    });
  } catch (e) {
    console.error('Erro ao excluir grupo:', e);

    return res.status(500).json({
      message: 'Erro ao excluir grupo.',
    });
  }
}
/* =========================================================
   LISTAR MEMBROS
   ========================================================= */

export async function listMembers(req, res) {
  try {
    const me = await isMember(req.params.id, req.user.id);

    if (!me) {
      return res.status(403).json({
        message: 'Você não participa deste grupo.',
      });
    }

    const rows = await query(
      `SELECT
         gm.id,
         gm.user_id,
         gm.role,
         gm.status,
         gm.joined_at,
         u.name,
         u.username

       FROM group_members gm

       INNER JOIN users u
         ON u.id = gm.user_id

       WHERE gm.group_id = ?

       ORDER BY
         CASE gm.role
           WHEN 'owner' THEN 1
           WHEN 'admin' THEN 2
           WHEN 'member' THEN 3
           ELSE 4
         END,
         u.name`,
      [req.params.id],
    );

    return res.json({
      members: rows,
    });
  } catch (e) {
    console.error(e);

    return res.status(500).json({
      message: 'Erro ao buscar membros.',
    });
  }
}

/* =========================================================
   CONVIDAR MEMBRO
   ========================================================= */

export async function inviteMember(req, res) {
  try {
    const me = await isMember(req.params.id, req.user.id, ['owner', 'admin']);

    if (!me) {
      return res.status(403).json({
        message: 'Você não pode convidar membros.',
      });
    }

    const { userId } = req.body;

    if (!userId || userId === req.user.id) {
      return res.status(400).json({
        message: 'Usuário inválido.',
      });
    }

    const conn = await query(
      `SELECT id
       FROM connections
       WHERE status = 'accepted'
         AND (
           (requester_id = ? AND receiver_id = ?)
           OR
           (requester_id = ? AND receiver_id = ?)
         )
       LIMIT 1`,
      [req.user.id, userId, userId, req.user.id],
    );

    if (!conn[0]) {
      return res.status(403).json({
        message: 'O usuário precisa ser uma conexão aceita.',
      });
    }

    const existing = await query(
      `SELECT
         id,
         status
       FROM group_members
       WHERE group_id = ?
         AND user_id = ?
       LIMIT 1`,
      [req.params.id, userId],
    );

    if (existing[0]?.status === 'accepted') {
      return res.status(409).json({
        message: 'Usuário já está no grupo.',
      });
    }

    const pending = await query(
      `SELECT id
       FROM group_invitations
       WHERE group_id = ?
         AND invitee_id = ?
         AND status = 'pending'
       LIMIT 1`,
      [req.params.id, userId],
    );

    if (pending[0]) {
      return res.status(409).json({
        message: 'Já existe um convite pendente.',
      });
    }

    if (existing[0]) {
      await query(
        `UPDATE group_members
         SET status = 'pending'
         WHERE id = ?`,
        [existing[0].id],
      );
    } else {
      await query(
        `INSERT INTO group_members
          (id, group_id, user_id, role, status)
         VALUES (?, ?, ?, ?, ?)`,
        [randomUUID(), req.params.id, userId, 'member', 'pending'],
      );
    }

    const invitationId = randomUUID();

    await query(
      `INSERT INTO group_invitations
        (id, group_id, inviter_id, invitee_id)
       VALUES (?, ?, ?, ?)`,
      [invitationId, req.params.id, req.user.id, userId],
    );

    await notify(
      userId,
      'group_invitation',
      'Convite para grupo',
      `${me.group_name}: você recebeu um convite para entrar no grupo.`,
      {
        groupId: req.params.id,
        invitationId,
      },
    );

    return res.status(201).json({
      ok: true,
    });
  } catch (e) {
    console.error(e);

    return res.status(500).json({
      message: 'Erro ao convidar membro.',
    });
  }
}

/* =========================================================
   LISTAR CONVITES
   ========================================================= */

export async function listInvitations(req, res) {
  try {
    const rows = await query(
      `SELECT
         gi.*,
         g.name AS group_name,
         g.description,
         u.name AS inviter_name,
         u.username AS inviter_username

       FROM group_invitations gi

       INNER JOIN \`groups\` g
         ON g.id = gi.group_id

       INNER JOIN users u
         ON u.id = gi.inviter_id

       WHERE gi.invitee_id = ?
         AND gi.status = 'pending'

       ORDER BY gi.created_at DESC`,
      [req.user.id],
    );

    return res.json({
      invitations: rows,
    });
  } catch (e) {
    console.error(e);

    return res.status(500).json({
      message: 'Erro ao buscar convites.',
    });
  }
}

/* =========================================================
   RESPONDER CONVITE
   ========================================================= */

export async function respondInvitation(req, res) {
  try {
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        message: 'Status inválido.',
      });
    }

    const rows = await query(
      `SELECT
         gi.*,
         g.name

       FROM group_invitations gi

       INNER JOIN \`groups\` g
         ON g.id = gi.group_id

       WHERE gi.id = ?
         AND gi.invitee_id = ?
         AND gi.status = 'pending'

       LIMIT 1`,
      [req.params.id, req.user.id],
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: 'Convite não encontrado.',
      });
    }

    await query(
      `UPDATE group_invitations
       SET status = ?
       WHERE id = ?`,
      [status, req.params.id],
    );

    /*
     * O ENUM de group_members usa:
     * pending / accepted / declined
     *
     * Portanto, convite rejeitado
     * vira membro declined.
     */

    const memberStatus = status === 'accepted' ? 'accepted' : 'declined';

    await query(
      `UPDATE group_members
       SET
         status = ?,
         joined_at =
           CASE
             WHEN ? = 'accepted'
             THEN NOW()
             ELSE joined_at
           END
       WHERE group_id = ?
         AND user_id = ?`,
      [memberStatus, status, rows[0].group_id, req.user.id],
    );

    await notify(
      rows[0].inviter_id,
      'group_invitation_response',
      'Resposta ao convite',
      `${rows[0].name}: o convite foi ${
        status === 'accepted' ? 'aceito' : 'recusado'
      }.`,
      {
        groupId: rows[0].group_id,
      },
    );

    return res.json({
      ok: true,
    });
  } catch (e) {
    console.error(e);

    return res.status(500).json({
      message: 'Erro ao responder convite.',
    });
  }
}

/* =========================================================
   ATUALIZAR MEMBRO
   ========================================================= */

export async function updateMember(req, res) {
  try {
    const me = await isMember(req.params.id, req.user.id, ['owner']);

    if (!me) {
      return res.status(403).json({
        message: 'Somente o dono pode alterar cargos.',
      });
    }

    const { role, status } = req.body;

    if (role && !['admin', 'member'].includes(role)) {
      return res.status(400).json({
        message: 'Cargo inválido.',
      });
    }

    /*
     * Não usamos "removed" porque
     * o ENUM da tabela usa declined.
     */
    if (status && !['accepted', 'declined'].includes(status)) {
      return res.status(400).json({
        message: 'Status inválido.',
      });
    }

    const target = await query(
      `SELECT *
       FROM group_members
       WHERE id = ?
         AND group_id = ?
       LIMIT 1`,
      [req.params.memberId, req.params.id],
    );

    if (!target[0] || target[0].role === 'owner') {
      return res.status(404).json({
        message: 'Membro não encontrado.',
      });
    }

    await query(
      `UPDATE group_members
       SET
         role = COALESCE(?, role),
         status = COALESCE(?, status),
         joined_at =
           CASE
             WHEN ? = 'accepted'
             THEN COALESCE(joined_at, NOW())
             ELSE joined_at
           END
       WHERE id = ?`,
      [role || null, status || null, status || '', req.params.memberId],
    );

    return res.json({
      ok: true,
    });
  } catch (e) {
    console.error(e);

    return res.status(500).json({
      message: 'Erro ao atualizar membro.',
    });
  }
}

/* =========================================================
   CRIAR ATIVIDADE
   ========================================================= */

export async function createActivity(req, res) {
  try {
    const me = await isMember(req.params.id, req.user.id, [
      'owner',
      'admin',
      'member',
    ]);

    if (!me) {
      return res.status(403).json({
        message: 'Você não participa deste grupo.',
      });
    }

    const {
      title,
      description = '',
      type = 'habit',
      frequency = 'daily',
      targetDate = null,
    } = req.body;

    if (!String(title || '').trim()) {
      return res.status(400).json({
        message: 'Título obrigatório.',
      });
    }

    if (
      !['habit', 'study', 'reading', 'goal', 'project', 'custom'].includes(
        type,
      ) ||
      !['daily', 'weekly', 'once'].includes(frequency)
    ) {
      return res.status(400).json({
        message: 'Atividade inválida.',
      });
    }

    const id = randomUUID();

    await query(
      `INSERT INTO group_activities
        (
          id,
          group_id,
          creator_id,
          title,
          description,
          type,
          frequency,
          target_date
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.params.id,
        req.user.id,
        String(title).trim(),
        String(description).trim(),
        type,
        frequency,
        targetDate || null,
      ],
    );

    const rows = await query(
      `SELECT *
       FROM group_activities
       WHERE id = ?`,
      [id],
    );

    return res.status(201).json({
      activity: rows[0],
    });
  } catch (e) {
    console.error(e);

    return res.status(500).json({
      message: 'Erro ao criar atividade.',
    });
  }
}

/* =========================================================
   LISTAR ATIVIDADES
   ========================================================= */

export async function listActivities(req, res) {
  try {
    const me = await isMember(req.params.id, req.user.id);

    if (!me) {
      return res.status(403).json({
        message: 'Você não participa deste grupo.',
      });
    }

    const rows = await query(
      `SELECT
         ga.*,
         u.name AS creator_name,

         (
           SELECT COUNT(*)
           FROM group_activity_logs gl
           WHERE gl.activity_id = ga.id
             AND gl.user_id = ?
             AND gl.log_date = CURDATE()
         ) AS done_today

       FROM group_activities ga

       INNER JOIN users u
         ON u.id = ga.creator_id

       WHERE ga.group_id = ?

       ORDER BY ga.created_at DESC`,
      [req.user.id, req.params.id],
    );

    return res.json({
      activities: rows,
    });
  } catch (e) {
    console.error(e);

    return res.status(500).json({
      message: 'Erro ao buscar atividades.',
    });
  }
}

/* =========================================================
   REGISTRAR ATIVIDADE
   ========================================================= */

export async function logActivity(req, res) {
  try {
    const me = await isMember(req.params.id, req.user.id);

    if (!me) {
      return res.status(403).json({
        message: 'Você não participa deste grupo.',
      });
    }

    const { date, note = '', progress = 1 } = req.body;

    const d = date || new Date().toISOString().slice(0, 10);

    const act = await query(
      `SELECT id
       FROM group_activities
       WHERE id = ?
         AND group_id = ?
       LIMIT 1`,
      [req.params.activityId, req.params.id],
    );

    if (!act[0]) {
      return res.status(404).json({
        message: 'Atividade não encontrada.',
      });
    }

    await query(
      `INSERT INTO group_activity_logs
        (
          id,
          activity_id,
          user_id,
          log_date,
          note,
          progress
        )
       VALUES (?, ?, ?, ?, ?, ?)

       ON DUPLICATE KEY UPDATE
         note = VALUES(note),
         progress = VALUES(progress)`,
      [
        randomUUID(),
        req.params.activityId,
        req.user.id,
        d,
        String(note),
        Number(progress) || 1,
      ],
    );

    return res.json({
      ok: true,
    });
  } catch (e) {
    console.error(e);

    return res.status(500).json({
      message: 'Erro ao registrar atividade.',
    });
  }
}

/* =========================================================
   HISTÓRICO DA ATIVIDADE
   ========================================================= */

export async function activityHistory(req, res) {
  try {
    const me = await isMember(req.params.id, req.user.id);

    if (!me) {
      return res.status(403).json({
        message: 'Você não participa deste grupo.',
      });
    }

    const rows = await query(
      `SELECT
         gl.*,
         u.name,
         u.username

       FROM group_activity_logs gl

       INNER JOIN users u
         ON u.id = gl.user_id

       WHERE gl.activity_id = ?

       ORDER BY
         gl.log_date DESC,
         gl.created_at DESC`,
      [req.params.activityId],
    );

    return res.json({
      logs: rows,
    });
  } catch (e) {
    console.error(e);

    return res.status(500).json({
      message: 'Erro ao buscar histórico.',
    });
  }
}
