import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useAppData } from './useAppData';
import { storageService, emptyAppData } from '../services/storage';
import { loadCloudData, saveCloudData } from '../services/cloudStorage';

vi.mock('../services/storage', () => ({
  emptyAppData: {
    tasks: [],
    habits: [],
    calendarEvents: [],
    history: {},
    diaryEntries: [],
    studySessions: [],
    knowledgeItems: [],
    errors: [],
    weeklyReflections: [],
    xp: 0,
    coins: 0,
    finance: { transactions: [] },
    settings: {},
  },
  storageService: {
    loadData: vi.fn(),
    saveData: vi.fn(),
  },
}));

vi.mock('../services/cloudStorage', () => ({
  loadCloudData: vi.fn(),
  saveCloudData: vi.fn(),
}));

describe('useAppData', () => {
  const user = {
    id: 'user-test-123',
    email: 'teste@exemplo.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    storageService.loadData.mockReturnValue(null);
    storageService.saveData.mockReturnValue(true);

    loadCloudData.mockResolvedValue({
      exists: true,
      appData: {
        ...emptyAppData,
        tasks: [],
        habits: [],
        history: {},
        finance: { transactions: [] },
      },
    });

    saveCloudData.mockResolvedValue({
      updated_at: new Date().toISOString(),
    });
  });

  it('inicia com uma estrutura válida de dados', async () => {
    const { result } = renderHook(() => useAppData(user));

    await waitFor(() => {
      expect(result.current.cloudReady).toBe(true);
    });

    expect(Array.isArray(result.current.data.tasks)).toBe(true);
    expect(Array.isArray(result.current.data.habits)).toBe(true);
    expect(result.current.data.history).toBeDefined();
    expect(result.current.data.finance.transactions).toEqual([]);
  });

  it('carrega os dados existentes da nuvem', async () => {
    const cloudData = {
      ...emptyAppData,
      tasks: [{ id: 't1', title: 'Estudar React', done: false, xp: 10 }],
      xp: 50,
    };

    loadCloudData.mockResolvedValue({
      exists: true,
      appData: cloudData,
      updatedAt: new Date().toISOString(),
    });

    const { result } = renderHook(() => useAppData(user));

    await waitFor(() => {
      expect(result.current.cloudReady).toBe(true);
    });

    expect(loadCloudData).toHaveBeenCalledWith(user.id);
    expect(result.current.data.xp).toBe(50);
    expect(result.current.data.tasks).toHaveLength(1);
    expect(result.current.data.tasks[0].title).toBe('Estudar React');
  });

  it('usa os dados locais quando ainda não existe registro na nuvem', async () => {
    const localData = {
      ...emptyAppData,
      tasks: [{ id: 'local-1', title: 'Tarefa local', done: false }],
    };

    storageService.loadData.mockReturnValue(localData);

    loadCloudData.mockResolvedValue({
      exists: false,
      appData: null,
      updatedAt: null,
    });

    const { result } = renderHook(() => useAppData(user));

    await waitFor(() => {
      expect(result.current.cloudReady).toBe(true);
    });

    expect(result.current.data.tasks[0].title).toBe('Tarefa local');

    await waitFor(() => {
      expect(saveCloudData).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({
          tasks: localData.tasks,
        }),
      );
    });
  });

  it('atualiza os dados quando save é chamado', async () => {
    const { result } = renderHook(() => useAppData(user));

    await waitFor(() => {
      expect(result.current.cloudReady).toBe(true);
    });

    act(() => {
      result.current.save({
        ...result.current.data,
        xp: 100,
      });
    });

    await waitFor(() => {
      expect(result.current.data.xp).toBe(100);
    });

    await waitFor(() => {
      expect(saveCloudData).toHaveBeenCalledWith(
        user.id,
        expect.objectContaining({ xp: 100 }),
      );
    });
  });

  it('calcula as tarefas pendentes e concluídas', async () => {
    loadCloudData.mockResolvedValue({
      exists: true,
      appData: {
        ...emptyAppData,
        tasks: [
          { id: '1', title: 'Pendente', done: false },
          { id: '2', title: 'Concluída', done: true },
        ],
      },
    });

    const { result } = renderHook(() => useAppData(user));

    await waitFor(() => {
      expect(result.current.cloudReady).toBe(true);
    });

    expect(result.current.pendingTasks).toHaveLength(1);
    expect(result.current.completedTasks).toHaveLength(1);
    expect(result.current.completion).toBe(50);
  });

  it('registra erro quando não consegue carregar a nuvem', async () => {
    loadCloudData.mockRejectedValue(new Error('Falha de conexão'));

    const { result } = renderHook(() => useAppData(user));

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('error');
    });

    expect(result.current.cloudReady).toBe(false);
    expect(result.current.syncError).toContain('Não foi possível');
  });

  it('não tenta carregar a nuvem sem usuário autenticado', async () => {
    const { result } = renderHook(() => useAppData(null));

    await waitFor(() => {
      expect(result.current.syncStatus).toBe('local');
    });

    expect(loadCloudData).not.toHaveBeenCalled();
    expect(saveCloudData).not.toHaveBeenCalled();
  });
});
