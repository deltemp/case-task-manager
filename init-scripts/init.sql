-- Criar tabela users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL
);

-- Criar índices
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- Criar tabela tasks
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done')),
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Criar índices
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_tasks_deleted_at ON tasks(deleted_at);

-- Dados iniciais (senhas: admin123 e user123)
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@casetask.com', '$2b$10$K7L/8Y1t85jzGU.Q1moqiOh77EULvuBUBUHPrIBX5B2opZpwGBqJa', 'Administrador', 'admin'),
('user@casetask.com', '$2b$10$K7L/8Y1t85jzGU.Q1moqiOh77EULvuBUBUHPrIBX5B2opZpwGBqJa', 'Usuário Teste', 'user');

INSERT INTO tasks (title, description, status, user_id) VALUES
('Configurar projeto', 'Inicializar repositório e configurar ambiente de desenvolvimento', 'done', 1),
('Implementar autenticação', 'Criar sistema de login e registro de usuários', 'in_progress', 1),
('Criar interface do usuário', 'Desenvolver componentes React para o frontend', 'pending', 2);