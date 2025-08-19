# Product Requirements Document (PRD)
## Aprimoramento do Sistema de Notas: Paridade com Open-notes

**Versão:** 1.1
**Data:** 19 de agosto de 2025
**Status:** Proposto
**Autor:** Gemini AI

---

## 📋 Sumário Executivo

### Visão Geral
Este documento detalha as funcionalidades ausentes e as diferenças de implementação entre o sistema de notas atual em `sunakortix` e a versão original no projeto `Open-notes`. O objetivo é alcançar a paridade de funcionalidades, focando em recursos avançados de processamento de conteúdo (áudio, vídeo, URLs) e inteligência artificial, conforme a visão original de clonagem.

### Objetivo Principal
Implementar as funcionalidades de transcrição de áudio/vídeo, processamento de URLs (YouTube, web), e aprimoramento de texto por IA no sistema de notas do `sunakortix`, garantindo que a experiência e a capacidade sejam equivalentes às do `Open-notes`.

### Valor de Negócio
- **Funcionalidade Completa**: Oferecer a experiência rica e completa de notas prometida, aumentando a satisfação do usuário.
- **Eficiência**: Automatizar a extração e sumarização de conteúdo de diversas fontes, economizando tempo do usuário.
- **Inteligência**: Prover ferramentas de IA para refinar e enriquecer o conteúdo das notas.
- **Consistência**: Alinhar o produto com a visão original e as expectativas de clonagem.

---

## 🎯 Objetivos e Metas

### Objetivos Primários
1.  **Implementar transcrição de áudio/vídeo**: Permitir a gravação direta e o upload de áudio/vídeo para transcrição.
2.  **Processar URLs**: Habilitar a extração e transcrição de conteúdo de links do YouTube e URLs de sites.
3.  **Aprimorar texto com IA**: Desenvolver funcionalidades de "embelezamento" e sumarização de texto utilizando LLMs.
4.  **Garantir paridade**: Assegurar que as novas funcionalidades se integrem de forma coesa e ofereçam a mesma qualidade e robustez do `Open-notes`.

### Metas de Sucesso
- [ ] Funcionalidade de gravação de áudio no frontend e backend.
- [ ] Transcrição de áudio/vídeo (gravado ou upload) funcionando com alta precisão.
- [ ] Extração e transcrição de conteúdo de URLs do YouTube.
- [ ] Extração de conteúdo de URLs de sites genéricos.
- [ ] Funcionalidade de "embelezamento" de texto por IA.
- [ ] Integração de todas as novas funcionalidades com o editor TipTap existente.

---

## 🔧 Requisitos Funcionais (Gaps Identificados)

### RF1: Editor de Notas (Painel Central) - Aprimoramentos

*   **RF1.1: Gravação e Transcrição de Áudio/Vídeo**
    *   **RF1.1.1 (Frontend):** Implementar a lógica completa para gravação de áudio diretamente no navegador (via `RecordMenu`), incluindo visualização do status da gravação.
    *   **RF1.1.2 (Backend):** Desenvolver endpoint no backend para receber streams de áudio gravados e enviá-los para o serviço de transcrição.
    *   **RF1.1.3 (Backend):** Aprimorar o serviço de transcrição (`backend/services/transcription.py`) para suportar múltiplos motores STT (e.g., Deepgram, Azure Speech-to-Text) conforme `open-notes-reference/backend/open_webui/routers/audio.py`.
    *   **RF1.1.4 (Backend):** Integrar o serviço de transcrição com o processo de ingestão de conhecimento, permitindo que o texto transcrito seja usado para "embelezamento" ou como entrada para o LLM.

*   **RF1.2: Processamento de URLs (YouTube e Web)**
    *   **RF1.2.1 (Frontend):** Implementar a lógica para detecção e visualização de previews de links do YouTube (`YouTubePreviewHandler.svelte` em `open-notes-reference`) no editor TipTap.
    *   **RF1.2.2 (Backend):** Criar novos endpoints no backend (similar a `open-notes-reference/backend/open_webui/routers/retrieval.py`) para:
        *   Processar URLs do YouTube, extraindo a transcrição do vídeo.
        *   Processar URLs de sites genéricos, extraindo o conteúdo principal da página.
    *   **RF1.2.3 (Backend):** Integrar esses novos endpoints de processamento de URL com o sistema de conhecimento (`knowledge_base`) para que o conteúdo extraído possa ser usado como contexto para agentes ou para "embelezamento" de notas.

*   **RF1.3: Aprimoramento de Texto por IA ("Embelezamento")**
    *   **RF1.3.1 (Frontend):** Implementar a lógica completa para o menu de IA (`AIMenu`) no editor, acionando as funcionalidades de aprimoramento.
    *   **RF1.3.2 (Backend):** Desenvolver um serviço de IA (provavelmente como um `agentpress_tool` ou um novo módulo) que utilize LLMs para:
        *   "Embelezar" ou reescrever trechos de texto selecionados.
        *   Gerar resumos automáticos de notas.
        *   Incorporar informações de contexto (transcrições de áudio/vídeo, conteúdo de URLs) para enriquecer a nota existente, conforme a lógica em `open-notes-reference/src/lib/components/notes/NoteEditor.svelte` (`enhanceNoteHandler`).
    *   **RF1.3.3 (Backend):** Integrar este serviço de IA com o módulo `agent` e o `services.llm` para fazer as chamadas aos LLMs.
    *   **RF1.3.4 (Backend):** Considerar a implementação de um banco de dados vetorial (similar ao `open-notes-reference` com `VECTOR_DB_CLIENT`) para gerenciar e consultar o conteúdo extraído de arquivos e URLs, otimizando o uso como contexto para LLMs.

### RF2: Backend - Estrutura e Integração

*   **RF2.1: Módulo de Notas Dedicado:**
    *   **RF2.1.1 (Backend):** Avaliar a necessidade de um módulo de backend dedicado para o CRUD de notas (similar a `open-notes-reference/backend/open_webui/routers/notes.py`) para centralizar a lógica de negócios das notas, em vez de depender apenas do Supabase via frontend. Isso pode melhorar a robustez e a capacidade de adicionar lógica complexa no futuro.

*   **RF2.2: Gerenciamento de Arquivos e Conteúdo:**
    *   **RF2.2.1 (Backend):** Aprimorar o `backend/knowledge_base/file_processor.py` ou criar um novo módulo para lidar com uma gama mais ampla de tipos de arquivos e métodos de extração de conteúdo, além de `.txt`, `.pdf`, `.docx` (e.g., imagens com OCR, outros formatos de documentos).

---

## 💻 Arquitetura Técnica (Sugestões de Implementação)

### Frontend
-   **Editor:** Manter TipTap. Adaptar as extensões e a lógica de interação com os novos recursos de áudio, vídeo e IA.
-   **Componentes:** Replicar a lógica dos componentes Svelte (`AIMenu.svelte`, `RecordMenu.svelte`, `YouTubePreviewHandler.svelte`) para React (`.tsx`), garantindo a mesma funcionalidade e UX.

### Backend
-   **Framework:** Manter FastAPI.
-   **Serviços:**
    -   **Transcrição:** Expandir `backend/services/transcription.py` para incluir suporte a múltiplos provedores (Deepgram, Azure) e métodos de entrada (gravação direta, URLs).
    -   **Processamento de Conteúdo (URLs):** Criar um novo módulo ou expandir `knowledge_base` para incluir a lógica de extração de conteúdo de YouTube e web, possivelmente utilizando bibliotecas como `youtube-dl` (ou alternativas Python) e `BeautifulSoup` / `Playwright` para web scraping, similar ao que `open-notes-reference/backend/open_webui/retrieval.py` faz.
    -   **IA/Embelezamento:** Implementar a lógica de "embelezamento" como um `agentpress_tool` ou um serviço dedicado que orquestre chamadas a LLMs (via `services.llm`) e utilize o conteúdo extraído (de arquivos, áudio, URLs) como contexto.
    -   **Banco de Dados Vetorial:** Avaliar a integração de um banco de dados vetorial (e.g., ChromaDB, Pinecone) para armazenar embeddings de conteúdo e facilitar a recuperação de informações relevantes para os LLMs, replicando a funcionalidade do `VECTOR_DB_CLIENT` em `open-notes-reference`.

---

## 🚀 Roadmap de Implementação (Fases Sugeridas)

Este roadmap é uma extensão do PRD original, focando nas lacunas identificadas.

### Fase 1: Fundação de Conteúdo (3 semanas)
-   [ ] **Backend:** Implementar endpoints para processamento de URLs do YouTube (extração de transcrição).
-   [ ] **Backend:** Implementar endpoints para processamento de URLs de sites genéricos (extração de conteúdo principal).
-   [ ] **Backend:** Integrar os novos endpoints de URL com o sistema de conhecimento (`knowledge_base`) para ingestão de conteúdo.
-   [ ] **Frontend:** Desenvolver `YouTubePreviewHandler` em React para o editor.

### Fase 2: Áudio e Transcrição Avançada (3 semanas)
-   [ ] **Frontend:** Implementar a lógica de gravação de áudio no navegador (`RecordMenu` em React).
-   [ ] **Backend:** Desenvolver endpoint para receber áudio gravado e enviá-lo para transcrição.
-   [ ] **Backend:** Aprimorar `backend/services/transcription.py` para suportar múltiplos motores STT (se aplicável e necessário).
-   [ ] **Backend:** Integrar transcrições de áudio/vídeo com o sistema de conhecimento.

### Fase 3: Inteligência e Embelezamento (4 semanas)
-   [ ] **Backend:** Desenvolver o serviço de "embelezamento" de texto por IA (como `agentpress_tool` ou serviço dedicado).
-   [ ] **Backend:** Implementar a lógica para sumarização automática de notas.
-   [ ] **Frontend:** Implementar a lógica do `AIMenu` em React para acionar as funcionalidades de IA.
-   [ ] **Backend:** Avaliar e, se necessário, integrar um banco de dados vetorial para RAG com o conteúdo das notas e extrações.

### Fase 4: Refinamento e Testes (2 semanas)
-   [ ] Testes de integração e ponta a ponta para todas as novas funcionalidades.
-   [ ] Otimização de performance para processamento de conteúdo e chamadas de IA.
-   [ ] Documentação técnica das novas APIs e componentes.

**Timeline Total Estimada para Gaps: 12 semanas**

---

## ✅ Critérios de Aceitação (Adicionais)

### Must Have (P0)
-   ✅ Gravação de áudio no frontend e transcrição no backend.
-   ✅ Extração e transcrição de URLs do YouTube.
-   ✅ Extração de conteúdo de URLs de sites.
-   ✅ Funcionalidade básica de "embelezamento" de texto (e.g., reescrita, sumarização).

### Should Have (P1)
-   ⏳ Suporte a múltiplos motores STT.
-   ⏳ Integração completa de banco de dados vetorial para RAG.
-   ⏳ Geração de título de nota por IA.

---

## 🚨 Riscos e Mitigações (Adicionais)

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Complexidade da integração de LLMs e ferramentas | Alta | Alto | Dividir em tarefas menores, usar bibliotecas existentes, testes unitários e de integração rigorosos. |
| Performance do processamento de conteúdo (áudio/vídeo/web) | Média | Médio | Processamento assíncrono em background, otimização de bibliotecas de extração, caching. |
| Diferenças de comportamento entre Svelte e React | Média | Médio | Revisão de código cuidadosa, testes de regressão, validação visual. |
| Custos de API para LLMs e STT | Média | Alto | Monitoramento de uso, otimização de chamadas, implementação de caching. |

---

## 📚 Anexos (Adicionais)

### A. Referências de Código
-   `open-notes-reference/src/lib/components/notes/NoteEditor.svelte`
-   `open-notes-reference/src/lib/components/notes/AIMenu.svelte`
-   `open-notes-reference/src/lib/components/notes/RecordMenu.svelte`
-   `open-notes-reference/src/lib/components/notes/YouTubePreviewHandler.svelte`
-   `open-notes-reference/backend/open_webui/routers/audio.py`
-   `open-notes-reference/backend/open_webui/routers/retrieval.py`
-   `open-notes-reference/backend/open_webui/routers/openai.py`

---

## 📝 Aprovações

| Stakeholder | Cargo | Data | Assinatura |
|---|---|---|---|
| Product Owner | PO | - | - |
| Tech Lead | TL | - | - |
| UX Designer | UX | - | - |
| Dev Team | DEV | - | - |

---

## 🔄 Histórico de Revisões

| Versão | Data | Autor | Mudanças |
|---|---|---|---|
| 1.0 | Dez/2024 | Product Team | Versão inicial do PRD (original) |
| 1.1 | 19/08/2025 | Gemini AI | Análise de gaps e proposta de aprimoramento para paridade com Open-notes |

---

**Status do Documento**: ✅ Pronto para Revisão e Discussão
