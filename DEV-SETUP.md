# 🛠️ Guia de Setup - VS Code + GitHub + Claude

Configure seu ambiente de desenvolvimento para trabalhar no MEI Control com integração completa.

---

## 📋 Índice

1. [VS Code - Extensões Essenciais](#1-vs-code---extensões-essenciais)
2. [Configurar Git e GitHub](#2-configurar-git-e-github)
3. [Integração com Claude](#3-integração-com-claude)
4. [Abrir e Rodar o Projeto](#4-abrir-e-rodar-o-projeto)
5. [Workflow de Desenvolvimento](#5-workflow-de-desenvolvimento)

---

## 1. VS Code - Extensões Essenciais

### 1.1 Instalar Extensões

Abra o VS Code e instale estas extensões (Ctrl+Shift+X):

#### Essenciais para o Projeto:
```
✅ ES7+ React/Redux/React-Native snippets
✅ Tailwind CSS IntelliSense
✅ Prisma
✅ ESLint
✅ Prettier - Code formatter
✅ Auto Rename Tag
✅ Path Intellisense
```

#### Git e GitHub:
```
✅ GitHub Pull Requests and Issues
✅ GitLens — Git supercharged
✅ Git Graph
```

#### Claude e IA:
```
✅ Claude Dev (by Anthropic) - ou "Cline"
✅ Continue (alternativa open-source)
```

#### Docker (opcional):
```
✅ Docker
✅ Dev Containers
```

### 1.2 Instalar via Terminal do VS Code

Ou cole isso no terminal (Ctrl+`):

```bash
code --install-extension dsznajder.es7-react-js-snippets
code --install-extension bradlc.vscode-tailwindcss
code --install-extension Prisma.prisma
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension formulahendry.auto-rename-tag
code --install-extension christian-kohler.path-intellisense
code --install-extension GitHub.vscode-pull-request-github
code --install-extension eamodio.gitlens
code --install-extension mhutchie.git-graph
code --install-extension saoudrizwan.claude-dev
```

---

## 2. Configurar Git e GitHub

### 2.1 Instalar Git (se não tiver)

Baixe em: https://git-scm.com/download/win

Durante instalação, selecione:
- ✅ "Use Visual Studio Code as Git's default editor"
- ✅ "Git from the command line and also from 3rd-party software"

### 2.2 Configurar Git

Abra o terminal do VS Code (Ctrl+`) e configure:

```bash
# Seu nome (aparece nos commits)
git config --global user.name "Seu Nome"

# Seu email (mesmo do GitHub)
git config --global user.email "seu-email@exemplo.com"

# VS Code como editor padrão
git config --global core.editor "code --wait"

# Verificar configuração
git config --list
```

### 2.3 Conectar com GitHub

#### Opção A: Pelo VS Code (Mais Fácil)

1. Clique no ícone de **Contas** (canto inferior esquerdo)
2. Clique em **"Sign in to GitHub"**
3. Autorize no navegador
4. Pronto! VS Code conectado ao GitHub

#### Opção B: SSH (Mais Seguro)

```bash
# Gerar chave SSH
ssh-keygen -t ed25519 -C "seu-email@exemplo.com"

# Iniciar agente SSH
eval "$(ssh-agent -s)"

# Adicionar chave
ssh-add ~/.ssh/id_ed25519

# Copiar chave pública
cat ~/.ssh/id_ed25519.pub
```

Depois:
1. Vá em GitHub → Settings → SSH Keys
2. Clique "New SSH Key"
3. Cole a chave e salve

### 2.4 Criar Repositório no GitHub

#### Pelo VS Code:

1. Abra a pasta do projeto (`mei-control`)
2. Vá em **Source Control** (Ctrl+Shift+G)
3. Clique em **"Publish to GitHub"**
4. Escolha público ou privado
5. Pronto! Repositório criado automaticamente

#### Pelo Terminal:

```bash
cd mei-control

# Inicializar Git
git init

# Adicionar todos os arquivos
git add .

# Primeiro commit
git commit -m "🎉 Initial commit - MEI Control"

# Criar repo no GitHub (precisa do GitHub CLI)
gh repo create mei-control --public --source=. --push

# Ou manualmente:
# 1. Crie o repo em github.com
# 2. Conecte:
git remote add origin https://github.com/SEU-USUARIO/mei-control.git
git branch -M main
git push -u origin main
```

---

## 3. Integração com Claude

### 3.1 Claude Dev (Extensão Oficial)

A extensão **Claude Dev** (também conhecida como "Cline") permite conversar com Claude diretamente no VS Code.

#### Instalação:
1. Busque "Claude Dev" ou "Cline" nas extensões
2. Instale
3. Configure sua API Key da Anthropic:
   - Vá em https://console.anthropic.com
   - Crie uma API Key
   - No VS Code: Ctrl+Shift+P → "Claude: Set API Key"

#### Uso:
- **Ctrl+Shift+P** → "Claude: Open Chat"
- Selecione código e peça para Claude explicar/melhorar
- Claude pode editar arquivos diretamente!

### 3.2 Continue (Alternativa Gratuita)

Continue é open-source e suporta Claude, GPT, e modelos locais.

1. Instale a extensão "Continue"
2. Configure em `.continue/config.json`:

```json
{
  "models": [
    {
      "title": "Claude Sonnet",
      "provider": "anthropic",
      "model": "claude-sonnet-4-20250514",
      "apiKey": "SUA_API_KEY"
    }
  ]
}
```

3. Use:
   - **Ctrl+L**: Chat com IA
   - **Ctrl+I**: Editar código com IA
   - Selecione código → clique direito → "Ask Continue"

### 3.3 Claude Code (Terminal)

Claude Code é uma ferramenta de linha de comando para coding com Claude.

```bash
# Instalar
npm install -g @anthropic-ai/claude-code

# Configurar
export ANTHROPIC_API_KEY=sua-api-key

# Usar
cd mei-control
claude-code

# Dentro do Claude Code:
> Adicione validação de CNPJ no formulário de cadastro
> Crie um teste para o controller de notas fiscais
> Explique como funciona o sistema de alertas de teto
```

---

## 4. Abrir e Rodar o Projeto

### 4.1 Extrair e Abrir

```bash
# Extrair o ZIP
unzip mei-control.zip

# Abrir no VS Code
code mei-control
```

Ou: **File → Open Folder → Selecione `mei-control`**

### 4.2 Instalar Dependências

Abra o terminal no VS Code (Ctrl+`):

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4.3 Configurar Banco de Dados

#### Opção A: PostgreSQL Local

1. Instale PostgreSQL: https://www.postgresql.org/download/
2. Crie o banco:

```sql
CREATE DATABASE mei_control;
```

3. Configure `.env`:

```bash
cd backend
copy .env.example .env
```

Edite `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:SuaSenha@localhost:5432/mei_control"
JWT_SECRET="chave-secreta-para-desenvolvimento"
```

#### Opção B: Docker (Recomendado)

```bash
# Na raiz do projeto
docker compose up postgres -d

# Verificar
docker compose ps
```

### 4.4 Rodar Migrations e Seed

```bash
cd backend

# Gerar cliente Prisma
npx prisma generate

# Criar tabelas
npx prisma db push

# Popular com dados de teste
npm run db:seed
```

### 4.5 Iniciar Servidores

Abra **2 terminais** no VS Code:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 4.6 Acessar

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001
- **Login:** CPF `123.456.789-00` / Senha `123456`

---

## 5. Workflow de Desenvolvimento

### 5.1 Estrutura de Branches

```
main          ← Produção (sempre funcionando)
  └── develop ← Desenvolvimento
       ├── feature/nova-funcionalidade
       ├── fix/corrigir-bug
       └── refactor/melhorar-codigo
```

### 5.2 Criar Nova Feature

```bash
# Criar e mudar para nova branch
git checkout -b feature/filtro-avancado-notas

# Fazer alterações...
# Testar...

# Adicionar mudanças
git add .

# Commit com mensagem descritiva
git commit -m "✨ Adiciona filtro avançado na listagem de notas"

# Enviar para GitHub
git push origin feature/filtro-avancado-notas
```

### 5.3 Padrão de Commits (Conventional Commits)

```
✨ feat:     Nova funcionalidade
🐛 fix:      Correção de bug
📝 docs:     Documentação
💄 style:    Formatação (não altera código)
♻️ refactor: Refatoração
🧪 test:     Testes
🔧 chore:    Configurações
```

Exemplos:
```bash
git commit -m "✨ feat: adiciona exportação de relatório em PDF"
git commit -m "🐛 fix: corrige cálculo do teto proporcional"
git commit -m "📝 docs: atualiza README com instruções de deploy"
```

### 5.4 Pull Request

1. Após push, vá no GitHub
2. Clique em **"Compare & pull request"**
3. Descreva as mudanças
4. Peça review (se tiver equipe)
5. Merge quando aprovado

### 5.5 Sincronizar com Main

```bash
# Voltar para main
git checkout main

# Baixar atualizações
git pull origin main

# Criar nova branch a partir da main atualizada
git checkout -b feature/proxima-funcionalidade
```

---

## 🎯 Dicas Pro

### VS Code Shortcuts Úteis

| Atalho | Ação |
|--------|------|
| Ctrl+P | Buscar arquivos |
| Ctrl+Shift+P | Paleta de comandos |
| Ctrl+` | Terminal |
| Ctrl+B | Toggle sidebar |
| Ctrl+Shift+G | Git |
| F12 | Ir para definição |
| Alt+Shift+F | Formatar código |
| Ctrl+D | Selecionar próxima ocorrência |

### Workspace Settings

Crie `.vscode/settings.json` no projeto:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.includeLanguages": {
    "javascript": "javascript",
    "javascriptreact": "javascriptreact"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  }
}
```

### Debug Configuration

Crie `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}/backend",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "console": "integratedTerminal"
    }
  ]
}
```

---

## ✅ Checklist de Setup

- [ ] VS Code instalado
- [ ] Extensões instaladas
- [ ] Git configurado com nome e email
- [ ] GitHub conectado no VS Code
- [ ] Repositório criado no GitHub
- [ ] Claude Dev ou Continue configurado
- [ ] Projeto aberto no VS Code
- [ ] Dependências instaladas (npm install)
- [ ] Banco de dados rodando
- [ ] Migrations e seed executados
- [ ] Backend rodando (localhost:3001)
- [ ] Frontend rodando (localhost:5173)
- [ ] Login funcionando

---

**Pronto para desenvolver! 🚀**
