export const DAY_MS = 86400000;

export function toDateKey(value = new Date()) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function parseDateKey(value) {
  if (!value) return null;
  const d = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function daysBetween(start, end) {
  const a = parseDateKey(start);
  const b = parseDateKey(end);
  if (!a || !b) return 0;
  return Math.round((b - a) / DAY_MS);
}

export function rangeDates(days = 30, end = new Date()) {
  const endDate = parseDateKey(toDateKey(end));
  if (!endDate) return [];
  return Array.from({ length: days }, (_, index) => {
    const d = new Date(endDate.getTime() - (days - 1 - index) * DAY_MS);
    return toDateKey(d);
  });
}

export function getTagIds(item) {
  const raw = Array.isArray(item?.tags) ? item.tags : [];
  return raw.map((tag) => (typeof tag === 'object' ? tag.id : String(tag))).filter(Boolean);
}

export function hasTag(item, tagId, tag) {
  const ids = getTagIds(item);
  return ids.includes(String(tagId)) || ids.includes(String(tag?.name || ''));
}

export function collectTagUsage(data) {
  const tagMap = new Map();
  const sources = [
    ['Tarefas', data?.tasks],
    ['Hábitos', data?.habits],
    ['Objetivos', data?.goals],
    ['Projetos', data?.projects],
    ['Diário', data?.diaryEntries],
    ['Sessões de estudo', data?.studySessions],
    ['Conhecimentos', data?.knowledgeItems],
    ['Banco de erros', data?.errors],
    ['Reflexões', data?.weeklyReflections],
    ['Ciclo de estudos', data?.studyCycles],
    ['Calendário', data?.calendarEvents],
    ['Processos', data?.processes],
    ['Áreas', data?.areas],
    ['Coleções', (data?.collections || []).flatMap((c) => [...(c.itens || []), c])],
    ['Financeiro', data?.finance?.transactions],
    ['Investimentos', data?.investments],
    ['Registros', Object.values(data?.history || {})],
  ];

  sources.forEach(([type, items]) => {
    (Array.isArray(items) ? items : []).forEach((item) => {
      getTagIds(item).forEach((tagId) => {
        const current = tagMap.get(tagId) || { count: 0, sources: new Set(), lastUsed: '' };
        current.count += 1;
        current.sources.add(type);
        const date = item.updatedAt || item.createdAt || item.date || item.study_date || '';
        if (date > current.lastUsed) current.lastUsed = date;
        tagMap.set(tagId, current);
      });
    });
  });

  return tagMap;
}

export function buildAnalytics(data, { start, end, tagId = '', areaId = '', type = 'all' } = {}) {
  const startKey = start || rangeDates(30)[0];
  const endKey = end || toDateKey(new Date());
  const inRange = (value) => {
    const key = String(value || '').slice(0, 10);
    return key && key >= startKey && key <= endKey;
  };
  const matches = (item) => {
    if (tagId && !hasTag(item, tagId, (data.tags || []).find((t) => String(t.id) === String(tagId)))) return false;
    if (areaId && String(item.areaId || '') !== String(areaId)) return false;
    return true;
  };

  const tasks = (data.tasks || []).filter((t) => inRange(t.completedAt || t.deadline || t.createdAt) && matches(t));
  const completedTasks = tasks.filter((t) => t.done);
  const habits = (data.habits || []).filter(matches);
  const goals = (data.goals || []).filter(matches);
  const projects = (data.projects || []).filter(matches);
  const studies = (data.studySessions || []).filter((s) => inRange(s.study_date || s.date || s.createdAt) && matches(s));
  const history = Object.entries(data.history || {}).filter(([date]) => date >= startKey && date <= endKey);

  const studyMinutes = studies.reduce((sum, item) => sum + Number(item.minutes || item.duration || 0), 0);
  const plannedTasks = tasks.length;
  const completed = completedTasks.length;
  const completionRate = plannedTasks ? Math.round((completed / plannedTasks) * 100) : 0;
  const activeDays = history.filter(([, r]) => Number(r?.completed || 0) > 0 || Number(r?.studyMinutes || 0) > 0).length;

  const daily = {};
  [...history, ...studies.map((s) => [String(s.study_date || s.date || '').slice(0, 10), { studyMinutes: s.minutes || s.duration || 0 }])].forEach(([date, record]) => {
    if (!date) return;
    daily[date] = (daily[date] || 0) + Number(record?.studyMinutes || 0);
  });

  const previousDays = Math.max(1, daysBetween(startKey, endKey) + 1);
  const previousStart = toDateKey(new Date(parseDateKey(startKey).getTime() - previousDays * DAY_MS));
  const previous = buildBasePeriod(data, previousStart, String(new Date(parseDateKey(startKey).getTime() - DAY_MS).toISOString().slice(0, 10)), matches);
  const studyChange = previous.studyMinutes ? Math.round(((studyMinutes - previous.studyMinutes) / previous.studyMinutes) * 100) : null;

  const insights = [];
  if (studyChange !== null && Math.abs(studyChange) >= 10) insights.push(`Você estudou ${Math.abs(studyChange)}% ${studyChange >= 0 ? 'mais' : 'menos'} no período atual em comparação ao anterior.`);
  if (completionRate < 60 && plannedTasks >= 5) insights.push(`A taxa de conclusão está em ${completionRate}%. Há sinais de planejamento acima da capacidade de execução.`);
  if (activeDays >= Math.max(3, Math.floor(previousDays * 0.7))) insights.push(`Sua consistência foi boa: houve atividade relevante em ${activeDays} dias do período.`);
  if (!insights.length) insights.push('Ainda não há dados suficientes para gerar uma conclusão específica. Continue registrando atividades para melhorar a análise.');

  return {
    start: startKey,
    end: endKey,
    tasks,
    completedTasks,
    habits,
    goals,
    projects,
    studies,
    history,
    studyMinutes,
    plannedTasks,
    completed,
    completionRate,
    activeDays,
    daily,
    insights,
    previous,
    studyChange,
    filters: { tagId, areaId, type },
  };
}

function buildBasePeriod(data, start, end, matches) {
  const inRange = (value) => {
    const key = String(value || '').slice(0, 10);
    return key && key >= start && key <= end;
  };
  const studies = (data.studySessions || []).filter((s) => inRange(s.study_date || s.date || s.createdAt) && matches(s));
  const tasks = (data.tasks || []).filter((t) => inRange(t.completedAt || t.deadline || t.createdAt) && matches(t));
  return {
    studyMinutes: studies.reduce((sum, s) => sum + Number(s.minutes || s.duration || 0), 0),
    completed: tasks.filter((t) => t.done).length,
  };
}
