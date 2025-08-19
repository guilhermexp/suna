# 🚀 Guia de Setup Completo - Sistema de Notas

## ✅ Status Atual

### Já Concluído:
1. ✅ **Dependências instaladas** - TipTap e todas as bibliotecas necessárias
2. ✅ **Componentes criados** - Todos os componentes React prontos
3. ✅ **Hooks implementados** - Sistema completo de hooks para Supabase
4. ✅ **Sidebar atualizada** - Item "Notas" adicionado com badge
5. ✅ **Rota configurada** - Página `/notes` criada

### Falta Fazer:
1. ⏳ **Executar SQL no Supabase** - Criar tabelas e políticas
2. ⏳ **Criar Storage Bucket** - Para upload de arquivos
3. ⏳ **Testar o sistema** - Verificar se tudo funciona

---

## 📋 Passos para Completar o Setup

### Passo 1: Criar as Tabelas no Supabase

1. Acesse o **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para **SQL Editor** (ícone de terminal na sidebar)
4. Clique em **New Query**
5. **Cole o conteúdo completo** do arquivo `EXECUTE_IN_SUPABASE.sql`
6. Clique em **Run** (ou pressione Cmd/Ctrl + Enter)
7. Aguarde a mensagem de sucesso

**Verificação:**
- Vá para **Table Editor** na sidebar
- Você deve ver 10 novas tabelas:
  - notes
  - tags
  - note_tags
  - note_messages
  - message_reactions
  - note_shares
  - note_activities
  - note_versions
  - user_note_preferences
  - note_attachments

### Passo 2: Criar o Storage Bucket

1. Ainda no **SQL Editor**
2. Clique em **New Query**
3. **Cole o conteúdo** do arquivo `CREATE_STORAGE_BUCKET.sql`
4. Clique em **Run**

**Alternativa (via UI):**
1. Vá para **Storage** na sidebar
2. Clique em **New Bucket**
3. Nome: `note-attachments`
4. Public: **Desligado**
5. File size limit: **50MB**
6. Allowed MIME types: Adicione os tipos necessários

### Passo 3: Verificar Configurações

1. **Verifique as variáveis de ambiente** em `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://jbacmubu112404007516.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui
```

2. **Verifique o Realtime** no Supabase:
   - Vá para **Settings** > **API**
   - Em **Realtime**, verifique se está **Enabled**

### Passo 4: Testar o Sistema

1. **Inicie o servidor de desenvolvimento:**
```bash
npm run dev
```

2. **Acesse a aplicação:**
   - Abra http://localhost:3000
   - Faça login
   - Clique em **"Notas"** na sidebar

3. **Teste as funcionalidades:**
   - ✅ Criar uma nova nota
   - ✅ Editar e formatar texto
   - ✅ Adicionar tags
   - ✅ Marcar como favorita
   - ✅ Usar o chat
   - ✅ Fazer upload de arquivos

---

## 🔍 Troubleshooting

### Erro: "relation "notes" does not exist"
**Solução:** Execute o SQL do Passo 1

### Erro: "Storage bucket not found"
**Solução:** Execute o SQL do Passo 2 ou crie o bucket manualmente

### Erro: "Permission denied"
**Problema:** RLS policies não aplicadas
**Solução:** Re-execute o SQL, especialmente a parte de policies

### Chat não funciona em tempo real
**Verificar:**
1. Realtime está habilitado no Supabase
2. As tabelas têm realtime habilitado (já está no SQL)
3. Conexão websocket não está bloqueada

### Upload de arquivo falha
**Verificar:**
1. Bucket existe e tem as políticas corretas
2. Arquivo não excede 50MB
3. Tipo de arquivo é permitido

---

## 📊 Verificação Final

### No Supabase Dashboard:

#### Table Editor
- [ ] 10 tabelas criadas
- [ ] Todas com RLS habilitado (ícone de cadeado)

#### Storage
- [ ] Bucket `note-attachments` existe
- [ ] Políticas RLS aplicadas

#### API Docs
- [ ] Endpoints das tabelas aparecem
- [ ] Realtime subscriptions disponíveis

### Na Aplicação:

#### Interface
- [ ] Item "Notas" aparece na sidebar
- [ ] Badge mostra contador de notas
- [ ] Página de notas carrega sem erros

#### Funcionalidades
- [ ] Editor TipTap funciona
- [ ] Auto-save está salvando
- [ ] Chat atualiza em tempo real
- [ ] Upload de arquivos funciona
- [ ] Busca retorna resultados

---

## 🎯 Comandos Úteis

### Ver logs do Supabase:
```sql
SELECT * FROM auth.users LIMIT 5; -- Ver usuários
SELECT * FROM notes WHERE user_id = 'seu-user-id'; -- Ver suas notas
SELECT COUNT(*) FROM notes; -- Contar total de notas
```

### Limpar dados de teste:
```sql
-- CUIDADO: Remove todas as notas!
TRUNCATE notes CASCADE;
```

### Debug no browser:
```javascript
// Console do browser
localStorage.setItem('debug', 'notes:*'); // Ativar logs
const { data } = await supabase.from('notes').select('*'); // Testar query
console.log(data); // Ver resultado
```

---

## ✨ Próximos Passos (Opcional)

Após o sistema estar funcionando, você pode:

1. **Personalizar o tema** - Editar cores em `NotesContainer.tsx`
2. **Adicionar atalhos** - Configurar hotkeys customizadas
3. **Implementar templates** - Criar templates de notas
4. **Adicionar IA** - Integrar com GPT para sugestões
5. **Exportação avançada** - PDF com formatação

---

## 📞 Suporte

Se algo não funcionar:

1. **Verifique o console do browser** (F12) para erros
2. **Verifique os logs do Supabase** em Logs > API
3. **Confirme que executou todos os SQLs**
4. **Verifique as variáveis de ambiente**

---

## 🎉 Sucesso!

Quando tudo estiver funcionando, você terá:
- Sistema completo de notas com editor rico
- Chat em tempo real integrado
- Upload de arquivos
- Tags e organização
- Busca inteligente
- Interface moderna e responsiva

**Aproveite seu novo sistema de notas!** 📝✨