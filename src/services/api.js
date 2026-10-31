const API_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:3001'
).replace(/\/$/, '');

const TOKEN_KEY = 'meu-assistente-token';
const USER_KEY = 'meu-assistente-user';

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);

    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';

  const body = contentType.includes('application/json')
    ? await response.json()
    : null;

  if (!response.ok) {
    const error = new Error(body?.message || `Erro HTTP ${response.status}.`);

    error.status = response.status;

    throw error;
  }

  return body;
}

/*
|--------------------------------------------------------------------------
| AUTENTICAÇÃO
|--------------------------------------------------------------------------
*/

export async function registerUser({ name, email, password, username }) {
  const result = await request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name,
      email,
      password,
      username,
    }),
  });

  saveSession(result.token, {
    ...result.user,
    authProvider: 'backend',
  });

  return {
    ...result.user,
    authProvider: 'backend',
  };
}

export async function loginUser({ email, password }) {
  const result = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
    }),
  });

  saveSession(result.token, {
    ...result.user,
    authProvider: 'backend',
  });

  return {
    ...result.user,
    authProvider: 'backend',
  };
}

export async function getCurrentUser() {
  const token = getToken();

  if (!token) {
    return null;
  }

  try {
    const result = await request('/api/auth/me');

    const user = {
      ...result.user,
      authProvider: 'backend',
    };

    localStorage.setItem(USER_KEY, JSON.stringify(user));

    return user;
  } catch (error) {
    if (error.status === 401 || error.status === 404) {
      clearSession();
    }

    throw error;
  }
}

/*
|--------------------------------------------------------------------------
| ATUALIZAÇÃO DO PERFIL
|--------------------------------------------------------------------------
*/

export async function updateProfile(payload) {
  const result = await request('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  const user = {
    ...result.user,
    authProvider: 'backend',
  };

  /*
   * Atualiza o usuário salvo no navegador
   */
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  return user;
}

/*
|--------------------------------------------------------------------------
| CONEXÕES
|--------------------------------------------------------------------------
*/

export async function searchUsers(query) {
  const result = await request(
    `/api/connections/search?q=${encodeURIComponent(query)}`,
  );

  return result.users || [];
}

export async function getConnections() {
  const result = await request('/api/connections');

  return result.connections || [];
}

export async function sendConnection(userId) {
  const result = await request('/api/connections', {
    method: 'POST',
    body: JSON.stringify({
      userId,
    }),
  });

  return result.connection;
}

export async function updateConnection(id, status) {
  const result = await request(`/api/connections/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status,
    }),
  });

  return result.connection;
}

/*
|--------------------------------------------------------------------------
| FOGUINHO
|--------------------------------------------------------------------------
*/

export async function getFoguinhoActivities() {
  const result = await request('/api/foguinho/activities');

  return result.activities || [];
}

export async function createFoguinhoActivity(payload) {
  const result = await request('/api/foguinho/activities', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return result.activity;
}

export async function inviteFoguinhoMember(activityId, userId) {
  return request(`/api/foguinho/activities/${activityId}/invite`, {
    method: 'POST',
    body: JSON.stringify({
      userId,
    }),
  });
}

export async function getFoguinhoInvitations() {
  const result = await request('/api/foguinho/invitations');

  return result.invitations || [];
}

export async function respondFoguinhoInvitation(id, status) {
  return request(`/api/foguinho/invitations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status,
    }),
  });
}

export async function logFoguinhoActivity(activityId, payload = {}) {
  return request(`/api/foguinho/activities/${activityId}/log`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getFoguinhoHistory(activityId) {
  const result = await request(
    `/api/foguinho/activities/${activityId}/history`,
  );

  return result.logs || [];
}

export async function getNotifications() {
  const result = await request('/api/foguinho/notifications');

  return result.notifications || [];
}

export async function markNotificationRead(id) {
  return request(`/api/foguinho/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

/*
|--------------------------------------------------------------------------
| ESTUDOS
|--------------------------------------------------------------------------
*/

export async function getStudyDashboard() {
  const result = await request('/api/study/dashboard');

  return result;
}

export async function createStudySession(payload) {
  const result = await request('/api/study/sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return result.session;
}

export async function createReading(payload) {
  const result = await request('/api/study/readings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return result.reading;
}

export async function updateReading(id, payload) {
  const result = await request(`/api/study/readings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  return result.reading;
}

export async function createReview(payload) {
  const result = await request('/api/study/reviews', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return result.review;
}

export async function reviewStudyItem(id, rating) {
  const result = await request(`/api/study/reviews/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({
      rating,
    }),
  });

  return result.review;
}

export async function createStudyError(payload) {
  const result = await request('/api/study/errors', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return result.error;
}

export async function toggleStudyError(id) {
  const result = await request(`/api/study/errors/${id}/toggle`, {
    method: 'PATCH',
  });

  return result.error;
}

export async function migrateLocalStudyData(payload) {
  return request('/api/study/migrate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/*
|--------------------------------------------------------------------------
| INVESTIMENTOS
|--------------------------------------------------------------------------
*/

export async function getInvestmentDashboard() {
  return request('/api/investments/dashboard');
}

export async function migrateLocalInvestments(payload) {
  return request('/api/investments/migrate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createInvestment(payload) {
  const result = await request('/api/investments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return result.investment;
}

export async function updateInvestment(id, payload) {
  const result = await request(`/api/investments/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  return result.investment;
}

export async function deleteInvestment(id) {
  return request(`/api/investments/${id}`, {
    method: 'DELETE',
  });
}

export async function saveInvestmentSnapshot(payload) {
  const result = await request('/api/investments/snapshots', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return result.portfolioHistory || [];
}

/*
|--------------------------------------------------------------------------
| PROJETOS COLABORATIVOS
|--------------------------------------------------------------------------
*/

export async function getCollaborativeProjects() {
  const result = await request('/api/projects');

  return result.projects || [];
}

export async function createCollaborativeProject(payload) {
  const result = await request('/api/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return result.project;
}

export async function updateCollaborativeProject(id, payload) {
  const result = await request(`/api/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  return result.project;
}

export async function deleteCollaborativeProject(id) {
  return request(`/api/projects/${id}`, {
    method: 'DELETE',
  });
}

export async function getProjectMembers(id) {
  const result = await request(`/api/projects/${id}/members`);

  return result.members || [];
}

export async function inviteProjectMember(projectId, userId) {
  return request(`/api/projects/${projectId}/invite`, {
    method: 'POST',
    body: JSON.stringify({
      userId,
    }),
  });
}

export async function getProjectInvitations() {
  const result = await request('/api/projects/invitations/pending');

  return result.invitations || [];
}

export async function respondProjectInvitation(id, status) {
  return request(`/api/projects/invitations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status,
    }),
  });
}

export async function getProjectTasks(projectId) {
  const result = await request(`/api/projects/${projectId}/tasks`);

  return result.tasks || [];
}

export async function createProjectTask(projectId, payload) {
  const result = await request(`/api/projects/${projectId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return result.task;
}

export async function updateProjectTask(projectId, taskId, payload) {
  const result = await request(`/api/projects/${projectId}/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  return result.task;
}

export async function deleteProjectTask(projectId, taskId) {
  return request(`/api/projects/${projectId}/tasks/${taskId}`, {
    method: 'DELETE',
  });
}

export async function getProjectTaskHistory(projectId, taskId) {
  const result = await request(
    `/api/projects/${projectId}/tasks/${taskId}/history`,
  );

  return result.history || [];
}

/*
|--------------------------------------------------------------------------
| GRUPOS
|--------------------------------------------------------------------------
*/

export async function getGroups() {
  const result = await request('/api/groups');

  return result.groups || [];
}

export async function createGroup(payload) {
  const result = await request('/api/groups', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return result.group;
}

export async function updateGroup(id, payload) {
  const result = await request(`/api/groups/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  return result.group;
}

export async function deleteGroup(id) {
  return request(`/api/groups/${id}`, {
    method: 'DELETE',
  });
}

export async function getGroupMembers(id) {
  const result = await request(`/api/groups/${id}/members`);

  return result.members || [];
}

export async function inviteGroupMember(groupId, userId) {
  return request(`/api/groups/${groupId}/invite`, {
    method: 'POST',
    body: JSON.stringify({
      userId,
    }),
  });
}

export async function getGroupInvitations() {
  const result = await request('/api/groups/invitations/pending');

  return result.invitations || [];
}

export async function respondGroupInvitation(id, status) {
  return request(`/api/groups/invitations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status,
    }),
  });
}

export async function updateGroupMember(groupId, memberId, payload) {
  return request(`/api/groups/${groupId}/members/${memberId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function getGroupActivities(id) {
  const result = await request(`/api/groups/${id}/activities`);

  return result.activities || [];
}

export async function createGroupActivity(id, payload) {
  const result = await request(`/api/groups/${id}/activities`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return result.activity;
}

export async function logGroupActivity(groupId, activityId, payload) {
  return request(`/api/groups/${groupId}/activities/${activityId}/log`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getGroupActivityHistory(groupId, activityId) {
  const result = await request(
    `/api/groups/${groupId}/activities/${activityId}/history`,
  );

  return result.logs || [];
}
