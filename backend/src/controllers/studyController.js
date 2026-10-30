import { randomUUID } from 'crypto';
import { query } from '../db/pool.js';

function today() { return new Date().toISOString().slice(0, 10); }
function addDays(date, days) {
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function getStudyDashboard(req, res) {
  try {
    const [sessions, readings, reviews, errors] = await Promise.all([
      query(`SELECT * FROM study_sessions WHERE user_id = ? ORDER BY study_date DESC, created_at DESC LIMIT 500`, [req.user.id]),
      query(`SELECT * FROM reading_items WHERE user_id = ? ORDER BY updated_at DESC LIMIT 200`, [req.user.id]),
      query(`SELECT * FROM review_items WHERE user_id = ? ORDER BY next_review ASC`, [req.user.id]),
      query(`SELECT * FROM study_errors WHERE user_id = ? ORDER BY created_at DESC LIMIT 300`, [req.user.id]),
    ]);
    return res.json({ sessions, readings, reviews, errors });
  } catch (error) {
    console.error(error); return res.status(500).json({ message: 'Erro ao carregar estudos.' });
  }
}

export async function createStudySession(req, res) {
  try {
    const b = req.body || {};
    if (!String(b.discipline || '').trim() || !String(b.subject || '').trim()) return res.status(400).json({ message: 'Disciplina e conteúdo são obrigatórios.' });
    const id = randomUUID();
    await query(`INSERT INTO study_sessions (id,user_id,study_date,discipline,subject,minutes,method,difficulty,exercises,correct,errors,learned,not_mastered,observations) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [id, req.user.id, b.studyDate || today(), b.discipline.trim(), b.subject.trim(), Number(b.minutes || 0), b.method || 'Exercícios', Number(b.difficulty || 3), Number(b.exercises || 0), Number(b.correct || 0), Number(b.errors || 0), b.learned || '', b.notMastered || '', b.observations || '']);
    const [row] = await query(`SELECT * FROM study_sessions WHERE id = ?`, [id]);
    return res.status(201).json({ session: row });
  } catch (error) { console.error(error); return res.status(500).json({ message: 'Erro ao salvar sessão.' }); }
}

export async function createReading(req, res) {
  try {
    const b = req.body || {};
    if (!String(b.title || '').trim()) return res.status(400).json({ message: 'Título é obrigatório.' });
    const id = randomUUID();
    await query(`INSERT INTO reading_items (id,user_id,title,author,type,status,progress,total_pages,current_page,notes,started_at,completed_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, [id, req.user.id, b.title.trim(), b.author || '', b.type || 'book', b.status || 'planned', Math.min(100, Math.max(0, Number(b.progress || 0))), b.totalPages ? Number(b.totalPages) : null, Number(b.currentPage || 0), b.notes || '', b.startedAt || null, b.completedAt || null]);
    const [row] = await query(`SELECT * FROM reading_items WHERE id = ?`, [id]);
    return res.status(201).json({ reading: row });
  } catch (error) { console.error(error); return res.status(500).json({ message: 'Erro ao salvar leitura.' }); }
}

export async function updateReading(req, res) {
  try {
    const fields = ['title','author','type','status','progress','total_pages','current_page','notes','started_at','completed_at'];
    const b = req.body || {};
    const sets = []; const params = [];
    for (const field of fields) if (Object.prototype.hasOwnProperty.call(b, field)) { sets.push(`${field} = ?`); params.push(b[field]); }
    if (!sets.length) return res.status(400).json({ message: 'Nenhuma alteração informada.' });
    params.push(req.params.id, req.user.id);
    const result = await query(`UPDATE reading_items SET ${sets.join(', ')} WHERE id = ? AND user_id = ?`, params);
    if (!result.affectedRows) return res.status(404).json({ message: 'Leitura não encontrada.' });
    const [row] = await query(`SELECT * FROM reading_items WHERE id = ?`, [req.params.id]);
    return res.json({ reading: row });
  } catch (error) { console.error(error); return res.status(500).json({ message: 'Erro ao atualizar leitura.' }); }
}

export async function createReview(req, res) {
  try {
    const b = req.body || {};
    if (!String(b.title || '').trim() || !String(b.discipline || '').trim() || !String(b.content || '').trim()) return res.status(400).json({ message: 'Título, disciplina e conteúdo são obrigatórios.' });
    const id = randomUUID();
    await query(`INSERT INTO review_items (id,user_id,title,discipline,content,example,tags,next_review) VALUES (?,?,?,?,?,?,?,?)`, [id, req.user.id, b.title.trim(), b.discipline.trim(), b.content.trim(), b.example || '', b.tags || '', b.nextReview || today()]);
    const [row] = await query(`SELECT * FROM review_items WHERE id = ?`, [id]);
    return res.status(201).json({ review: row });
  } catch (error) { console.error(error); return res.status(500).json({ message: 'Erro ao criar revisão.' }); }
}

export async function reviewItem(req, res) {
  try {
    const b = req.body || {};
    const config = {
      forgot: { mastery: 20, days: 1 }, little: { mastery: 40, days: 2 }, partial: { mastery: 60, days: 4 }, well: { mastery: 80, days: 7 }, master: { mastery: 95, days: null },
    };
    const rating = config[b.rating];
    if (!rating) return res.status(400).json({ message: 'Avaliação inválida.' });
    const [rows] = await Promise.all([query(`SELECT * FROM review_items WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id])]);
    if (!rows.length) return res.status(404).json({ message: 'Revisão não encontrada.' });
    const item = rows[0];
    let interval = rating.days;
    if (b.rating === 'master') interval = Math.min(60, Math.max(14, Number(item.interval_days || 0) * 2 || 14));
    const next = addDays(today(), interval);
    await query(`UPDATE review_items SET mastery=?, last_review=?, next_review=?, interval_days=?, review_count=review_count+1 WHERE id=? AND user_id=?`, [rating.mastery, today(), next, interval, req.params.id, req.user.id]);
    await query(`INSERT INTO review_logs (id,review_item_id,user_id,review_date,rating,mastery,next_review,interval_days) VALUES (?,?,?,?,?,?,?,?)`, [randomUUID(), req.params.id, req.user.id, today(), b.rating, rating.mastery, next, interval]);
    const [updated] = await query(`SELECT * FROM review_items WHERE id = ?`, [req.params.id]);
    return res.json({ review: updated[0] });
  } catch (error) { console.error(error); return res.status(500).json({ message: 'Erro ao registrar revisão.' }); }
}

export async function createStudyError(req, res) {
  try {
    const b = req.body || {};
    if (!String(b.question || '').trim() || !String(b.correctAnswer || '').trim() || !String(b.whyWrong || '').trim()) return res.status(400).json({ message: 'Questão, resposta correta e motivo são obrigatórios.' });
    const id = randomUUID();
    await query(`INSERT INTO study_errors (id,user_id,question,my_answer,correct_answer,why_wrong,type,discipline,subject) VALUES (?,?,?,?,?,?,?,?,?)`, [id, req.user.id, b.question.trim(), b.myAnswer || '', b.correctAnswer.trim(), b.whyWrong.trim(), b.type || 'Outro', b.discipline || '', b.subject || '']);
    const [row] = await query(`SELECT * FROM study_errors WHERE id = ?`, [id]);
    return res.status(201).json({ error: row });
  } catch (error) { console.error(error); return res.status(500).json({ message: 'Erro ao registrar erro.' }); }
}

export async function toggleStudyError(req, res) {
  try {
    const result = await query(`UPDATE study_errors SET resolved = NOT resolved, resolved_at = IF(resolved = 0, CURRENT_TIMESTAMP, NULL) WHERE id = ? AND user_id = ?`, [req.params.id, req.user.id]);
    if (!result.affectedRows) return res.status(404).json({ message: 'Erro não encontrado.' });
    const [row] = await query(`SELECT * FROM study_errors WHERE id = ?`, [req.params.id]);
    return res.json({ error: row[0] });
  } catch (error) { console.error(error); return res.status(500).json({ message: 'Erro ao atualizar erro.' }); }
}


export async function migrateLocalStudyData(req, res) {
  try {
    const b = req.body || {};
    const counts = await Promise.all([
      query(`SELECT COUNT(*) AS count FROM study_sessions WHERE user_id = ?`, [req.user.id]),
      query(`SELECT COUNT(*) AS count FROM reading_items WHERE user_id = ?`, [req.user.id]),
      query(`SELECT COUNT(*) AS count FROM review_items WHERE user_id = ?`, [req.user.id]),
      query(`SELECT COUNT(*) AS count FROM study_errors WHERE user_id = ?`, [req.user.id]),
    ]);
    const hasData = counts.some((r) => Number(r[0]?.count || 0) > 0);
    if (hasData) return res.json({ migrated: false, reason: 'already_has_data' });

    const sessions = Array.isArray(b.studySessions) ? b.studySessions : [];
    for (const item of sessions) {
      await query(`INSERT INTO study_sessions (id,user_id,study_date,discipline,subject,minutes,method,difficulty,exercises,correct,errors,learned,not_mastered,observations) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, [randomUUID(), req.user.id, String(item.date || today()).slice(0,10), item.discipline || '', item.subject || '', Number(item.minutes || 0), item.method || 'Exercícios', Number(item.difficulty || 3), Number(item.exercises || 0), Number(item.correct || 0), Number(item.errors || 0), item.learned || '', item.notMastered || '', item.observations || '']);
    }

    const knowledge = Array.isArray(b.knowledgeItems) ? b.knowledgeItems : [];
    for (const item of knowledge) {
      await query(`INSERT INTO review_items (id,user_id,title,discipline,content,example,tags,mastery,last_review,next_review,interval_days,review_count) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, [randomUUID(), req.user.id, item.title || 'Sem título', item.discipline || 'Geral', item.explanation || '', item.example || '', Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || ''), Number(item.mastery || 0), item.lastReview || null, item.nextReview || today(), Number(item.reviewInterval || 0), Number(item.reviewCount || 0)]);
    }

    const errors = Array.isArray(b.errors) ? b.errors : [];
    for (const item of errors) {
      await query(`INSERT INTO study_errors (id,user_id,question,my_answer,correct_answer,why_wrong,type,discipline,subject,resolved) VALUES (?,?,?,?,?,?,?,?,?,?)`, [randomUUID(), req.user.id, item.question || '', item.myAnswer || '', item.correctAnswer || '', item.whyWrong || '', item.type || 'Outro', item.discipline || '', item.subject || '', item.resolved ? 1 : 0]);
    }

    return res.json({ migrated: true, sessions: sessions.length, reviews: knowledge.length, errors: errors.length });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao migrar estudos locais.' });
  }
}
