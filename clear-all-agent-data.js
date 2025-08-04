// Script para limpar todos os dados de agente do localStorage
// Execute este script no console do navegador para resetar completamente a seleção de agentes

// Limpar seleção de agente
localStorage.removeItem('lastSelectedAgentId');

// Limpar qualquer outro dado relacionado a agentes
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.includes('agent') || key.includes('Agent'))) {
    keysToRemove.push(key);
  }
}

keysToRemove.forEach(key => {
  console.log('Removendo:', key);
  localStorage.removeItem(key);
});

console.log('Todos os dados de agente foram limpos do localStorage');
console.log('Por favor, recarregue a página para aplicar as mudanças.');