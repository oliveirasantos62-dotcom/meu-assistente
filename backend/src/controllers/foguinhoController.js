import { randomUUID } from 'crypto';
import { query } from '../db/pool.js';

const TYPES = ['habit', 'goal', 'study', 'reading', 'project', 'custom'];

const PRIVACIES = ['private', 'connections'];

const FREQUENCIES = ['daily', 'weekly', 'custom', 'once'];

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function notify(userId, type, title, message, data = {}) {
  await query(
    `INSERT INTO notifications
      (id, user_id, type, title, message, data_json)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [randomUUID(), userId, type, title, message, JSON.stringify(data)],
  );
}

async function isConnection(userA, userB) {
  const rows = await query(
    `SELECT id
       FROM connections
      WHERE status = 'accepted'
        AND (
          (requester_id = ? AND receiver_id = ?)
          OR
          (requester_id = ? AND receiver_id = ?)
        )
      LIMIT 1`,
    [userA, userB, userB, userA],
  );

  return Boolean(rows[0]);
}

export async function listActivities(req, res) {
  try {
    const rows = await query(
      `SELECT
         a.id,
         a.title,
         a.description,
         a.type,
         a.privacy,
         a.frequency,
         a.target_date,
         a.active,
         a.owner_id,
         a.created_at,
         u.name AS owner_name,
         m.role AS my_role,
         m.status AS my_status,
         (
           SELECT COUNT(*)
           FROM shared_activity_members sm
           WHERE sm.activity_id = a.id
             AND sm.status = 'accepted'
         ) AS member_count
       FROM shared_activities a
       INNER JOIN shared_activity_members m
         ON m.activity_id = a.id
        AND m.user_id = ?
       INNER JOIN users u
         ON u.id = a.owner_id
      WHERE m.status = 'accepted'
        AND a.active = 1
      ORDER BY a.created_at DESC`,
      [req.user.id],
    );

    for (const row of rows) {
      row.today_done = Boolean(
        (
          await query(
            `SELECT id
               FROM shared_activity_logs
              WHERE activity_id = ?
                AND user_id = ?
                AND log_date = ?
              LIMIT 1`,
            [row.id, req.user.id, today()],
          )
        )[0],
      );

      const stats = await query(
        `SELECT
           user_id,
           COUNT(*) AS total_days,
           MAX(log_date) AS last_date
         FROM shared_activity_logs
        WHERE activity_id = ?
        GROUP BY user_id`,
        [row.id],
      );

      row.member_stats = stats;
    }

    return res.json({
      activities: rows,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Erro ao carregar o Foguinho.',
    });
  }
}

export async function createActivity(req, res) {
  try {
    const {
      title,
      description = '',
      type = 'habit',
      privacy = 'connections',
      frequency = 'daily',
      targetDate = null,
      selectedUserIds = [],
    } = req.body;

    if (!String(title || '').trim()) {
      return res.status(400).json({
        message: 'Informe um título.',
      });
    }

    if (
      !TYPES.includes(type) ||
      !PRIVACIES.includes(privacy) ||
      !FREQUENCIES.includes(frequency)
    ) {
      return res.status(400).json({
        message: 'Configuração de atividade inválida.',
      });
    }

    /*
     * Normaliza a lista recebida pelo frontend.
     *
     * Aceitamos somente array.
     * Também removemos duplicados.
     */
    const userIds = Array.isArray(selectedUserIds)
      ? [
          ...new Set(
            selectedUserIds.map((id) => String(id).trim()).filter(Boolean),
          ),
        ]
      : [];

    /*
     * Atividade privada:
     * não pode possuir participantes selecionados.
     */
    if (privacy === 'private') {
      if (userIds.length > 0) {
        return res.status(400).json({
          message: 'Uma atividade privada não pode ter participantes.',
        });
      }
    }

    /*
     * Atividade compartilhada:
     * exige pelo menos uma conexão.
     */
    if (privacy === 'connections' && userIds.length === 0) {
      return res.status(400).json({
        message:
          'Selecione pelo menos uma conexão para compartilhar o Foguinho.',
      });
    }

    /*
     * Nunca permitimos que o próprio dono seja
     * convidado para o próprio Foguinho.
     */
    if (userIds.includes(String(req.user.id))) {
      return res.status(400).json({
        message: 'Você não pode selecionar a si mesmo como participante.',
      });
    }

    /*
     * Antes de criar a atividade, validamos TODOS
     * os usuários selecionados.
     *
     * Isso impede que alguém envie manualmente pelo
     * frontend um ID de usuário que não é conexão.
     */
    if (privacy === 'connections') {
      for (const userId of userIds) {
        const connected = await isConnection(req.user.id, userId);

        if (!connected) {
          return res.status(403).json({
            message: 'Uma das pessoas selecionadas não é uma conexão aceita.',
          });
        }
      }
    }

    /*
     * Cria a atividade.
     */
    const id = randomUUID();

    await query(
      `INSERT INTO shared_activities
        (
          id,
          owner_id,
          title,
          description,
          type,
          privacy,
          frequency,
          target_date
        )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.user.id,
        title.trim(),
        String(description).trim(),
        type,
        privacy,
        frequency,
        targetDate || null,
      ],
    );

    /*
     * O criador sempre entra como owner/accepted.
     */
    await query(
      `INSERT INTO shared_activity_members
        (
          id,
          activity_id,
          user_id,
          role,
          status,
          joined_at
        )
       VALUES (?, ?, ?, 'owner', 'accepted', CURRENT_TIMESTAMP)`,
      [randomUUID(), id, req.user.id],
    );

    /*
     * Se for compartilhado, cria:
     *
     * 1. membro pending
     * 2. convite
     * 3. notificação
     *
     * SOMENTE para as pessoas selecionadas.
     */
    if (privacy === 'connections' && userIds.length > 0) {
      for (const userId of userIds) {
        await query(
          `INSERT INTO shared_activity_members
            (
              id,
              activity_id,
              user_id,
              role,
              status
            )
           VALUES (?, ?, ?, 'member', 'pending')`,
          [randomUUID(), id, userId],
        );

        await query(
          `INSERT INTO foguinho_invitations
            (
              id,
              activity_id,
              inviter_id,
              invitee_id,
              status
            )
           VALUES (?, ?, ?, ?, 'pending')`,
          [randomUUID(), id, req.user.id, userId],
        );

        await notify(
          userId,
          'foguinho_invitation',
          '🔥 Convite para o Foguinho',
          `Você foi convidado para participar de “${title.trim()}”.`,
          {
            activityId: id,
          },
        );
      }
    }

    const rows = await query(
      `SELECT *
         FROM shared_activities
        WHERE id = ?`,
      [id],
    );

    return res.status(201).json({
      activity: rows[0],
      invitedUsers: userIds.length,
    });
  } catch (error) {
    console.error('Erro ao criar atividade compartilhada:', error);

    return res.status(500).json({
      message: 'Erro ao criar atividade compartilhada.',
    });
  }
}

export async function inviteToActivity(req, res) {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const activity = (
      await query(
        `SELECT *
           FROM shared_activities
          WHERE id = ?
            AND owner_id = ?`,
        [id, req.user.id],
      )
    )[0];

    if (!activity) {
      return res.status(404).json({
        message: 'Atividade não encontrada ou sem permissão.',
      });
    }

    if (!userId || userId === req.user.id) {
      return res.status(400).json({
        message: 'Usuário inválido.',
      });
    }

    if (activity.privacy === 'private') {
      return res.status(403).json({
        message: 'Esta atividade é privada.',
      });
    }

    if (!(await isConnection(req.user.id, userId))) {
      return res.status(403).json({
        message: 'Vocês precisam estar conectados primeiro.',
      });
    }

    const existing = (
      await query(
        `SELECT id, status
           FROM shared_activity_members
          WHERE activity_id = ?
            AND user_id = ?`,
        [id, userId],
      )
    )[0];

    if (existing?.status === 'accepted') {
      return res.status(409).json({
        message: 'Essa pessoa já participa.',
      });
    }

    const pending = (
      await query(
        `SELECT id
           FROM foguinho_invitations
          WHERE activity_id = ?
            AND invitee_id = ?
            AND status = 'pending'`,
        [id, userId],
      )
    )[0];

    if (pending) {
      return res.status(409).json({
        message: 'Convite já enviado.',
      });
    }

    if (existing) {
      await query(
        `UPDATE shared_activity_members
            SET status = 'pending'
          WHERE id = ?`,
        [existing.id],
      );
    } else {
      await query(
        `INSERT INTO shared_activity_members
          (
            id,
            activity_id,
            user_id,
            role,
            status
          )
         VALUES (?, ?, ?, 'member', 'pending')`,
        [randomUUID(), id, userId],
      );
    }

    await query(
      `INSERT INTO foguinho_invitations
        (
          id,
          activity_id,
          inviter_id,
          invitee_id
        )
       VALUES (?, ?, ?, ?)`,
      [randomUUID(), id, req.user.id, userId],
    );

    await notify(
      userId,
      'foguinho_invitation',
      '🔥 Convite para o Foguinho',
      `Você foi convidado para participar de “${activity.title}”.`,
      {
        activityId: id,
      },
    );

    return res.status(201).json({
      message: 'Convite enviado.',
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Erro ao convidar participante.',
    });
  }
}

export async function listInvitations(req, res) {
  try {
    const rows = await query(
      `SELECT
         i.id,
         i.activity_id,
         i.status,
         i.created_at,
         a.title,
         a.type,
         a.privacy,
         u.name AS inviter_name,
         u.username AS inviter_username
       FROM foguinho_invitations i
       INNER JOIN shared_activities a
         ON a.id = i.activity_id
       INNER JOIN users u
         ON u.id = i.inviter_id
      WHERE i.invitee_id = ?
        AND i.status = 'pending'
      ORDER BY i.created_at DESC`,
      [req.user.id],
    );

    return res.json({
      invitations: rows,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Erro ao carregar convites.',
    });
  }
}

export async function respondInvitation(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        message: 'Resposta inválida.',
      });
    }

    const invitation = (
      await query(
        `SELECT *
           FROM foguinho_invitations
          WHERE id = ?
            AND invitee_id = ?
            AND status = 'pending'`,
        [id, req.user.id],
      )
    )[0];

    if (!invitation) {
      return res.status(404).json({
        message: 'Convite não encontrado.',
      });
    }

    await query(
      `UPDATE foguinho_invitations
          SET status = ?
        WHERE id = ?`,
      [status, id],
    );

    await query(
      `UPDATE shared_activity_members
          SET status = ?${
            status === 'accepted' ? ', joined_at = CURRENT_TIMESTAMP' : ''
          }
        WHERE activity_id = ?
          AND user_id = ?`,
      [
        status === 'accepted' ? 'accepted' : 'declined',
        invitation.activity_id,
        req.user.id,
      ],
    );

    const activity = (
      await query(
        `SELECT title, owner_id
           FROM shared_activities
          WHERE id = ?`,
        [invitation.activity_id],
      )
    )[0];

    if (activity) {
      await notify(
        activity.owner_id,
        'foguinho_response',
        status === 'accepted' ? '🔥 Convite aceito' : 'Convite recusado',
        `${req.user.id === activity.owner_id ? '' : 'Um participante'} ${
          status === 'accepted' ? 'entrou' : 'recusou'
        } “${activity.title}”.`,
        {
          activityId: invitation.activity_id,
        },
      );
    }

    return res.json({
      message: status === 'accepted' ? 'Convite aceito.' : 'Convite recusado.',
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Erro ao responder ao convite.',
    });
  }
}

export async function logActivity(req, res) {
  try {
    const { id } = req.params;

    const { date = today(), note = '', progress = 1 } = req.body;

    const member = (
      await query(
        `SELECT id
           FROM shared_activity_members
          WHERE activity_id = ?
            AND user_id = ?
            AND status = 'accepted'`,
        [id, req.user.id],
      )
    )[0];

    if (!member) {
      return res.status(403).json({
        message: 'Você não participa desta atividade.',
      });
    }

    const existing = (
      await query(
        `SELECT id
           FROM shared_activity_logs
          WHERE activity_id = ?
            AND user_id = ?
            AND log_date = ?`,
        [id, req.user.id, date],
      )
    )[0];

    if (existing) {
      await query(
        `UPDATE shared_activity_logs
            SET note = ?,
                progress = ?
          WHERE id = ?`,
        [String(note).trim(), Math.max(1, Number(progress) || 1), existing.id],
      );
    } else {
      await query(
        `INSERT INTO shared_activity_logs
          (
            id,
            activity_id,
            user_id,
            log_date,
            note,
            progress
          )
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          randomUUID(),
          id,
          req.user.id,
          date,
          String(note).trim(),
          Math.max(1, Number(progress) || 1),
        ],
      );
    }

    const activity = (
      await query(
        `SELECT title, owner_id
           FROM shared_activities
          WHERE id = ?`,
        [id],
      )
    )[0];

    const members = await query(
      `SELECT user_id
         FROM shared_activity_members
        WHERE activity_id = ?
          AND status = 'accepted'
          AND user_id <> ?`,
      [id, req.user.id],
    );

    for (const member of members) {
      await notify(
        member.user_id,
        'foguinho_activity',
        '🔥 Atividade registrada',
        `Uma atividade foi registrada em “${activity.title}”.`,
        {
          activityId: id,
          date,
        },
      );
    }

    return res.json({
      message: 'Atividade registrada.',
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Erro ao registrar atividade.',
    });
  }
}

export async function activityHistory(req, res) {
  try {
    const { id } = req.params;

    const member = (
      await query(
        `SELECT id
           FROM shared_activity_members
          WHERE activity_id = ?
            AND user_id = ?
            AND status = 'accepted'`,
        [id, req.user.id],
      )
    )[0];

    if (!member) {
      return res.status(403).json({
        message: 'Você não participa desta atividade.',
      });
    }

    const logs = await query(
      `SELECT
         l.id,
         l.user_id,
         l.log_date,
         l.note,
         l.progress,
         u.name,
         u.username
       FROM shared_activity_logs l
       INNER JOIN users u
         ON u.id = l.user_id
      WHERE l.activity_id = ?
      ORDER BY
        l.log_date DESC,
        l.created_at DESC
      LIMIT 200`,
      [id],
    );

    return res.json({
      logs,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Erro ao carregar histórico.',
    });
  }
}

export async function listNotifications(req, res) {
  try {
    const rows = await query(
      `SELECT
         id,
         type,
         title,
         message,
         data_json,
         read_at,
         created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id],
    );

    return res.json({
      notifications: rows.map((row) => ({
        ...row,
        data: row.data_json
          ? typeof row.data_json === 'string'
            ? JSON.parse(row.data_json)
            : row.data_json
          : {},
      })),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Erro ao carregar notificações.',
    });
  }
}

export async function markNotificationRead(req, res) {
  try {
    await query(
      `UPDATE notifications
          SET read_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND user_id = ?`,
      [req.params.id, req.user.id],
    );

    return res.json({
      message: 'Notificação marcada como lida.',
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Erro ao atualizar notificação.',
    });
  }
}
