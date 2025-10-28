# Case Task Manager [![codecov](https://codecov.io/gh/deltemp/case-task-manager/graph/badge.svg?token=YOUR_TOKEN_HERE)](https://codecov.io/gh/deltemp/case-task-manager)

Um sistema completo de gerenciamento de tarefas construído com Next.js, Nest.js e PostgreSQL, com infraestrutura completa para desenvolvimento local e deploy em produção na AWS.

## 🏗️ Arquitetura

### Frontend
- **Next.js 16** com TypeScript
- **Tailwind CSS** para estilização
- **React Hook Form** para formulários
- **Zod** para validação

### Backend
- **Nest.js** com TypeScript
- **PostgreSQL** como banco de dados
- **TypeORM** para ORM
- **JWT** para autenticação
- **Swagger** para documentação da API

### Infraestrutura
- **Docker** para containerização
- **Docker Compose** para desenvolvimento local
- **AWS ECS** para produção
- **Terraform** para Infrastructure as Code
- **Nginx** como reverse proxy

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+ 
- Docker e Docker Compose
- Git

### Desenvolvimento Local

1. **Clone o repositório**
```bash
git clone <repository-url>
cd case-task-manager
```

2. **Configure as variáveis de ambiente**
```bash
# Copie os arquivos de exemplo
cp case-task-manager-api/.env.example case-task-manager-api/.env
cp case-task-manager-front/.env.example case-task-manager-front/.env.local

# Edite os arquivos .env com suas configurações
```

3. **Inicie o ambiente de desenvolvimento**
```bash
# Instalar dependências
npm run install:all

# Iniciar todos os serviços (PostgreSQL, API, Frontend)
npm run docker:dev

# Ou usar Docker Compose diretamente
docker-compose up --build
```

4. **Acesse a aplicação**
- Frontend: http://localhost:3000
- API: http://localhost:3001
- Documentação da API: http://localhost:3001/api

### Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia frontend e backend em modo dev
npm run build           # Build de produção
npm run test           # Executa todos os testes
npm run lint           # Linting do código

# Docker - Desenvolvimento
npm run docker:dev     # Inicia ambiente completo
npm run docker:build   # Build das imagens
npm run docker:down    # Para todos os containers
npm run docker:logs    # Visualiza logs

# Docker - Produção
npm run docker:prod    # Inicia ambiente de produção
npm run docker:prod:down # Para ambiente de produção

# Database
npm run db:migrate     # Executa migrações
npm run db:seed        # Popula dados iniciais
```

## 📁 Estrutura do Projeto

```
case-task-manager/
├── case-task-manager-api/          # Backend Nest.js
│   ├── src/
│   │   ├── auth/                   # Módulo de autenticação
│   │   ├── users/                  # Módulo de usuários
│   │   ├── tasks/                  # Módulo de tarefas
│   │   └── common/                 # Utilitários compartilhados
│   ├── Dockerfile
│   └── .env.example
├── case-task-manager-front/        # Frontend Next.js
│   ├── src/
│   │   ├── app/                    # App Router do Next.js
│   │   ├── components/             # Componentes React
│   │   ├── hooks/                  # Custom hooks
│   │   ├── lib/                    # Utilitários
│   │   └── types/                  # Definições de tipos
│   ├── Dockerfile
│   └── .env.example
├── terraform/                      # Infraestrutura como código
│   ├── modules/                    # Módulos Terraform
│   │   ├── vpc/                    # Configuração de rede
│   │   ├── rds/                    # Banco de dados
│   │   ├── ecs/                    # Container orchestration
│   │   └── alb/                    # Load balancer
│   └── environments/               # Configurações por ambiente
│       ├── dev/
│       └── prod/
├── scripts/                        # Scripts de automação
├── nginx/                          # Configuração Nginx
├── init-scripts/                   # Scripts de inicialização do DB
├── docker-compose.yml              # Desenvolvimento local
├── docker-compose.prod.yml         # Produção local
└── README.md
```

## 🔧 Configuração

### Variáveis de Ambiente

#### Backend (.env)
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=case_task_manager
DB_USERNAME=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-super-secret-jwt-key

# API
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

#### Frontend (.env.local)
```env
# API
NEXT_PUBLIC_API_URL=http://localhost:3001

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret
```

### Banco de Dados

O banco PostgreSQL é automaticamente configurado via Docker Compose com:
- Usuário: `postgres`
- Senha: `postgres`
- Database: `case_task_manager`
- Porta (container/internal): `5432`
- Porta (host desenvolvimento): `5433` (mapeamento de desenvolvimento para evitar conflito com um PostgreSQL local em `5432`)

#### Conexões no Desenvolvimento

- Motivo: evitar conflitos quando você já tem um PostgreSQL local rodando na porta padrão `5432`.
- Exemplos de conexão (host):
  - `psql -h localhost -p 5433 -U postgres -d case_task_manager`
  - String de conexão: `postgres://postgres:postgres@localhost:5433/case_task_manager`
- Observação: os serviços dentro do Docker continuam se comunicando via rede interna na porta `5432` (`DB_HOST=postgres-db`, `DB_PORT=5432`). Em produção, o banco (RDS) permanece em `5432`.

As tabelas são criadas automaticamente através do script `init-scripts/init.sql`.

## 🚀 Deploy em Produção (AWS)

### Pré-requisitos para Produção

1. **AWS CLI configurado**
```bash
aws configure
```

2. **Terraform instalado**
```bash
# macOS
brew install terraform

# Windows
choco install terraform

# Linux
wget https://releases.hashicorp.com/terraform/1.6.0/terraform_1.6.0_linux_amd64.zip
```

3. **Docker para build das imagens**

### Deploy Automatizado

1. **Configure as variáveis de produção**
```bash
cp .env.prod.example .env.prod
# Edite .env.prod com suas configurações AWS
```

2. **Execute o deploy**
```bash
# Deploy completo (build + infraestrutura)
npm run deploy:prod

# Ou use o script diretamente
./scripts/deploy-prod.sh
```

### Deploy Manual

1. **Inicialize o backend do Terraform**
```bash
./scripts/terraform-init.sh prod
```

2. **Configure as imagens Docker**
```bash
# Build e push para ECR
docker build -t case-task-manager-api ./case-task-manager-api
docker build -t case-task-manager-frontend ./case-task-manager-front

# Tag e push (substitua pelos seus valores)
docker tag case-task-manager-api:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/case-task-manager-api:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/case-task-manager-api:latest
```

3. **Deploy da infraestrutura**
```bash
./scripts/terraform-deploy.sh prod apply
```

### Infraestrutura AWS

O deploy cria os seguintes recursos:

- **VPC** com subnets públicas e privadas
- **RDS PostgreSQL** para o banco de dados
- **ECS Cluster** com Fargate para os containers
- **Application Load Balancer** para distribuição de tráfego
- **CloudWatch** para logs e monitoramento
- **Security Groups** com regras de firewall apropriadas

## 🧪 Testes

### Backend
```bash
cd case-task-manager-api
npm run test          # Testes unitários
npm run test:e2e      # Testes end-to-end
npm run test:cov      # Cobertura de testes
```

### Frontend
```bash
cd case-task-manager-front
npm run test          # Testes com Jest
npm run test:watch    # Modo watch
```

## 📊 Monitoramento

### Logs
```bash
# Desenvolvimento
docker-compose logs -f

# Produção (AWS CloudWatch)
aws logs tail /ecs/case-task-manager-prod-api --follow
aws logs tail /ecs/case-task-manager-prod-frontend --follow
```

### Health Checks
- API Health: `GET /health`
- Frontend: Verificação automática via ALB

## 🔒 Segurança

### Desenvolvimento
- CORS configurado para localhost
- Rate limiting básico
- Validação de entrada com Zod

### Produção
- HTTPS obrigatório via ALB
- Security Groups restritivos
- Secrets gerenciados via variáveis de ambiente
- Rate limiting avançado via Nginx
- Headers de segurança configurados

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 API Documentation

A documentação completa da API está disponível via Swagger:
- Desenvolvimento: http://localhost:3001/api
- Produção: https://your-domain.com/api

### Principais Endpoints

#### Autenticação
- `POST /auth/login` - Login do usuário
- `POST /auth/register` - Registro de novo usuário
- `POST /auth/refresh` - Refresh do token JWT

#### Usuários
- `GET /users/profile` - Perfil do usuário logado
- `PUT /users/profile` - Atualizar perfil

#### Tarefas
- `GET /tasks` - Listar tarefas do usuário
- `POST /tasks` - Criar nova tarefa
- `GET /tasks/:id` - Obter tarefa específica
- `PUT /tasks/:id` - Atualizar tarefa
- `DELETE /tasks/:id` - Deletar tarefa

## 🐛 Troubleshooting

### Problemas Comuns

1. **Erro de conexão com banco**
   - Verifique se o PostgreSQL está rodando
   - Confirme as credenciais no .env

2. **Porta já em uso**
   ```bash
   # Parar containers existentes
   docker-compose down
   
   # Verificar processos na porta
   lsof -i :3000
   lsof -i :3001
   ```

3. **Problemas com Docker**
   ```bash
   # Limpar containers e imagens
   docker system prune -a
   
   # Rebuild completo
   docker-compose up --build --force-recreate
   ```

4. **Erro no Terraform**
   ```bash
   # Reset do estado
   terraform init -reconfigure
   
   # Verificar recursos existentes
   terraform state list
   ```

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte e dúvidas:
- Abra uma issue no GitHub
- Consulte a documentação da API
- Verifique os logs da aplicação

---

**Case Task Manager** - Sistema completo de gerenciamento de tarefas com infraestrutura moderna e escalável.