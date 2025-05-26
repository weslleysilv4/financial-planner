# 💰 Financial Planner

Um planejador financeiro moderno e intuitivo construído com Next.js, Supabase e Prisma.

## 🚀 Deploy na Vercel

### Pré-requisitos
- Conta no [Supabase](https://supabase.com)
- Conta na [Vercel](https://vercel.com)

### Passo 1: Configurar o Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto
2. Anote as seguintes informações do seu projeto:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon Key**: Encontrada em Settings > API
   - **Service Role Key**: Encontrada em Settings > API
   - **Database Password**: A senha que você definiu ao criar o projeto

### Passo 2: Deploy na Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em "New Project"
3. Importe este repositório: `https://github.com/weslleysilv4/financial-planner`
4. Configure as seguintes **Environment Variables**:

```env
DATABASE_URL=postgresql://postgres.YOUR_PROJECT_ID:YOUR_PASSWORD@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

5. Substitua:
   - `YOUR_PROJECT_ID` pelo ID do seu projeto Supabase
   - `YOUR_PASSWORD` pela senha do banco de dados
   - `your_supabase_anon_key_here` pela Anon Key do Supabase
   - `your_supabase_service_role_key_here` pela Service Role Key do Supabase

6. Clique em "Deploy"

### Passo 3: Configurar o Banco de Dados

Após o deploy, você precisa configurar as tabelas no banco:

1. Acesse o painel do Supabase
2. Vá em "SQL Editor"
3. Execute o seguinte SQL para criar as tabelas:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create debts table
CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  monthly_interest_rate DECIMAL(5,2),
  minimum_payment DECIMAL(10,2) NOT NULL,
  due_day INTEGER,
  priority_strategy TEXT DEFAULT 'avalanche',
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  debt_id UUID REFERENCES debts(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create budgets table
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  spent DECIMAL(10,2) DEFAULT 0,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

4. Configure a autenticação no Supabase:
   - Vá em Authentication > Settings
   - Configure o "Site URL" para a URL do seu deploy na Vercel
   - Adicione a URL na lista de "Redirect URLs"

### Passo 4: Testar a Aplicação

1. Acesse a URL fornecida pela Vercel
2. Crie uma conta de teste
3. Verifique se todas as funcionalidades estão funcionando

## 🛠️ Tecnologias Utilizadas

- **Next.js 14** - Framework React
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Supabase** - Backend e autenticação
- **Prisma** - ORM para banco de dados
- **shadcn/ui** - Componentes de UI
- **Lucide React** - Ícones

## 📱 Funcionalidades

- ✅ Autenticação completa (login, cadastro, recuperação de senha)
- ✅ Dashboard com visão geral das finanças
- ✅ Gerenciamento de dívidas
- ✅ Controle de transações
- ✅ Planejamento de orçamento
- ✅ Design responsivo
- ✅ Tema claro/escuro

## 🔧 Desenvolvimento Local

```bash
# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env.local

# Executar migrações do banco
pnpm db:push

# Iniciar servidor de desenvolvimento
pnpm dev
```

## 📝 Licença

Este projeto está sob a licença MIT.