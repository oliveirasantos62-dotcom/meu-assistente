import { randomUUID } from 'crypto';
import { query } from '../db/pool.js';

const allowedStatus = ['planned', 'active', 'paused', 'completed'];
const allowedPriority = ['low', 'medium', 'high'];
const allowedTaskStatus = ['todo', 'doing', 'done'];

async function getProjectForUser(projectId, userId) {
  const rows = await query(
    `SELECT p.*, pm.role AS my_role, pm.status AS my_membership_status
     FROM collaborative_projects p
     LEFT JOIN collaborative_project_members pm
       ON pm.project_id = p.id AND pm.user_id = ?
     WHERE p.id = ? AND (p.owner_id = ? OR (pm.user_id = ? AND pm.status = 'accepted'))
     LIMIT 1`,
    [userId, projectId, userId, userId],
  );
  return rows[0] || null;
}

async function notify(userId, type, title, message, data = {}) {
  await query(
    `INSERT INTO notifications (id, user_id, type, title, message, data_json)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [randomUUID(), userId, type, title, message, JSON.stringify(data)],
  );
}

export async function listProjects(req, res) {
  try {
    const rows = await query(
      `SELECT p.id, p.owner_id, p.name, p.description, p.priority, p.status, p.deadline, p.privacy,
              p.created_at, p.updated_at, u.name AS owner_name, u.username AS owner_username,
              COUNT(DISTINCT CASE WHEN pm.status = 'accepted' THEN pm.user_id END) AS member_count,
              COUNT(DISTINCT t.id) AS task_count,
              COUNT(DISTINCT CASE WHEN t.status = 'done' THEN t.id END) AS done_task_count,
              COALESCE(ROUND(AVG(t.progress)), 0) AS task_progress,
              CASE WHEN p.owner_id = ? THEN 'owner' ELSE 'member' END AS my_role
       FROM collaborative_projects p
       INNER JOIN users u ON u.id = p.owner_id
       LEFT JOIN collaborative_project_members pm ON pm.project_id = p.id
       LEFT JOIN collaborative_project_tasks t ON t.project_id = p.id
       WHERE p.owner_id = ? OR EXISTS (
         SELECT 1 FROM collaborative_project_members x
         WHERE x.project_id = p.id AND x.user_id = ? AND x.status = 'accepted'
       )
       GROUP BY p.id, p.owner_id, p.name, p.description, p.priority, p.status, p.deadline, p.privacy, p.created_at, p.updated_at, u.name, u.username
       ORDER BY p.updated_at DESC`,
      [req.user.id, req.user.id, req.user.id],
    );
    res.json({ projects: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar projetos colaborativos.' });
  }
}

export async function createProject(req, res) {
  try {
    const {
      name,
      description = '',
      priority = 'medium',
      status = 'active',
      deadline = null,
      privacy = 'connections',
    } = req.body;
    if (!String(name || '').trim())
      return res
        .status(400)
        .json({ message: 'Nome do projeto é obrigatório.' });
    if (
      !allowedPriority.includes(priority) ||
      !allowedStatus.includes(status) ||
      !['private', 'connections'].includes(privacy)
    ) {
      return res
        .status(400)
        .json({ message: 'Configuração do projeto inválida.' });
    }
    const projectId = randomUUID();
    await query(
      `INSERT INTO collaborative_projects (id, owner_id, name, description, priority, status, deadline, privacy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        projectId,
        req.user.id,
        String(name).trim(),
        String(description).trim(),
        priority,
        status,
        deadline || null,
        privacy,
      ],
    );
    await query(
      `INSERT INTO collaborative_project_members (id, project_id, user_id, role, status, joined_at)
       VALUES (?, ?, ?, 'owner', 'accepted', NOW())`,
      [randomUUID(), projectId, req.user.id],
    );
    const project = await getProjectForUser(projectId, req.user.id);
    res.status(201).json({ project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao criar projeto.' });
  }
}

export async function updateProject(req, res) {
  try {
    const project = await getProjectForUser(req.params.id, req.user.id);
    if (!project)
      return res.status(404).json({ message: 'Projeto não encontrado.' });
    if (project.owner_id !== req.user.id)
      return res
        .status(403)
        .json({ message: 'Somente o dono pode editar o projeto.' });
    const { name, description, priority, status, deadline, privacy } = req.body;
    if (priority && !allowedPriority.includes(priority))
      return res.status(400).json({ message: 'Prioridade inválida.' });
    if (status && !allowedStatus.includes(status))
      return res.status(400).json({ message: 'Status inválido.' });
    if (privacy && !['private', 'connections'].includes(privacy))
      return res.status(400).json({ message: 'Privacidade inválida.' });
    await query(
      `UPDATE collaborative_projects SET
       name = COALESCE(?, name), description = COALESCE(?, description), priority = COALESCE(?, priority),
       status = COALESCE(?, status), deadline = ?, privacy = COALESCE(?, privacy)
       WHERE id = ?`,
      [
        name?.trim() || null,
        description === undefined ? null : String(description),
        priority || null,
        status || null,
        deadline || null,
        privacy || null,
        req.params.id,
      ],
    );
    res.json({ project: await getProjectForUser(req.params.id, req.user.id) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao atualizar projeto.' });
  }
}

export async function deleteProject(req, res) {
  try {
    const project = await getProjectForUser(req.params.id, req.user.id);
    if (!project)
      return res.status(404).json({ message: 'Projeto não encontrado.' });
    if (project.owner_id !== req.user.id)
      return res
        .status(403)
        .json({ message: 'Somente o dono pode excluir o projeto.' });
    await query(`DELETE FROM collaborative_projects WHERE id = ?`, [
      req.params.id,
    ]);
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao excluir projeto.' });
  }
}

export async function listMembers(req, res) {
  try {
    const project = await getProjectForUser(req.params.id, req.user.id);
    if (!project)
      return res.status(404).json({ message: 'Projeto não encontrado.' });
    const rows = await query(
      `SELECT pm.id, pm.user_id, pm.role, pm.status, pm.joined_at, u.name, u.username
       FROM collaborative_project_members pm INNER JOIN users u ON u.id = pm.user_id
       WHERE pm.project_id = ? ORDER BY pm.role = 'owner' DESC, u.name`,
      [req.params.id],
    );
    res.json({ members: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar membros.' });
  }
}

export async function inviteMember(req, res) {
  try {
    const project = await getProjectForUser(req.params.id, req.user.id);
    if (!project)
      return res.status(404).json({ message: 'Projeto não encontrado.' });
    if (project.owner_id !== req.user.id)
      return res
        .status(403)
        .json({ message: 'Somente o dono pode convidar membros.' });
    const { userId } = req.body;
    if (!userId || userId === req.user.id)
      return res.status(400).json({ message: 'Usuário inválido.' });
    const connection = await query(
      `SELECT id FROM connections WHERE status = 'accepted' AND ((requester_id = ? AND receiver_id = ?) OR (requester_id = ? AND receiver_id = ?)) LIMIT 1`,
      [req.user.id, userId, userId, req.user.id],
    );
    if (!connection[0])
      return res
        .status(403)
        .json({
          message: 'Você precisa ter uma conexão aceita com esse usuário.',
        });
    const user = await query(
      `SELECT id, name FROM users WHERE id = ? LIMIT 1`,
      [userId],
    );
    if (!user[0])
      return res.status(404).json({ message: 'Usuário não encontrado.' });
    const member = await query(
      `SELECT id, status FROM collaborative_project_members WHERE project_id = ? AND user_id = ? LIMIT 1`,
      [req.params.id, userId],
    );
    if (member[0] && member[0].status === 'accepted')
      return res
        .status(409)
        .json({ message: 'Usuário já participa do projeto.' });
    const pending = await query(
      `SELECT id FROM collaborative_project_invitations WHERE project_id = ? AND invitee_id = ? AND status = 'pending' LIMIT 1`,
      [req.params.id, userId],
    );
    if (pending[0])
      return res
        .status(409)
        .json({ message: 'Já existe um convite pendente.' });
    if (member[0])
      await query(
        `UPDATE collaborative_project_members SET status = 'pending' WHERE id = ?`,
        [member[0].id],
      );
    else
      await query(
        `INSERT INTO collaborative_project_members (id, project_id, user_id, role, status) VALUES (?, ?, ?, 'member', 'pending')`,
        [randomUUID(), req.params.id, userId],
      );
    const invitationId = randomUUID();
    await query(
      `INSERT INTO collaborative_project_invitations (id, project_id, inviter_id, invitee_id) VALUES (?, ?, ?, ?)`,
      [invitationId, req.params.id, req.user.id, userId],
    );
    const inviter = await query(`SELECT name FROM users WHERE id = ? LIMIT 1`, [
      req.user.id,
    ]);
    await notify(
      userId,
      'project_invitation',
      'Convite para projeto',
      `${inviter[0]?.name || 'Um usuário'} convidou você para o projeto "${project.name}".`,
      { projectId: req.params.id, invitationId },
    );
    res.status(201).json({ ok: true, invitationId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao convidar membro.' });
  }
}

export async function listInvitations(req, res) {
  try {
    const rows = await query(
      `SELECT i.id, i.project_id, i.created_at, p.name AS project_name, p.description, u.name AS inviter_name, u.username AS inviter_username
       FROM collaborative_project_invitations i
       INNER JOIN collaborative_projects p ON p.id = i.project_id
       INNER JOIN users u ON u.id = i.inviter_id
       WHERE i.invitee_id = ? AND i.status = 'pending' ORDER BY i.created_at DESC`,
      [req.user.id],
    );
    res.json({ invitations: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar convites de projeto.' });
  }
}

export async function respondInvitation(req, res) {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status))
      return res.status(400).json({ message: 'Resposta inválida.' });
    const rows = await query(
      `SELECT id, project_id, invitee_id FROM collaborative_project_invitations WHERE id = ? AND invitee_id = ? AND status = 'pending' LIMIT 1`,
      [req.params.id, req.user.id],
    );
    if (!rows[0])
      return res.status(404).json({ message: 'Convite não encontrado.' });
    await query(
      `UPDATE collaborative_project_invitations SET status = ? WHERE id = ?`,
      [status, req.params.id],
    );
    await query(
      `UPDATE collaborative_project_members SET status = ?, joined_at = CASE WHEN ? = 'accepted' THEN NOW() ELSE joined_at END WHERE project_id = ? AND user_id = ?`,
      [
        status === 'accepted' ? 'accepted' : 'declined',
        status,
        rows[0].project_id,
        req.user.id,
      ],
    );
    if (status === 'accepted') {
      const owner = await query(
        `SELECT owner_id, name FROM collaborative_projects WHERE id = ?`,
        [rows[0].project_id],
      );
      const memberUser = await query(
        `SELECT name FROM users WHERE id = ? LIMIT 1`,
        [req.user.id],
      );
      if (owner[0])
        await notify(
          owner[0].owner_id,
          'project_invitation_accepted',
          'Convite aceito',
          `${memberUser[0]?.name || 'Um usuário'} entrou no projeto "${owner[0].name}".`,
          { projectId: rows[0].project_id },
        );
    }
    res.json({ ok: true, status });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao responder convite.' });
  }
}

async function assertProjectMember(projectId, userId) {
  const rows = await query(
    `SELECT p.id, p.owner_id, pm.role FROM collaborative_projects p LEFT JOIN collaborative_project_members pm ON pm.project_id = p.id AND pm.user_id = ? WHERE p.id = ? AND (p.owner_id = ? OR (pm.status = 'accepted' AND pm.user_id = ?)) LIMIT 1`,
    [userId, projectId, userId, userId],
  );
  return rows[0] || null;
}

export async function listTasks(req, res) {
  try {
    const project = await assertProjectMember(req.params.id, req.user.id);
    if (!project)
      return res.status(404).json({ message: 'Projeto não encontrado.' });
    const rows = await query(
      `SELECT t.*, u.name AS responsible_name, u.username AS responsible_username, c.name AS creator_name FROM collaborative_project_tasks t LEFT JOIN users u ON u.id = t.responsible_id INNER JOIN users c ON c.id = t.creator_id WHERE t.project_id = ? ORDER BY FIELD(t.status, 'doing','todo','done'), FIELD(t.priority, 'high','medium','low'), t.deadline IS NULL, t.deadline`,
      [req.params.id],
    );
    res.json({ tasks: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar tarefas.' });
  }
}

export async function createTask(req, res) {
  try {
    const project = await assertProjectMember(req.params.id, req.user.id);
    if (!project)
      return res.status(404).json({ message: 'Projeto não encontrado.' });
    const {
      title,
      description = '',
      responsibleId = null,
      status = 'todo',
      priority = 'medium',
      deadline = null,
      progress = 0,
    } = req.body;
    if (!String(title || '').trim())
      return res
        .status(400)
        .json({ message: 'Título da tarefa é obrigatório.' });
    if (
      !allowedTaskStatus.includes(status) ||
      !allowedPriority.includes(priority)
    )
      return res
        .status(400)
        .json({ message: 'Configuração da tarefa inválida.' });
    const safeProgress = Math.min(100, Math.max(0, Number(progress) || 0));
    if (responsibleId) {
      const member = await query(
        `SELECT id FROM collaborative_project_members WHERE project_id = ? AND user_id = ? AND status = 'accepted'`,
        [req.params.id, responsibleId],
      );
      if (!member[0])
        return res
          .status(400)
          .json({ message: 'O responsável precisa ser membro do projeto.' });
    }
    const id = randomUUID();
    await query(
      `INSERT INTO collaborative_project_tasks (id, project_id, creator_id, responsible_id, title, description, status, priority, deadline, progress) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.params.id,
        req.user.id,
        responsibleId || null,
        String(title).trim(),
        String(description).trim(),
        status,
        priority,
        deadline || null,
        status === 'done' ? 100 : safeProgress,
      ],
    );
    await query(
      `INSERT INTO collaborative_task_history (id, task_id, user_id, action, old_value, new_value) VALUES (?, ?, ?, 'created', NULL, ?)`,
      [
        randomUUID(),
        id,
        req.user.id,
        JSON.stringify({ title: String(title).trim() }),
      ],
    );
    if (responsibleId && responsibleId !== req.user.id)
      await notify(
        responsibleId,
        'project_task_assigned',
        'Nova tarefa atribuída',
        `Você recebeu a tarefa "${String(title).trim()}".`,
        { projectId: req.params.id, taskId: id },
      );
    const rows = await query(
      `SELECT t.*, u.name AS responsible_name, u.username AS responsible_username FROM collaborative_project_tasks t LEFT JOIN users u ON u.id = t.responsible_id WHERE t.id = ?`,
      [id],
    );
    res.status(201).json({ task: rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao criar tarefa.' });
  }
}

export async function updateTask(req, res) {
  try {
    const project = await assertProjectMember(
      req.params.projectId,
      req.user.id,
    );
    if (!project)
      return res.status(404).json({ message: 'Projeto não encontrado.' });
    const rows = await query(
      `SELECT * FROM collaborative_project_tasks WHERE id = ? AND project_id = ? LIMIT 1`,
      [req.params.taskId, req.params.projectId],
    );
    if (!rows[0])
      return res.status(404).json({ message: 'Tarefa não encontrada.' });
    const current = rows[0];
    const {
      title,
      description,
      responsibleId,
      status,
      priority,
      deadline,
      progress,
    } = req.body;
    if (status && !allowedTaskStatus.includes(status))
      return res.status(400).json({ message: 'Status inválido.' });
    if (priority && !allowedPriority.includes(priority))
      return res.status(400).json({ message: 'Prioridade inválida.' });
    if (responsibleId) {
      const member = await query(
        `SELECT id FROM collaborative_project_members WHERE project_id = ? AND user_id = ? AND status = 'accepted'`,
        [req.params.projectId, responsibleId],
      );
      if (!member[0])
        return res
          .status(400)
          .json({ message: 'O responsável precisa ser membro do projeto.' });
    }
    const nextStatus = status || current.status;
    const nextProgress =
      nextStatus === 'done'
        ? 100
        : progress === undefined
          ? current.progress
          : Math.min(100, Math.max(0, Number(progress) || 0));
    await query(
      `UPDATE collaborative_project_tasks SET title = COALESCE(?, title), description = COALESCE(?, description), responsible_id = ?, status = ?, priority = ?, deadline = ?, progress = ? WHERE id = ?`,
      [
        title?.trim() || null,
        description === undefined ? null : String(description),
        responsibleId === undefined
          ? current.responsible_id
          : responsibleId || null,
        nextStatus,
        priority || current.priority,
        deadline || null,
        nextProgress,
        req.params.taskId,
      ],
    );
    const changes = {
      status: [current.status, nextStatus],
      progress: [current.progress, nextProgress],
      responsible_id: [
        current.responsible_id,
        responsibleId === undefined
          ? current.responsible_id
          : responsibleId || null,
      ],
    };
    await query(
      `INSERT INTO collaborative_task_history (id, task_id, user_id, action, old_value, new_value) VALUES (?, ?, ?, 'updated', ?, ?)`,
      [
        randomUUID(),
        req.params.taskId,
        req.user.id,
        JSON.stringify(current),
        JSON.stringify(changes),
      ],
    );
    if (
      responsibleId &&
      responsibleId !== current.responsible_id &&
      responsibleId !== req.user.id
    )
      await notify(
        responsibleId,
        'project_task_assigned',
        'Tarefa atribuída',
        `Você recebeu a tarefa "${title || current.title}".`,
        { projectId: req.params.projectId, taskId: req.params.taskId },
      );
    const updated = await query(
      `SELECT t.*, u.name AS responsible_name, u.username AS responsible_username FROM collaborative_project_tasks t LEFT JOIN users u ON u.id = t.responsible_id WHERE t.id = ?`,
      [req.params.taskId],
    );
    res.json({ task: updated[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao atualizar tarefa.' });
  }
}

export async function deleteTask(req, res) {
  try {
    const project = await assertProjectMember(
      req.params.projectId,
      req.user.id,
    );
    if (!project)
      return res.status(404).json({ message: 'Projeto não encontrado.' });
    const rows = await query(
      `SELECT id FROM collaborative_project_tasks WHERE id = ? AND project_id = ?`,
      [req.params.taskId, req.params.projectId],
    );
    if (!rows[0])
      return res.status(404).json({ message: 'Tarefa não encontrada.' });
    await query(`DELETE FROM collaborative_project_tasks WHERE id = ?`, [
      req.params.taskId,
    ]);
    res.json({ ok: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao excluir tarefa.' });
  }
}

export async function taskHistory(req, res) {
  try {
    const project = await assertProjectMember(
      req.params.projectId,
      req.user.id,
    );
    if (!project)
      return res.status(404).json({ message: 'Projeto não encontrado.' });
    const rows = await query(
      `SELECT h.*, u.name, u.username FROM collaborative_task_history h INNER JOIN users u ON u.id = h.user_id WHERE h.task_id = ? ORDER BY h.created_at DESC`,
      [req.params.taskId],
    );
    res.json({ history: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar histórico.' });
  }
}
