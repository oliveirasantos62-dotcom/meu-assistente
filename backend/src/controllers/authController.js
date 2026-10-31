import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { query } from '../db/pool.js';

function createToken(userId) {
  return jwt.sign({}, process.env.JWT_SECRET, {
    subject: userId,
    expiresIn: '7d',
  });
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    username: user.username,
  };
}

/*
|--------------------------------------------------------------------------
| Normaliza username
|--------------------------------------------------------------------------
| Aceita:
| gabriel
| @gabriel
|
| Salva sempre:
| gabriel
*/
function normalizeUsername(username) {
  if (username === undefined || username === null) {
    return null;
  }

  let normalized = String(username).trim().toLowerCase();

  if (normalized.startsWith('@')) {
    normalized = normalized.substring(1);
  }

  return normalized || null;
}

/*
|--------------------------------------------------------------------------
| Valida username
|--------------------------------------------------------------------------
*/
function isValidUsername(username) {
  if (!username) {
    return false;
  }

  /*
   * Permite:
   * letras
   * números
   * _
   * .
   *
   * Tamanho: 3 a 30 caracteres
   */
  return /^[a-z0-9_.]{3,30}$/.test(username);
}

/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/
export async function register(req, res) {
  try {
    const { name, email, password, username } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Nome, e-mail e senha são obrigatórios.',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'A senha precisa ter pelo menos 6 caracteres.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const normalizedUsername = normalizeUsername(username);

    /*
    |--------------------------------------------------------------------------
    | Validação do username
    |--------------------------------------------------------------------------
    */
    if (normalizedUsername && !isValidUsername(normalizedUsername)) {
      return res.status(400).json({
        message:
          'O nome de usuário deve ter de 3 a 30 caracteres e usar apenas letras, números, ponto ou underline.',
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Verifica duplicidade
    |--------------------------------------------------------------------------
    */
    const existing = await query(
      `SELECT id
       FROM users
       WHERE email = ?
          OR (
            ? IS NOT NULL
            AND username = ?
          )
       LIMIT 1`,
      [normalizedEmail, normalizedUsername, normalizedUsername],
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: 'E-mail ou nome de usuário já está em uso.',
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Cria senha
    |--------------------------------------------------------------------------
    */
    const passwordHash = await bcrypt.hash(password, 12);

    const userId = randomUUID();

    /*
    |--------------------------------------------------------------------------
    | Cria usuário
    |--------------------------------------------------------------------------
    */
    await query(
      `INSERT INTO users
       (
         id,
         name,
         email,
         username,
         password_hash
       )
       VALUES (?, ?, ?, ?, ?)`,
      [userId, name.trim(), normalizedEmail, normalizedUsername, passwordHash],
    );

    /*
    |--------------------------------------------------------------------------
    | Busca usuário criado
    |--------------------------------------------------------------------------
    */
    const userRows = await query(
      `SELECT
         id,
         name,
         email,
         username,
         created_at
       FROM users
       WHERE id = ?`,
      [userId],
    );

    const user = userRows[0];

    return res.status(201).json({
      user: publicUser(user),
      token: createToken(user.id),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Erro ao criar conta.',
    });
  }
}

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'E-mail e senha são obrigatórios.',
      });
    }

    const rows = await query(
      `SELECT *
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [email.trim().toLowerCase()],
    );

    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        message: 'E-mail ou senha incorretos.',
      });
    }

    return res.json({
      user: publicUser(user),
      token: createToken(user.id),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Erro ao entrar.',
    });
  }
}

/*
|--------------------------------------------------------------------------
| ME
|--------------------------------------------------------------------------
*/
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
      [req.user.id],
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: 'Usuário não encontrado.',
      });
    }

    return res.json({
      user: rows[0],
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Erro ao buscar usuário.',
    });
  }
}

/*
|--------------------------------------------------------------------------
| UPDATE PROFILE
|--------------------------------------------------------------------------
| Permite alterar:
|
| - nome
| - username (@)
|
| O e-mail e a senha continuam separados.
|--------------------------------------------------------------------------
*/
export async function updateProfile(req, res) {
  try {
    const { name, username } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Validação do nome
    |--------------------------------------------------------------------------
    */
    if (name !== undefined && !String(name).trim()) {
      return res.status(400).json({
        message: 'O nome não pode ficar vazio.',
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Normaliza username
    |--------------------------------------------------------------------------
    */
    const normalizedUsername = normalizeUsername(username);

    /*
    |--------------------------------------------------------------------------
    | Valida username
    |--------------------------------------------------------------------------
    */
    if (normalizedUsername && !isValidUsername(normalizedUsername)) {
      return res.status(400).json({
        message:
          'O @ deve ter de 3 a 30 caracteres e usar apenas letras, números, ponto ou underline.',
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Verifica se o @ pertence a outra pessoa
    |--------------------------------------------------------------------------
    */
    if (normalizedUsername) {
      const existing = await query(
        `SELECT id
           FROM users
           WHERE username = ?
             AND id <> ?
           LIMIT 1`,
        [normalizedUsername, req.user.id],
      );

      if (existing.length > 0) {
        return res.status(409).json({
          message: 'Esse nome de usuário já está em uso.',
        });
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Busca usuário atual
    |--------------------------------------------------------------------------
    */
    const currentRows = await query(
      `SELECT
           id,
           name,
           email,
           username,
           created_at
         FROM users
         WHERE id = ?
         LIMIT 1`,
      [req.user.id],
    );

    const currentUser = currentRows[0];

    if (!currentUser) {
      return res.status(404).json({
        message: 'Usuário não encontrado.',
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Mantém os valores atuais quando
    | o campo não for enviado.
    |--------------------------------------------------------------------------
    */
    const newName = name !== undefined ? String(name).trim() : currentUser.name;

    const newUsername =
      username !== undefined ? normalizedUsername : currentUser.username;

    /*
    |--------------------------------------------------------------------------
    | Atualiza perfil
    |--------------------------------------------------------------------------
    */
    await query(
      `UPDATE users
       SET
         name = ?,
         username = ?
       WHERE id = ?`,
      [newName, newUsername, req.user.id],
    );

    /*
    |--------------------------------------------------------------------------
    | Busca usuário atualizado
    |--------------------------------------------------------------------------
    */
    const updatedRows = await query(
      `SELECT
           id,
           name,
           email,
           username,
           created_at
         FROM users
         WHERE id = ?
         LIMIT 1`,
      [req.user.id],
    );

    return res.json({
      message: 'Perfil atualizado com sucesso.',
      user: publicUser(updatedRows[0]),
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: 'Erro ao atualizar perfil.',
    });
  }
}
