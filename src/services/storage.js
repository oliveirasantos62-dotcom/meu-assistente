// src/services/storage.js

const STORAGE_PREFIX = 'app_data_';
const BACKUP_PREFIX = 'app_backup_';
const CURRENT_USER_KEY = 'currentUser';

const STORAGE_VERSION = 2;

/*
|--------------------------------------------------------------------------
| Estrutura inicial da aplicação
|--------------------------------------------------------------------------
|
| Sempre que criarmos uma nova funcionalidade, adicionamos o campo aqui.
|
*/

export const emptyAppData = {
  version: 2,

  habits: [],
  tasks: [],
  calendarEvents: [],

  xp: 0,
  coins: 0,

  history: {},

  goals: [],

  finance: {
    transactions: [],
  },

  diaryEntries: [],
  studySessions: [],
  knowledgeItems: [],
  errors: [],
  weeklyReflections: [],

  settings: {},
};

/*
|--------------------------------------------------------------------------
| Utilidades
|--------------------------------------------------------------------------
*/

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function clone(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

/*
|--------------------------------------------------------------------------
| Merge profundo
|--------------------------------------------------------------------------
|
| Evita perder dados quando adicionamos uma nova propriedade.
|
| Exemplo:
|
| Dados antigos:
| {
|   habits: [],
|   xp: 100
| }
|
| Nova estrutura:
| {
|   habits: [],
|   xp: 100,
|   diaryEntries: []
| }
|
| O diaryEntries será adicionado sem apagar o resto.
|
*/

function deepMerge(defaults, current) {
  if (!isObject(defaults)) {
    return current ?? defaults;
  }

  const result = {
    ...defaults,
  };

  if (!isObject(current)) {
    return result;
  }

  Object.keys(current).forEach((key) => {
    const defaultValue = defaults[key];
    const currentValue = current[key];

    if (isObject(defaultValue) && isObject(currentValue)) {
      result[key] = deepMerge(defaultValue, currentValue);
    } else {
      result[key] = currentValue;
    }
  });

  return result;
}

/*
|--------------------------------------------------------------------------
| Sanitização dos dados
|--------------------------------------------------------------------------
|
| Garante que arrays importantes nunca virem null ou undefined.
|
*/

function normalizeData(data) {
  const merged = deepMerge(emptyAppData, data || {});

  if (!Array.isArray(merged.habits)) {
    merged.habits = [];
  }

  if (!Array.isArray(merged.tasks)) {
    merged.tasks = [];
  }

  if (!Array.isArray(merged.calendarEvents)) {
    merged.calendarEvents = [];
  }

  if (!Array.isArray(merged.diaryEntries)) {
    merged.diaryEntries = [];
  }

  if (!Array.isArray(merged.studySessions)) {
    merged.studySessions = [];
  }

  if (!Array.isArray(merged.knowledgeItems)) {
    merged.knowledgeItems = [];
  }

  if (!Array.isArray(merged.errors)) {
    merged.errors = [];
  }

  if (!Array.isArray(merged.weeklyReflections)) {
    merged.weeklyReflections = [];
  }

  if (!isObject(merged.finance)) {
    merged.finance = {
      transactions: [],
    };
  }

  if (!Array.isArray(merged.finance.transactions)) {
    merged.finance.transactions = [];
  }

  if (!isObject(merged.settings)) {
    merged.settings = {};
  }

  if (typeof merged.xp !== 'number' || Number.isNaN(merged.xp)) {
    merged.xp = 0;
  }

  if (merged.xp < 0) {
    merged.xp = 0;
  }

  merged.version = STORAGE_VERSION;

  return merged;
}

/*
|--------------------------------------------------------------------------
| Migrações
|--------------------------------------------------------------------------
|
| Aqui podemos evoluir o sistema sem destruir dados antigos.
|
*/

function migrateData(data) {
  if (!data || !isObject(data)) {
    return normalizeData({});
  }

  let migrated = clone(data);

  const version = Number(migrated.version || 1);

  /*
  |--------------------------------------------------------------------------
  | Versão 1 -> 2
  |--------------------------------------------------------------------------
  |
  | Adicionamos o sistema do Diário.
  |
  */

  if (version < 2) {
    migrated = {
      ...migrated,

      diaryEntries: migrated.diaryEntries || [],

      studySessions: migrated.studySessions || [],

      knowledgeItems: migrated.knowledgeItems || [],

      errors: migrated.errors || [],

      weeklyReflections: migrated.weeklyReflections || [],

      settings: migrated.settings || {},
    };
  }

  migrated.version = STORAGE_VERSION;

  return normalizeData(migrated);
}

/*
|--------------------------------------------------------------------------
| Verificação do ambiente
|--------------------------------------------------------------------------
*/

function hasLocalStorage() {
  try {
    return (
      typeof window !== 'undefined' &&
      typeof window.localStorage !== 'undefined'
    );
  } catch {
    return false;
  }
}

/*
|--------------------------------------------------------------------------
| Chave segura por usuário
|--------------------------------------------------------------------------
*/

function getUserKey(username) {
  if (!username) return null;

  const cleanUsername = String(username).trim().toLowerCase();

  if (!cleanUsername) return null;

  return `${STORAGE_PREFIX}${cleanUsername}`;
}

function getBackupKey(username) {
  if (!username) return null;

  const cleanUsername = String(username).trim().toLowerCase();

  if (!cleanUsername) return null;

  return `${BACKUP_PREFIX}${cleanUsername}`;
}

/*
|--------------------------------------------------------------------------
| Serviço principal
|--------------------------------------------------------------------------
*/

export const storageService = {
  /*
  |--------------------------------------------------------------------------
  | Usuário atual
  |--------------------------------------------------------------------------
  */

  getCurrentUser() {
    if (!hasLocalStorage()) {
      return null;
    }

    try {
      return localStorage.getItem(CURRENT_USER_KEY);
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);

      return null;
    }
  },

  setCurrentUser(username) {
    if (!hasLocalStorage()) {
      return false;
    }

    try {
      if (username) {
        localStorage.setItem(CURRENT_USER_KEY, String(username).trim());
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
      }

      return true;
    } catch (error) {
      console.error('Erro ao definir usuário atual:', error);

      return false;
    }
  },

  /*
  |--------------------------------------------------------------------------
  | Carregar dados
  |--------------------------------------------------------------------------
  */

  loadData(username) {
    if (!username || !hasLocalStorage()) {
      return null;
    }

    const key = getUserKey(username);

    if (!key) {
      return null;
    }

    try {
      const raw = localStorage.getItem(key);

      /*
      |--------------------------------------------------------------------------
      | Usuário ainda não possui dados
      |--------------------------------------------------------------------------
      */

      if (!raw) {
        return clone(emptyAppData);
      }

      const parsed = JSON.parse(raw);

      /*
      |--------------------------------------------------------------------------
      | Migra dados antigos
      |--------------------------------------------------------------------------
      */

      const migrated = migrateData(parsed);

      /*
      |--------------------------------------------------------------------------
      | Se a estrutura mudou, salva novamente.
      |--------------------------------------------------------------------------
      */

      const parsedVersion = Number(parsed?.version || 1);

      if (parsedVersion !== STORAGE_VERSION) {
        localStorage.setItem(key, JSON.stringify(migrated));
      }

      return migrated;
    } catch (error) {
      console.error('Erro ao carregar dados:', error);

      /*
      |--------------------------------------------------------------------------
      | Tenta recuperar backup
      |--------------------------------------------------------------------------
      */

      const backup = this.restoreBackup(username);

      if (backup) {
        console.warn('Dados restaurados a partir do backup.');

        return backup;
      }

      /*
      |--------------------------------------------------------------------------
      | Se tudo falhar, retorna estrutura limpa.
      |--------------------------------------------------------------------------
      */

      return clone(emptyAppData);
    }
  },

  /*
  |--------------------------------------------------------------------------
  | Salvar dados
  |--------------------------------------------------------------------------
  */

  saveData(username, data) {
    if (!username || !hasLocalStorage()) {
      return false;
    }

    const key = getUserKey(username);

    if (!key) {
      return false;
    }

    try {
      /*
      |--------------------------------------------------------------------------
      | Normaliza antes de salvar
      |--------------------------------------------------------------------------
      */

      const normalizedData = migrateData(data);

      /*
      |--------------------------------------------------------------------------
      | Faz backup dos dados atuais
      |--------------------------------------------------------------------------
      */

      const currentRaw = localStorage.getItem(key);

      if (currentRaw) {
        try {
          const backupKey = getBackupKey(username);

          localStorage.setItem(backupKey, currentRaw);
        } catch (backupError) {
          console.warn('Não foi possível criar backup:', backupError);
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Salva os dados novos
      |--------------------------------------------------------------------------
      */

      localStorage.setItem(key, JSON.stringify(normalizedData));

      return true;
    } catch (error) {
      /*
      |--------------------------------------------------------------------------
      | QuotaExceededError
      |--------------------------------------------------------------------------
      */

      if (error?.name === 'QuotaExceededError' || error?.code === 22) {
        console.error('O armazenamento local está cheio.');

        return false;
      }

      console.error('Erro ao salvar dados:', error);

      return false;
    }
  },

  /*
  |--------------------------------------------------------------------------
  | Atualização parcial
  |--------------------------------------------------------------------------
  |
  | Útil para páginas que querem alterar apenas uma parte dos dados.
  |
  | Exemplo:
  |
  | storageService.updateData(username, {
  |   xp: 100
  | });
  |
  */

  updateData(username, partialData) {
    if (!username) {
      return false;
    }

    const current = this.loadData(username) || clone(emptyAppData);

    const updated = deepMerge(current, partialData || {});

    return this.saveData(username, updated);
  },

  /*
  |--------------------------------------------------------------------------
  | Backup manual
  |--------------------------------------------------------------------------
  */

  createBackup(username) {
    if (!username || !hasLocalStorage()) {
      return false;
    }

    const key = getUserKey(username);
    const backupKey = getBackupKey(username);

    try {
      const current = localStorage.getItem(key);

      if (!current) {
        return false;
      }

      localStorage.setItem(backupKey, current);

      return true;
    } catch (error) {
      console.error('Erro ao criar backup:', error);

      return false;
    }
  },

  /*
  |--------------------------------------------------------------------------
  | Restaurar backup
  |--------------------------------------------------------------------------
  */

  restoreBackup(username) {
    if (!username || !hasLocalStorage()) {
      return null;
    }

    const backupKey = getBackupKey(username);

    try {
      const raw = localStorage.getItem(backupKey);

      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);

      return migrateData(parsed);
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);

      return null;
    }
  },

  /*
  |--------------------------------------------------------------------------
  | Apagar dados do usuário
  |--------------------------------------------------------------------------
  */

  clearData(username) {
    if (!username || !hasLocalStorage()) {
      return false;
    }

    const key = getUserKey(username);

    try {
      /*
      |--------------------------------------------------------------------------
      | Antes de apagar, cria backup.
      |--------------------------------------------------------------------------
      */

      this.createBackup(username);

      localStorage.removeItem(key);

      return true;
    } catch (error) {
      console.error('Erro ao apagar dados:', error);

      return false;
    }
  },

  /*
  |--------------------------------------------------------------------------
  | Resetar completamente
  |--------------------------------------------------------------------------
  */

  resetData(username) {
    if (!username || !hasLocalStorage()) {
      return false;
    }

    const key = getUserKey(username);
    const backupKey = getBackupKey(username);

    try {
      /*
      |--------------------------------------------------------------------------
      | Backup antes do reset.
      |--------------------------------------------------------------------------
      */

      this.createBackup(username);

      /*
      |--------------------------------------------------------------------------
      | Remove dados atuais.
      |--------------------------------------------------------------------------
      */

      localStorage.removeItem(key);

      /*
      |--------------------------------------------------------------------------
      | Cria nova estrutura.
      |--------------------------------------------------------------------------
      */

      localStorage.setItem(key, JSON.stringify(emptyAppData));

      /*
      |--------------------------------------------------------------------------
      | Mantém o backup separado.
      |--------------------------------------------------------------------------
      */

      void backupKey;

      return true;
    } catch (error) {
      console.error('Erro ao resetar dados:', error);

      return false;
    }
  },

  /*
  |--------------------------------------------------------------------------
  | Exportar dados para JSON
  |--------------------------------------------------------------------------
  */

  exportData(username) {
    if (!username) {
      return null;
    }

    const data = this.loadData(username);

    if (!data) {
      return null;
    }

    return clone(data);
  },

  /*
  |--------------------------------------------------------------------------
  | Salvar em arquivo
  |--------------------------------------------------------------------------
  */

  async saveToFile(data, filename) {
    try {
      if (
        typeof window === 'undefined' ||
        typeof window.showSaveFilePicker !== 'function'
      ) {
        console.error('File System Access API não disponível neste navegador.');

        return false;
      }

      const safeData = migrateData(data);

      const handle = await window.showSaveFilePicker({
        suggestedName: filename || 'meu-assistente-dados.json',

        types: [
          {
            description: 'JSON Files',

            accept: {
              'application/json': ['.json'],
            },
          },
        ],
      });

      const writable = await handle.createWritable();

      await writable.write(JSON.stringify(safeData, null, 2));

      await writable.close();

      return true;
    } catch (error) {
      if (error?.name === 'AbortError') {
        return false;
      }

      console.error('Erro ao salvar arquivo:', error);

      return false;
    }
  },

  /*
  |--------------------------------------------------------------------------
  | Carregar arquivo
  |--------------------------------------------------------------------------
  */

  async loadFromFile() {
    try {
      if (
        typeof window === 'undefined' ||
        typeof window.showOpenFilePicker !== 'function'
      ) {
        console.error('File System Access API não disponível neste navegador.');

        return null;
      }

      const [handle] = await window.showOpenFilePicker({
        multiple: false,

        types: [
          {
            description: 'JSON Files',

            accept: {
              'application/json': ['.json'],
            },
          },
        ],
      });

      const file = await handle.getFile();

      const text = await file.text();

      if (!text.trim()) {
        throw new Error('O arquivo está vazio.');
      }

      const parsed = JSON.parse(text);

      /*
      |--------------------------------------------------------------------------
      | Valida minimamente o arquivo
      |--------------------------------------------------------------------------
      */

      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Formato de dados inválido.');
      }

      return migrateData(parsed);
    } catch (error) {
      if (error?.name === 'AbortError') {
        return null;
      }

      console.error('Erro ao carregar arquivo:', error);

      return null;
    }
  },

  /*
  |--------------------------------------------------------------------------
  | Importar arquivo diretamente para o usuário
  |--------------------------------------------------------------------------
  */

  async importFromFile(username) {
    if (!username) {
      return false;
    }

    const imported = await this.loadFromFile();

    if (!imported) {
      return false;
    }

    /*
    |--------------------------------------------------------------------------
    | Backup antes de substituir
    |--------------------------------------------------------------------------
    */

    this.createBackup(username);

    return this.saveData(username, imported);
  },

  /*
  |--------------------------------------------------------------------------
  | Verificar se existe dados
  |--------------------------------------------------------------------------
  */

  hasData(username) {
    if (!username || !hasLocalStorage()) {
      return false;
    }

    const key = getUserKey(username);

    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  },

  /*
  |--------------------------------------------------------------------------
  | Informações do armazenamento
  |--------------------------------------------------------------------------
  */

  getStorageInfo(username) {
    if (!username || !hasLocalStorage()) {
      return {
        exists: false,
        bytes: 0,
        kilobytes: 0,
        megabytes: 0,
      };
    }

    const key = getUserKey(username);

    try {
      const raw = localStorage.getItem(key) || '';

      const bytes = new Blob([raw]).size;

      return {
        exists: Boolean(raw),

        bytes,

        kilobytes: Number((bytes / 1024).toFixed(2)),

        megabytes: Number((bytes / 1024 / 1024).toFixed(2)),
      };
    } catch (error) {
      console.error('Erro ao verificar armazenamento:', error);

      return {
        exists: false,
        bytes: 0,
        kilobytes: 0,
        megabytes: 0,
      };
    }
  },

  /*
  |--------------------------------------------------------------------------
  | Obter estrutura vazia
  |--------------------------------------------------------------------------
  */

  getEmptyData() {
    return clone(emptyAppData);
  },

  /*
  |--------------------------------------------------------------------------
  | Normalizar dados externos
  |--------------------------------------------------------------------------
  |
  | Útil quando uma página recebe dados vindos de outro lugar.
  |
  */

  normalize(data) {
    return migrateData(data);
  },
};
