export function localDateString(date = new Date()) {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function isTaskCancelled(task, date = new Date()) {
  if (!task) return false;
  const day = localDateString(date);
  if (task.status === 'cancelled' || task.cancelled === true) return true;
  if (task.cancellationScope === 'day') {
    return String(task.cancelledForDate || task.cancelledAt || '').slice(0, 10) === day;
  }
  return false;
}

export function isTaskIndefinitelySuspended(task) {
  return task?.status === 'cancelled' || task?.cancelled === true || task?.cancellationScope === 'indefinite';
}
