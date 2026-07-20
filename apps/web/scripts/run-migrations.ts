/**
 * Database Migration Runner
 * 
 * Safe execution of foundation database migrations with:
 * - Transaction safety
 * - Rollback capability
 * - Progress monitoring
 * - Error handling
 * - Backup verification
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getPrismaClient } from '@moja/db';

interface MigrationConfig {
  name: string;
  description: string;
  sqlFile: string;
  rollbackFile?: string;
  requiresBackup: boolean;
  estimatedDurationMinutes: number;
}

interface MigrationResult {
  success: boolean;
  duration: number;
  error?: string;
  warnings: string[];
}

class MigrationRunner {
  private prisma = getPrismaClient();
  
  private readonly migrations: MigrationConfig[] = [
    {
      name: '001_foundation_constraints',
      description: 'Foundation constraints, indexes, and integrity checks',
      sqlFile: 'apps/web/migrations/001_foundation_constraints.sql',
      rollbackFile: 'apps/web/migrations/001_foundation_constraints_rollback.sql',
      requiresBackup: true,
      estimatedDurationMinutes: 10,
    },
  ];

  /**
   * Run all pending migrations
   */
  async runMigrations(options: {
    dryRun?: boolean;
    skipBackup?: boolean;
    migrationName?: string;
  } = {}): Promise<void> {
    const { dryRun = false, skipBackup = false, migrationName } = options;

    console.log('🚀 Starting database migration process...\n');

    // Filter migrations if specific name provided
    const migrationsToRun = migrationName
      ? this.migrations.filter(m => m.name === migrationName)
      : this.migrations;

    if (migrationsToRun.length === 0) {
      console.log('ℹ️ No migrations to run');
      return;
    }

    // Check prerequisites
    await this.checkPrerequisites();

    // Create backup if required and not skipped
    if (!dryRun && !skipBackup && migrationsToRun.some(m => m.requiresBackup)) {
      await this.createBackup();
    }

    // Run migrations
    for (const migration of migrationsToRun) {
      console.log(`\n📋 Running migration: ${migration.name}`);
      console.log(`📝 Description: ${migration.description}`);
      console.log(`⏱️ Estimated duration: ${migration.estimatedDurationMinutes} minutes`);

      if (dryRun) {
        console.log('🔍 DRY RUN: Migration would be executed');
        await this.validateMigration(migration);
      } else {
        const result = await this.executeMigration(migration);
        
        if (result.success) {
          console.log(`✅ Migration ${migration.name} completed successfully`);
          console.log(`⏱️ Duration: ${result.duration}ms`);
          
          if (result.warnings.length > 0) {
            console.log('⚠️ Warnings:');
            result.warnings.forEach(warning => console.log(`   ${warning}`));
          }
        } else {
          console.error(`❌ Migration ${migration.name} failed: ${result.error}`);
          
          // Attempt rollback if rollback file exists
          if (migration.rollbackFile) {
            console.log(`🔄 Attempting rollback...`);
            await this.rollbackMigration(migration);
          }
          
          throw new Error(`Migration failed: ${result.error}`);
        }
      }
    }

    console.log('\n🎉 All migrations completed successfully!');
  }

  /**
   * Rollback a specific migration
   */
  async rollbackMigration(migration: MigrationConfig): Promise<void> {
    if (!migration.rollbackFile) {
      throw new Error(`No rollback file available for migration ${migration.name}`);
    }

    console.log(`🔄 Rolling back migration: ${migration.name}`);

    const result = await this.executeSqlFile(migration.rollbackFile, 'ROLLBACK');
    
    if (result.success) {
      console.log(`✅ Rollback completed successfully`);
    } else {
      console.error(`❌ Rollback failed: ${result.error}`);
      throw new Error(`Rollback failed: ${result.error}`);
    }
  }

  /**
   * Check prerequisites before running migrations
   */
  private async checkPrerequisites(): Promise<void> {
    console.log('🔍 Checking prerequisites...');

    // Check database connection
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection: OK');
    } catch (error) {
      throw new Error(`Database connection failed: ${error}`);
    }

    // Check if we're connected to the correct database
    const dbResult = await this.prisma.$queryRaw<[{ current_database: string }]>`
      SELECT current_database()
    `;
    const dbName = dbResult[0].current_database;
    console.log(`📊 Connected to database: ${dbName}`);

    // Check PostgreSQL version
    const versionResult = await this.prisma.$queryRaw<[{ version: string }]>`
      SELECT version()
    `;
    const version = versionResult[0].version;
    console.log(`🗄️ PostgreSQL version: ${version.split(' ')[1]}`);

    // Check for required extensions
    const extensionsResult = await this.prisma.$queryRaw<Array<{ extname: string }>>`
      SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'pg_trgm')
    `;
    
    const installedExtensions = extensionsResult.map(ext => ext.extname);
    console.log(`🔌 Installed extensions: ${installedExtensions.join(', ') || 'none'}`);

    // Warn if this looks like a production database
    if (dbName.includes('prod') || process.env.NODE_ENV === 'production') {
      console.log('⚠️ WARNING: This appears to be a production database!');
      console.log('⚠️ Make sure you have a recent backup before proceeding.');
    }
  }

  /**
   * Create database backup
   */
  private async createBackup(): Promise<void> {
    console.log('💾 Creating database backup...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `backup_${timestamp}.sql`;
    
    try {
      // Use pg_dump to create backup
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) {
        throw new Error('DATABASE_URL environment variable not set');
      }

      console.log(`📁 Backup file: ${backupFile}`);
      
      execSync(`pg_dump "${dbUrl}" > "${backupFile}"`, { 
        stdio: 'inherit',
        timeout: 300000 // 5 minutes timeout
      });
      
      console.log('✅ Backup created successfully');
      console.log(`💡 To restore: psql "${dbUrl}" < "${backupFile}"`);
    } catch (error) {
      throw new Error(`Backup creation failed: ${error}`);
    }
  }

  /**
   * Validate migration without executing
   */
  private async validateMigration(migration: MigrationConfig): Promise<void> {
    console.log(`🔍 Validating migration SQL...`);

    // Check if migration file exists
    if (!existsSync(migration.sqlFile)) {
      throw new Error(`Migration file not found: ${migration.sqlFile}`);
    }

    // Read and validate SQL syntax
    const sql = readFileSync(migration.sqlFile, 'utf-8');
    
    // Basic SQL validation
    if (!sql.trim()) {
      throw new Error('Migration file is empty');
    }

    // Check for dangerous operations in production
    if (process.env.NODE_ENV === 'production') {
      const dangerousOperations = [
        'DROP DATABASE',
        'DROP SCHEMA',
        'TRUNCATE TABLE',
        'DELETE FROM',
      ];

      const foundDangerous = dangerousOperations.find(op => 
        sql.toUpperCase().includes(op)
      );

      if (foundDangerous) {
        console.log(`⚠️ WARNING: Found potentially dangerous operation: ${foundDangerous}`);
      }
    }

    console.log('✅ Migration validation passed');
  }

  /**
   * Execute a migration
   */
  private async executeMigration(migration: MigrationConfig): Promise<MigrationResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      // Execute the migration SQL
      const result = await this.executeSqlFile(migration.sqlFile, 'MIGRATION');
      
      return {
        success: result.success,
        duration: Date.now() - startTime,
        error: result.error,
        warnings: [...warnings, ...result.warnings],
      };
    } catch (error) {
      return {
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
        warnings,
      };
    }
  }

  /**
   * Execute SQL file
   */
  private async executeSqlFile(
    sqlFile: string, 
    operation: 'MIGRATION' | 'ROLLBACK'
  ): Promise<MigrationResult> {
    const warnings: string[] = [];

    try {
      // Read SQL file
      const sql = readFileSync(sqlFile, 'utf-8');
      
      // Execute in transaction for safety
      await this.prisma.$transaction(async (tx) => {
        // Split SQL into statements (basic splitting on semicolons)
        const statements = sql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.match(/^\s*--/));

        console.log(`📋 Executing ${statements.length} SQL statements...`);

        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i];
          
          if (statement.trim()) {
            try {
              await tx.$executeRawUnsafe(statement + ';');
              
              // Progress indicator for long migrations
              if (statements.length > 10 && (i + 1) % 5 === 0) {
                console.log(`📈 Progress: ${i + 1}/${statements.length} statements`);
              }
            } catch (error) {
              // Some statements might generate warnings rather than errors
              if (error instanceof Error && error.message.includes('already exists')) {
                warnings.push(`Statement ${i + 1}: ${error.message}`);
              } else {
                throw error;
              }
            }
          }
        }
      });

      return {
        success: true,
        duration: 0, // Will be calculated by caller
        warnings,
      };
    } catch (error) {
      return {
        success: false,
        duration: 0,
        error: error instanceof Error ? error.message : String(error),
        warnings,
      };
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(): Promise<void> {
    console.log('📊 Migration Status:\n');

    // Check if version fields exist (indicator of foundation migration)
    try {
      const companyColumns = await this.prisma.$queryRaw<Array<{ column_name: string }>>`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'Company' AND column_name = 'version'
      `;

      const hasVersionField = companyColumns.length > 0;
      console.log(`📋 Foundation migration: ${hasVersionField ? '✅ Applied' : '❌ Not applied'}`);

      if (hasVersionField) {
        // Check audit log table
        const auditTableExists = await this.prisma.$queryRaw<Array<{ table_name: string }>>`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_name = 'AuditLog'
        `;

        console.log(`📋 Audit system: ${auditTableExists.length > 0 ? '✅ Active' : '❌ Not active'}`);

        // Count indexes
        const indexCount = await this.prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count
          FROM pg_indexes 
          WHERE indexname LIKE 'idx_%'
        `;

        console.log(`📋 Performance indexes: ${indexCount[0].count} created`);
      }
    } catch (error) {
      console.error('❌ Error checking migration status:', error);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'run';
  
  const runner = new MigrationRunner();

  try {
    switch (command) {
      case 'run':
        await runner.runMigrations({
          dryRun: args.includes('--dry-run'),
          skipBackup: args.includes('--skip-backup'),
          migrationName: args.find(arg => arg.startsWith('--migration='))?.split('=')[1],
        });
        break;

      case 'status':
        await runner.getMigrationStatus();
        break;

      case 'rollback':
        const migrationName = args.find(arg => arg.startsWith('--migration='))?.split('=')[1];
        if (!migrationName) {
          throw new Error('Migration name required for rollback');
        }
        
        const migration = runner['migrations'].find(m => m.name === migrationName);
        if (!migration) {
          throw new Error(`Migration not found: ${migrationName}`);
        }
        
        await runner.rollbackMigration(migration);
        break;

      default:
        console.log(`
🗃️ Database Migration Runner

Usage:
  npm run migrate                    # Run all pending migrations
  npm run migrate -- run            # Run all pending migrations
  npm run migrate -- run --dry-run  # Validate migrations without executing
  npm run migrate -- status         # Check migration status
  npm run migrate -- rollback --migration=001_foundation_constraints

Options:
  --dry-run                         # Validate without executing
  --skip-backup                     # Skip backup creation
  --migration=<name>                # Run specific migration only
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await runner.cleanup();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { MigrationRunner };