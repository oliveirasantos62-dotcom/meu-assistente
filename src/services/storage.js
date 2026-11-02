// src/services/storage.js

const STORAGE_PREFIX = 'app_data_';
const BACKUP_PREFIX = 'app_backup_';
const CURRENT_USER_KEY = 'currentUser';

const STORAGE_VERSION = 4;

/*
|--------------------------------------------------------------------------
| Estrutura inicial da aplicação
|--------------------------------------------------------------------------
*/

export const emptyAppData = {
  version: STORAGE_VERSION,

  habits: [],
  tasks: [],
  processes: [],
  areas: [],
  calendarEvents: [],

  xp: 0,
  coins: 0,

  history: {},

  goals: [],

  finance: {
    transactions: [],
    monthlyBudget: 0,
    savingsGoal: 0,
    creditLimit: 0,
    currentBalance: 0,
    salary: 0,
    financialGoals: [],
    budgetsByCategory: {},
    accounts: [],
  },

  investments: [],
  portfolioHistory: [],

  targetAllocation: {
    Ações: 60,
    FIIs: 20,
    'Renda Fixa': 20,
    Cripto: 0,
  },

  gamification: {
    missions: [],
    achievements: [],
    rewards: [],
    streak: 0,
  },

  assistant: {
    history: [],
    notes: [],
  },

  diaryEntries: [],
  studySessions: [],
  knowledgeItems: [],
  errors: [],
  weeklyReflections: [],

  collections: [],

  // Estruturas centrais de integração
  tags: [],
  studyCycles: [],
  settings: {
    modules: {},
    moduleReferences: {},
    assistant: { webResearch: false },
  },
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
*/

function normalizeData(data) {
  const merged = deepMerge(emptyAppData, data || {});

  if (!Array.isArray(merged.habits)) {
    merged.habits = [];
  }

  if (!Array.isArray(merged.tasks)) {
    merged.tasks = [];
  }

  if (!Array.isArray(merged.processes)) {
    merged.processes = [];
  }

  // NOVO: áreas personalizadas
  if (!Array.isArray(merged.areas)) {
    merged.areas = [];
  }

  if (!Array.isArray(merged.collections)) {
    merged.collections = [];
  }

  if (!Array.isArray(merged.tags)) {
    merged.tags = [];
  }

  if (!Array.isArray(merged.studyCycles)) {
    merged.studyCycles = [];
  }

  if (!isObject(merged.settings)) {
    merged.settings = { modules: {}, moduleReferences: {}, assistant: { webResearch: false } };
  }

  if (!isObject(merged.settings.modules)) merged.settings.modules = {};
  if (!isObject(merged.settings.moduleReferences)) merged.settings.moduleReferences = {};
  if (!isObject(merged.settings.assistant)) merged.settings.assistant = { webResearch: false };

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

  // FINANÇAS
  if (!isObject(merged.finance)) {
    merged.finance = {
      transactions: [],
      monthlyBudget: 0,
      savingsGoal: 0,
      creditLimit: 0,
      currentBalance: 0,
      salary: 0,
      financialGoals: [],
      budgetsByCategory: {},
      accounts: [],
    };
  }

  if (!Array.isArray(merged.finance.transactions)) {
    merged.finance.transactions = [];
  }

  if (!Array.isArray(merged.finance.financialGoals)) {
    merged.finance.financialGoals = [];
  }

  if (!isObject(merged.finance.budgetsByCategory)) {
    merged.finance.budgetsByCategory = {};
  }

  if (!Array.isArray(merged.finance.accounts)) {
    merged.finance.accounts = [];
  }

  // INVESTIMENTOS
  if (!Array.isArray(merged.investments)) {
    merged.investments = [];
  }

  if (!Array.isArray(merged.portfolioHistory)) {
    merged.portfolioHistory = [];
  }

  if (!isObject(merged.targetAllocation)) {
    merged.targetAllocation = {
      Ações: 60,
      FIIs: 20,
      'Renda Fixa': 20,
      Cripto: 0,
    };
  }

  // GAMIFICAÇÃO
  if (!isObject(merged.gamification)) {
    merged.gamification = {
      missions: [],
      achievements: [],
      rewards: [],
      streak: 0,
    };
  }

  if (!Array.isArray(merged.gamification.missions)) {
    merged.gamification.missions = [];
  }

  if (!Array.isArray(merged.gamification.achievements)) {
    merged.gamification.achievements = [];
  }

  if (!Array.isArray(merged.gamification.rewards)) {
    merged.gamification.rewards = [];
  }

  // ASSISTENTE
  if (!isObject(merged.assistant)) {
    merged.assistant = {
      history: [],
      notes: [],
    };
  }

  if (!Array.isArray(merged.assistant.history)) {
    merged.assistant.history = [];
  }

  if (!Array.isArray(merged.assistant.notes)) {
    merged.assistant.notes = [];
  }

  // CONFIGURAÇÕES
  if (!isObject(merged.settings)) {
    merged.settings = {};
  }

  // XP
  if (typeof merged.xp !== 'number' || Number.isNaN(merged.xp)) {
    merged.xp = 0;
  }

  if (merged.xp < 0) {
    merged.xp = 0;
  }

  // VERSÃO ATUAL
  merged.version = STORAGE_VERSION;

  return merged;
}

/*
|--------------------------------------------------------------------------
| Migrações
|--------------------------------------------------------------------------
|
| Versão 1 -> 2: Diário e estudos.
| Versão 2 -> 3: Estrutura anterior.
| Versão 3 -> 4: Áreas personalizadas.
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

  /*
  |--------------------------------------------------------------------------
  | Versão 2 -> 3
  |--------------------------------------------------------------------------
  |
  | Preserva os dados anteriores e prepara a estrutura da versão 3.
  | O normalizeData completa os campos padrão.
  |
  */

  if (version < 3) {
    migrated = {
      ...migrated,
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Versão 3 -> 4
  |--------------------------------------------------------------------------
  |
  | Adiciona áreas personalizadas.
  | Não remove nem altera as tarefas antigas.
  |
  */

  if (version < 4) {
    migrated = {
      ...migrated,

      areas: Array.isArray(migrated.areas) ? migrated.areas : [],
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

      // Usuário sem dados
      if (!raw) {
        return clone(emptyAppData);
      }

      const parsed = JSON.parse(raw);

      // Migração automática
      const migrated = migrateData(parsed);

      // Salva novamente quando a versão mudou
      const parsedVersion = Number(parsed?.version || 1);

      if (parsedVersion !== STORAGE_VERSION) {
        localStorage.setItem(key, JSON.stringify(migrated));
      }

      return migrated;
    } catch (error) {
      console.error('Erro ao carregar dados:', error);

      // Recuperação do backup
      const backup = this.restoreBackup(username);

      if (backup) {
        console.warn('Dados restaurados a partir do backup.');
        return backup;
      }

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
      // Normaliza antes de salvar
      const normalizedData = migrateData(data);

      // Backup dos dados atuais
      const currentRaw = localStorage.getItem(key);

      if (currentRaw) {
        try {
          const backupKey = getBackupKey(username);

          localStorage.setItem(backupKey, currentRaw);
        } catch (backupError) {
          console.warn('Não foi possível criar backup:', backupError);
        }
      }

      // Salva dados atualizados
      localStorage.setItem(key, JSON.stringify(normalizedData));

      return true;
    } catch (error) {
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

    try {
      this.createBackup(username);

      localStorage.removeItem(key);

      localStorage.setItem(key, JSON.stringify(clone(emptyAppData)));

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

    this.createBackup(username);

    return this.saveData(username, imported);
  },

  /*
  |--------------------------------------------------------------------------
  | Verificar se existem dados
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
  */

  normalize(data) {
    return migrateData(data);
  },
};
