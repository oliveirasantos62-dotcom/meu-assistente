import { supabase } from './supabase';

export async function loadCloudData(userId) {
  if (!userId) {
    throw new Error('Usuário não autenticado.');
  }

  const { data, error } = await supabase
    .from('user_app_data')
    .select('app_data, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data
    ? {
        exists: true,
        appData: data.app_data,
        updatedAt: data.updated_at,
      }
    : {
        exists: false,
        appData: null,
        updatedAt: null,
      };
}

export async function saveCloudData(userId, appData) {
  if (!userId) {
    throw new Error('Usuário não autenticado.');
  }

  const { data, error } = await supabase
    .from('user_app_data')
    .upsert(
      {
        user_id: userId,
        app_data: appData,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      },
    )
    .select('updated_at')
    .single();

  if (error) {
    throw error;
  }

  return data;
}
