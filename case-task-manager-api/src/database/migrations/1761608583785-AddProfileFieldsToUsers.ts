import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProfileFieldsToUsers1761608583785 implements MigrationInterface {
    name = 'AddProfileFieldsToUsers1761608583785'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "phone" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "location" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "bio" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "bio"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
    }

}
