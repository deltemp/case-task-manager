import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNameToUsers1761589174874 implements MigrationInterface {
    name = 'AddNameToUsers1761589174874'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_166bd96559cb38595d392f75a35"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_tasks_assignee_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD "password_hash" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "due_date"`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "due_date" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "deleted_at" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_db55af84c226af9dce09487b61b" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_855d484825b715c545349212c7f" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_855d484825b715c545349212c7f"`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP CONSTRAINT "FK_db55af84c226af9dce09487b61b"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "due_date"`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD "due_date" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password_hash"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "password" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_tasks_assignee_id" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tasks" ADD CONSTRAINT "FK_166bd96559cb38595d392f75a35" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
