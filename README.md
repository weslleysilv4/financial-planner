# Financial Planner

Um planejador financeiro completo construído com Next.js, Prisma, Supabase e Tailwind CSS.

## 🚀 Deploy na Vercel

### Pré-requisitos
- Conta no [Supabase](https://supabase.com)
- Conta na [Vercel](https://vercel.com)

### Configuração do Banco de Dados (Supabase)

1. Acesse o [Supabase](https://supabase.com) e crie um novo projeto
2. Após criado, vá em **Settings** > **API**
3. Anote as seguintes informações:
   - Project URL
   - Project ID
   - anon/public key
   - service_role key (em Service Role)
4. Vá em **Settings** > **Database** e anote:
   - Connection string (para DATABASE_URL)
   - Direct connection string (para DIRECT_URL)

### Deploy na Vercel

1. **Conectar Repositório**
   - Acesse [Vercel](https://vercel.com)
   - Clique em "New Project"
   - Conecte este repositório GitHub: `weslleysilv4/financial-planner`

2. **Configurar Variáveis de Ambiente**
   
   Na página de configuração do projeto na Vercel, adicione as seguintes variáveis de ambiente:

   ```
   DATABASE_URL=postgresql://postgres.PROJECT_ID:PASSWORD@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
   
   DIRECT_URL=postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres
   
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
   ```

   **Substitua:**
   - `PROJECT_ID` pelo ID do seu projeto Supabase
   - `PASSWORD` pela senha do banco de dados
   - `YOUR_PROJECT_ID` pelo ID do projeto
   - As chaves pelos valores obtidos no Supabase

3. **Fazer Deploy**
   - Clique em "Deploy"
   - A Vercel irá automaticamente instalar dependências e fazer build
   - O Prisma será executado automaticamente durante o build

## 🛠️ Tecnologias Utilizadas

- **Next.js 14** - Framework React
- **Prisma** - ORM para banco de dados
- **Supabase** - Backend as a Service (PostgreSQL)
- **Tailwind CSS** - Framework CSS
- **shadcn/ui** - Componentes UI
- **TypeScript** - Tipagem estática

## 📁 Estrutura do Projeto

```
├── app/                 # App Router (Next.js 13+)
├── components/          # Componentes reutilizáveis
├── lib/                # Utilitários e configurações
├── prisma/             # Schema do banco de dados
├── types/              # Definições de tipos TypeScript
└── public/             # Arquivos estáticos
```

## 🎯 Funcionalidades

- ✅ Autenticação com Supabase
- ✅ Gerenciamento de dívidas
- ✅ Controle de transações
- ✅ Planejamento de orçamento
- ✅ Interface responsiva
- ✅ Tema claro/escuro

## 🔧 Desenvolvimento Local

1. Clone o repositório
2. Instale as dependências: `npm install`
3. Configure as variáveis de ambiente (copie de `.env.example`)
4. Execute as migrações: `npx prisma db push`
5. Inicie o servidor: `npm run dev`

## 📝 Scripts Disponíveis

- `npm run dev` - Servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run start` - Servidor de produção
- `npm run db:generate` - Gerar cliente Prisma
- `npm run db:push` - Aplicar mudanças no schema
- `npm run db:studio` - Interface visual do banco