import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsersAndTasks1729845172000 implements MigrationInterface {
  name = 'CreateUsersAndTasks1729845172000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'user')
    `);
    
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" SERIAL NOT NULL,
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'user',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."tasks_status_enum" AS ENUM('pending', 'in_progress', 'completed', 'cancelled')
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."tasks_priority_enum" AS ENUM('low', 'medium', 'high', 'urgent')
    `);

    await queryRunner.query(`
      CREATE TABLE "tasks" (
        "id" SERIAL NOT NULL,
        "title" character varying NOT NULL,
        "description" text,
        "status" "public"."tasks_status_enum" NOT NULL DEFAULT 'pending',
        "priority" "public"."tasks_priority_enum" NOT NULL DEFAULT 'medium',
        "due_date" TIMESTAMPTZ,
        "assignee_id" integer,
        "user_id" integer NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ,
        CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "tasks" 
      ADD CONSTRAINT "FK_166bd96559cb38595d392f75a35" 
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "tasks" 
      ADD CONSTRAINT "FK_tasks_assignee_id" 
      FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_assignee_id"
    `);
    
    await queryRunner.query(`
      ALTER TABLE "tasks" DROP CONSTRAINT "FK_166bd96559cb38595d392f75a35"
    `);
    
    await queryRunner.query(`DROP TABLE "tasks"`);
    await queryRunner.query(`DROP TYPE "public"."tasks_priority_enum"`);
    await queryRunner.query(`DROP TYPE "public"."tasks_status_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}