#!/usr/bin/env python3
"""
Database Schema Setup Script - DDL-First Approach

This script sets up the database schema ONLY using schema.sql as the single source of truth.
Data seeding is handled separately by seed_data.py.

Usage:
    python setup.py

Features:
- Schema-only execution (no data insertion)
- Database creation with proper error handling
- Clear status messages and next steps
- Executes schema.sql as single source of truth
"""

import mysql.connector
import os
import sys
import argparse
from pathlib import Path


class DatabaseSetup:
    """Handles database schema setup using DDL-First approach."""
    
    def __init__(self, config=None):
        """Initialize with database configuration."""
        self.config = config or self._load_config()
        self.db_name = self.config['database']
        # Connection without database for initial setup
        self.admin_config = {k: v for k, v in self.config.items() if k != 'database'}
        
    def _load_config(self):
        """Load database configuration from config.py or environment."""
        try:
            # Try to load from config.py
            sys.path.append(os.path.dirname(os.path.dirname(__file__)))
            from config import Config
            
            # Parse SQLALCHEMY_DATABASE_URI
            uri = Config.SQLALCHEMY_DATABASE_URI
            # Remove mysql+pymysql:// prefix
            uri = uri.replace('mysql+pymysql://', '')
            
            # Parse username:password@host:port/database
            auth_part, host_part = uri.split('@')
            username, password = auth_part.split(':')
            host_db_part = host_part.split('/')
            host_port = host_db_part[0]
            database = host_db_part[1] if len(host_db_part) > 1 else 'movie_booking_dev'
            
            if ':' in host_port:
                host, port = host_port.split(':')
                port = int(port)
            else:
                host, port = host_port, 3306
                
            return {
                'host': host,
                'port': port,
                'user': username,
                'password': password,
                'database': database,
                'charset': 'utf8mb4',
                'autocommit': False
            }
            
        except ImportError:
            # Fallback to environment variables or defaults
            return {
                'host': os.getenv('DB_HOST', 'localhost'),
                'port': int(os.getenv('DB_PORT', 3306)),
                'user': os.getenv('DB_USER', 'movie_admin'),
                'password': os.getenv('DB_PASSWORD', '123456'),
                'database': os.getenv('DB_NAME', 'movie_booking_dev'),
                'charset': 'utf8mb4',
                'autocommit': False
            }
    
    def _get_schema_path(self):
        """Get the path to schema.sql file."""
        schema_path = Path(__file__).parent / 'schema.sql'
        if not schema_path.exists():
            raise FileNotFoundError(f"Schema file not found: {schema_path}")
        return schema_path
    
    def _create_database(self):
        """Create the database if it doesn't exist."""
        print(f"🔍 Connecting to MySQL server at {self.config['host']}:{self.config['port']}")
        
        try:
            # Connect without specifying database
            connection = mysql.connector.connect(**self.admin_config)
            cursor = connection.cursor()
            
            # Create database if not exists
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{self.db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print(f"Database '{self.db_name}' created or already exists")
            
            cursor.close()
            connection.close()
            
        except mysql.connector.Error as err:
            print(f"Error creating database: {err}")
            raise
    
    def _drop_existing_objects(self, cursor):
        """Drop existing database objects in correct order."""
        print("🧹 Cleaning existing database objects...")
        
        try:
            # Disable foreign key checks for clean drop
            cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
            
            # Drop procedures
            cursor.execute("DROP PROCEDURE IF EXISTS sp_create_reservation")
            cursor.execute("DROP PROCEDURE IF EXISTS sp_confirm_reservation")
            cursor.execute("DROP PROCEDURE IF EXISTS sp_cancel_reservation")
            
            # Drop views
            cursor.execute("DROP VIEW IF EXISTS v_available_seats")
            cursor.execute("DROP VIEW IF EXISTS v_reservation_totals")
            
            # Drop triggers
            cursor.execute("DROP TRIGGER IF EXISTS trg_showtime_no_overlap")
            cursor.execute("DROP TRIGGER IF EXISTS trg_showtime_no_overlap_update")
            
            # Drop tables in reverse dependency order
            tables = [
                'seat_locks', 'tickets', 'reservations', 'showtimes',
                'seats', 'screens', 'users', 'movies', 'cinemas'
            ]
            
            for table in tables:
                cursor.execute(f"DROP TABLE IF EXISTS `{table}`")
            
            # Re-enable foreign key checks
            cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
            
            print("Existing database objects cleaned")
            
        except mysql.connector.Error as err:
            print(f"Warning during cleanup: {err}")
            # Continue anyway - this is just cleanup
    
    def _execute_schema(self, cursor):
        """Execute the schema.sql file."""
        schema_path = self._get_schema_path()
        print(f"📄 Reading schema from: {schema_path}")
        
        try:
            with open(schema_path, 'r', encoding='utf-8') as file:
                schema_content = file.read()
            
            # Split statements by semicolon, handling DELIMITER changes
            statements = self._parse_sql_statements(schema_content)
            
            print(f"🔧 Executing {len(statements)} SQL statements...")
            
            for i, statement in enumerate(statements, 1):
                statement = statement.strip()
                if statement and not statement.startswith('--'):
                    try:
                        cursor.execute(statement)
                        if i % 10 == 0:  # Progress indicator
                            print(f"   📋 Executed {i}/{len(statements)} statements")
                    except mysql.connector.Error as err:
                        print(f"Error in statement {i}: {err}")
                        print(f"   Statement: {statement[:100]}...")
                        raise
            
            print("Schema executed successfully")
            
        except FileNotFoundError:
            print(f"Schema file not found: {schema_path}")
            raise
        except Exception as err:
            print(f"Error executing schema: {err}")
            raise
    
    def _parse_sql_statements(self, content):
        """Parse SQL content into individual statements, handling DELIMITER changes."""
        statements = []
        current_statement = ""
        delimiter = ";"
        
        lines = content.split('\n')
        
        for line in lines:
            line = line.strip()
            
            # Handle DELIMITER changes
            if line.startswith('DELIMITER'):
                if current_statement.strip():
                    statements.append(current_statement.strip())
                    current_statement = ""
                
                delimiter = line.split()[1] if len(line.split()) > 1 else ";"
                continue
            
            # Skip empty lines and comments
            if not line or line.startswith('--'):
                continue
            
            current_statement += line + "\n"
            
            # Check if statement ends with current delimiter
            if line.endswith(delimiter):
                # Remove the delimiter from the statement
                statement = current_statement.rstrip().rstrip(delimiter).strip()
                if statement:
                    statements.append(statement)
                current_statement = ""
        
        # Add final statement if exists
        if current_statement.strip():
            statements.append(current_statement.strip())
        
        return statements
    
    def setup(self, force=False):
        """Execute complete database schema setup."""
        print("🚀 Starting Database Schema Setup (DDL-First Approach)")
        print("=" * 60)
        
        try:
            # Step 1: Create database
            self._create_database()
            
            # Step 2: Connect to the specific database
            print(f"🔗 Connecting to database '{self.db_name}'...")
            connection = mysql.connector.connect(**self.config)
            connection.autocommit = False  # Use transactions
            cursor = connection.cursor()
            
            # Step 3: Clean existing objects if force is True
            if force:
                self._drop_existing_objects(cursor)
            
            # Step 4: Execute schema
            self._execute_schema(cursor)
            
            # Step 5: Commit all changes
            connection.commit()
            print("All changes committed successfully")
            
            # Cleanup
            cursor.close()
            connection.close()
            
            # Success message with next steps
            print("\n" + "=" * 60)
            print("DATABASE SCHEMA SETUP COMPLETED SUCCESSFULLY!")
            print("=" * 60)
            print(f"Database: {self.db_name}")
            print(f"Host: {self.config['host']}:{self.config['port']}")
            print(f"User: {self.config['user']}")
            print("\nNEXT STEPS:")
            print("1. Add sample data: python seed_data.py")
            print("2. Run tests: python -m pytest tests/")
            print("3. Generate models: sqlacodegen mysql+pymysql://user:pass@host/db > ../models.py")
            print("4. Start application: python ../app.py")
            print("\nSchema setup is complete - ready for development!")
            
            return True
            
        except Exception as err:
            print(f"\nSETUP FAILED: {err}")
            print("\nTROUBLESHOOTING:")
            print("1. Check MySQL server is running")
            print("2. Verify database credentials in config.py")
            print("3. Ensure schema.sql exists and is valid")
            print("4. Check file permissions")
            return False


def main():
    """Main function with command line argument parsing."""
    parser = argparse.ArgumentParser(
        description="Movie Booking Database Schema Setup (DDL-First)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python setup.py                # Setup schema
  python setup.py --force        # Force clean setup (drops existing objects)
  
This script creates the database schema ONLY. Use seed_data.py for sample data.
        """
    )
    
    parser.add_argument(
        '--force', 
        action='store_true',
        help='Force clean setup (drops all existing database objects)'
    )
    
    parser.add_argument(
        '--config',
        help='Path to custom config file (optional)'
    )
    
    args = parser.parse_args()
    
    try:
        # Initialize setup
        setup = DatabaseSetup()
        
        # Run setup
        success = setup.setup(force=args.force)
        
        # Exit with appropriate code
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("\nSetup interrupted by user")
        sys.exit(1)
    except Exception as err:
        print(f"\nUnexpected error: {err}")
        sys.exit(1)


if __name__ == "__main__":
    main() 