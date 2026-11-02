/**
 * Centraliza a regra de personalização dos módulos.
 * "enabled" controla se o módulo pode ser acessado.
 * "references" controla se outras páginas podem fazer referência ao módulo.
 */
export function isModuleEnabled(data, moduleId) {
  return data?.settings?.modules?.[moduleId] !== false;
}

export function showModuleReferences(data, moduleId) {
  if (!isModuleEnabled(data, moduleId)) return false;
  return data?.settings?.moduleReferences?.[moduleId] !== false;
}
