# 📋 PRD - Implementação Completa Sistema de Notas (Clone Open Notes)

## 🎯 Objetivo
Fazer TODOS os componentes funcionarem IDÊNTICOS ao Open Notes. Nada novo, apenas replicação exata.

## 🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. **Chat Lateral NÃO FUNCIONA**
**Problema**: Componente existe mas não responde às mensagens
**Solução Necessária**:
- Integrar NoteChat.tsx corretamente no NoteEditor
- Conectar com as APIs corretas
- Garantir que o chat MODIFIQUE as notas em tempo real
- Chat deve ter capacidade de:
  - Editar o conteúdo da nota
  - Responder perguntas sobre a nota
  - Aplicar mudanças com streaming
  - Alternar entre modo chat e modo edição

### 2. **Gravação de Áudio QUEBRADA**
**Problema**: Botão de gravar não funciona, dá erro, não para quando clica
**Solução Necessária**:
- Implementar VoiceRecording.tsx completo
- Usar Web Audio API corretamente
- MediaRecorder para captura
- Visualização de amplitude em tempo real
- Botão de parar funcionando
- Transcrição automática após parar

### 3. **Sistema de Arquivos NÃO INTEGRADO**
**Problema**: Upload de arquivos não adiciona contexto para IA
**Solução Necessária**:
- Processar PDFs e documentos
- Extrair conteúdo dos arquivos
- Adicionar ao contexto do chat
- Mostrar arquivos anexados na interface

## 📊 ANÁLISE DO OPEN NOTES (REFERÊNCIA)

### Como Funciona o Chat no Open Notes:
1. **Chat Lateral Flutuante**
   - Abre do lado direito da tela
   - Mantém contexto da nota atual
   - Pode ser minimizado/maximizado
   
2. **Modo Edição vs Modo Chat**
   - **Modo Chat**: Conversa normal com IA sobre a nota
   - **Modo Edição**: IA modifica diretamente o conteúdo
   - Toggle entre modos com botão dedicado
   
3. **Capacidades do Chat**
   - Vê todo o conteúdo da nota
   - Vê arquivos anexados
   - Vê texto selecionado
   - Pode editar qualquer parte
   - Streaming em tempo real
   - Múltiplos modelos de IA

### Como Funciona a Gravação no Open Notes:
1. **Fluxo de Gravação**
   - Clica no botão de microfone
   - Pede permissão do navegador
   - Mostra visualização de amplitude
   - Para com clique no botão stop
   - Transcreve automaticamente
   - Adiciona texto à nota

2. **Opções de Áudio**
   - Record: Grava do microfone
   - Capture Audio: Captura áudio do sistema
   - Upload Audio: Envia arquivo de áudio

## 🛠️ IMPLEMENTAÇÃO NECESSÁRIA

### FASE 1: Corrigir Chat Lateral
```typescript
// 1. Em NoteEditor.tsx
- Importar NoteChat corretamente
- Adicionar estado showChat
- Passar todas as props necessárias:
  - noteId
  - userId  
  - note (conteúdo atual)
  - selectedContent (texto selecionado)
  - onContentUpdate (callback para atualizar)
  - editor (instância do TipTap)
  - files (arquivos anexados)

// 2. Garantir APIs funcionando
- /api/notes/chat deve processar mensagens
- Streaming SSE funcionando
- Aplicar mudanças no editor em tempo real
```

### FASE 2: Implementar Gravação de Áudio
```typescript
// 1. Criar VoiceRecording.tsx
- getUserMedia para capturar áudio
- MediaRecorder API para gravar
- AnalyserNode para amplitude
- Canvas para visualização
- Blob creation ao parar
- Upload automático para transcrição

// 2. Integrar com RecordMenu
- Conectar botões com ações reais
- Estado de gravação
- Feedback visual
```

### FASE 3: Sistema de Arquivos
```typescript
// 1. Processar uploads
- Detectar tipo de arquivo
- Extrair conteúdo (PDF, DOC, TXT)
- Adicionar ao contexto

// 2. Mostrar na UI
- Lista de arquivos anexados
- Ícones por tipo
- Opção de remover
```

### FASE 4: Integração Completa
```typescript
// 1. Conectar tudo
- Chat vê conteúdo da nota
- Chat vê arquivos anexados
- Chat vê seleção
- Chat pode editar tudo

// 2. Persistência
- Auto-save funcionando
- Sincronização com backend
```

## ✅ CHECKLIST DE VALIDAÇÃO

### Chat Lateral
- [ ] Abre/fecha corretamente
- [ ] Envia mensagens
- [ ] Recebe respostas da IA
- [ ] Modo chat funciona
- [ ] Modo edição modifica a nota
- [ ] Streaming em tempo real
- [ ] Vê contexto completo
- [ ] Múltiplos modelos funcionam

### Gravação de Áudio
- [ ] Pede permissão do microfone
- [ ] Inicia gravação ao clicar
- [ ] Mostra amplitude visual
- [ ] Para ao clicar stop
- [ ] Transcreve automaticamente
- [ ] Adiciona texto à nota
- [ ] Upload de arquivo funciona

### Sistema de Arquivos
- [ ] Upload de PDFs
- [ ] Upload de documentos
- [ ] Extração de conteúdo
- [ ] Contexto para IA
- [ ] Lista de anexados
- [ ] Remover arquivos

### Integração Geral
- [ ] Auto-save
- [ ] Todos os botões do AI Menu funcionam
- [ ] YouTube transcript funciona
- [ ] Enhance aplica mudanças
- [ ] Tudo igual ao Open Notes

## 🚨 PRIORIDADES

1. **P0 - CRÍTICO**: Chat lateral funcionando com capacidade de editar notas
2. **P0 - CRÍTICO**: Gravação de áudio funcionando completamente
3. **P1 - IMPORTANTE**: Sistema de arquivos com contexto
4. **P2 - DESEJÁVEL**: Auto-save e persistência

## 📅 CRONOGRAMA

**Hoje**:
1. Corrigir integração do Chat
2. Implementar VoiceRecording
3. Testar tudo funcionando

**Validação Final**:
- Comparar lado a lado com Open Notes
- Cada funcionalidade deve ser IDÊNTICA
- Nenhuma diferença aceitável

## 🎯 DEFINIÇÃO DE PRONTO

O sistema estará pronto quando:
1. **Chat funciona**: Envia mensagem, recebe resposta, edita nota
2. **Áudio funciona**: Grava, para, transcreve, adiciona à nota
3. **Arquivos funcionam**: Upload, extração, contexto para IA
4. **Tudo integrado**: Chat vê tudo, pode editar tudo
5. **Idêntico ao Open Notes**: Sem diferenças visuais ou funcionais