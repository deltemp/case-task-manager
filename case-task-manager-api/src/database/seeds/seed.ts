import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../api/users/entities/user.entity';
import { Task, TaskStatus, TaskPriority } from '../../api/tasks/entities/task.entity';

// Carregar variáveis de ambiente
dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  database: process.env.DB_NAME || 'case_task_manager',
  entities: [User, Task],
  synchronize: false,
});

async function seed() {
  try {
    console.log('🌱 Iniciando processo de seed...');
    
    // Conectar ao banco de dados
    await AppDataSource.initialize();
    console.log('✅ Conectado ao banco de dados');

    const userRepository = AppDataSource.getRepository(User);
    const taskRepository = AppDataSource.getRepository(Task);

    // Hash da senha "Teste123"
    const hashedPassword = await bcrypt.hash('Teste123', 10);

    // Verificar se os usuários já existem
    const existingAdmin = await userRepository.findOne({ where: { email: 'admin@casetask.com' } });
    const existingUser = await userRepository.findOne({ where: { email: 'user@casetask.com' } });

    let adminUser: User;
    let regularUser: User;

    // Criar usuário admin se não existir
    if (!existingAdmin) {
      adminUser = userRepository.create({
        name: 'Admin User',
        email: 'admin@casetask.com',
        password: hashedPassword,
        role: UserRole.ADMIN,
      });
      await userRepository.save(adminUser);
      console.log('✅ Usuário admin criado: admin@casetask.com');
    } else {
      adminUser = existingAdmin;
      console.log('ℹ️  Usuário admin já existe: admin@casetask.com');
    }

    // Criar usuário regular se não existir
    if (!existingUser) {
      regularUser = userRepository.create({
        name: 'Regular User',
        email: 'user@casetask.com',
        password: hashedPassword,
        role: UserRole.USER,
      });
      await userRepository.save(regularUser);
      console.log('✅ Usuário regular criado: user@casetask.com');
    } else {
      regularUser = existingUser;
      console.log('ℹ️  Usuário regular já existe: user@casetask.com');
    }

    // Criar tarefas de exemplo
    const exampleTasks = [
      {
        title: 'Configurar ambiente de desenvolvimento',
        description: 'Instalar e configurar todas as dependências necessárias para o projeto',
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.HIGH,
        user: adminUser,
      },
      {
        title: 'Implementar autenticação JWT',
        description: 'Desenvolver sistema de autenticação usando JSON Web Tokens',
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.HIGH,
        user: adminUser,
      },
      {
        title: 'Criar interface de usuário',
        description: 'Desenvolver componentes React para a interface do usuário',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        user: regularUser,
      },
      {
        title: 'Implementar CRUD de tarefas',
        description: 'Criar endpoints para criar, ler, atualizar e deletar tarefas',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        user: adminUser,
      },
      {
        title: 'Escrever testes unitários',
        description: 'Criar testes para garantir a qualidade do código',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        user: regularUser,
      },
      {
        title: 'Configurar CI/CD',
        description: 'Implementar pipeline de integração e deploy contínuo',
        status: TaskStatus.PENDING,
        priority: TaskPriority.LOW,
        user: adminUser,
      },
      {
        title: 'Documentar API',
        description: 'Criar documentação completa da API usando Swagger',
        status: TaskStatus.PENDING,
        priority: TaskPriority.MEDIUM,
        user: regularUser,
      },
      {
        title: 'Otimizar performance',
        description: 'Analisar e melhorar a performance da aplicação',
        status: TaskStatus.PENDING,
        priority: TaskPriority.LOW,
        user: adminUser,
      },
    ];

    // Verificar se as tarefas já existem antes de criar
    for (const taskData of exampleTasks) {
      const existingTask = await taskRepository.findOne({ 
        where: { title: taskData.title } 
      });

      if (!existingTask) {
        const task = taskRepository.create(taskData);
        await taskRepository.save(task);
        console.log(`✅ Tarefa criada: ${taskData.title}`);
      } else {
        console.log(`ℹ️  Tarefa já existe: ${taskData.title}`);
      }
    }

    console.log('🎉 Seed executado com sucesso!');
    console.log('\n📋 Resumo:');
    console.log('👤 Usuários criados:');
    console.log('   - admin@casetask.com (ADMIN) - Senha: Teste123');
    console.log('   - user@casetask.com (USER) - Senha: Teste123');
    console.log(`📝 ${exampleTasks.length} tarefas de exemplo criadas`);

  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    process.exit(1);
  } finally {
    // Fechar conexão
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Conexão com banco de dados fechada');
    }
  }
}

// Executar seed
seed();