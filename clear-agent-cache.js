// Script para limpar completamente o cache de agentes
// Para usar: Copie e cole no console do navegador

// Limpar todas as preferências de agentes
localStorage.removeItem('lastSelectedAgentId');
localStorage.removeItem('selectedAgentId');
localStorage.removeItem('agentId');
localStorage.removeItem('defaultAgentId');

// Limpar qualquer chave que contenha "agent"
Object.keys(localStorage).forEach(key => {
  if (key.toLowerCase().includes('agent')) {
    console.log('Removendo chave:', key);
    localStorage.removeItem(key);
  }
});

// Limpar sessionStorage também
sessionStorage.clear();

console.log('✅ Cache de agentes limpo completamente!');
console.log('Recarregue a página para aplicar as mudanças.');