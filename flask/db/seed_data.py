#!/usr/bin/env python3
"""
Database Seed Data Script - DDL-First Approach

This script populates the database with sample data using seed_data.sql as the source.
Should be run AFTER setup.py has created the database schema.

Usage:
    python seed_data.py

Features:
- Executes seed_data.sql for comprehensive sample data
- Validates data integrity after insertion
- Clear progress reporting and error handling
- Works with existing DDL-first architecture
"""

import mysql.connector
import os
import sys
from pathlib import Path


class DatabaseSeeder:
    """Handles database seeding with sample data."""
    
    def __init__(self, config=None):
        """Initialize with database configuration."""
        self.config = config or self._load_config()
        
    def _load_config(self):
        """Load database configuration from config.py."""
        # Load from config.py
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
        database = host_db_part[1] if len(host_db_part) > 1 else 'movie_booking'
        
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
    
    def _get_seed_data_path(self):
        """Get the path to seed_data.sql file."""
        seed_path = Path(__file__).parent / 'seed_data.sql'
        if not seed_path.exists():
            raise FileNotFoundError(f"Seed data file not found: {seed_path}")
        return seed_path
    
    def _check_database_exists(self):
        """Verify that the database and schema exist."""
        try:
            connection = mysql.connector.connect(**self.config)
            cursor = connection.cursor()
            
            # Check if essential tables exist
            cursor.execute("SHOW TABLES")
            tables = [table[0] for table in cursor.fetchall()]
            
            expected_tables = [
                'users', 'cinemas', 'screens', 'seats', 'movies', 
                'showtimes', 'reservations', 'tickets', 'seat_locks'
            ]
            
            missing_tables = [table for table in expected_tables if table not in tables]
            
            if missing_tables:
                print(f"Missing tables: {missing_tables}")
                print("Please run 'python setup.py' first to create the database schema.")
                cursor.close()
                connection.close()
                return False
            
            cursor.close()
            connection.close()
            return True
            
        except mysql.connector.Error as err:
            print(f"Database connection error: {err}")
            return False
    
    def _execute_seed_data(self, cursor):
        """Execute the seed_data.sql file."""
        seed_path = self._get_seed_data_path()
        
        try:
            with open(seed_path, 'r', encoding='utf-8') as file:
                seed_content = file.read()
            
            # Split statements by semicolon
            statements = self._parse_sql_statements(seed_content)
            
            print(f"Executing {len(statements)} SQL statements...")
            
            for i, statement in enumerate(statements, 1):
                statement = statement.strip()
                if statement and not statement.startswith('--'):
                    try:
                        cursor.execute(statement)
                    except mysql.connector.Error as err:
                        print(f"Error in statement {i}: {err}")
                        print(f"Statement: {statement[:100]}...")
                        raise
            
            print("Seed data executed successfully")
            
        except FileNotFoundError:
            print(f"Seed data file not found: {seed_path}")
            raise
        except Exception as err:
            print(f"Error executing seed data: {err}")
            raise
    
    def _parse_sql_statements(self, content):
        """Parse SQL content into individual statements."""
        statements = []
        current_statement = ""
        
        lines = content.split('\n')
        
        for line in lines:
            line = line.strip()
            
            # Skip empty lines and comments
            if not line or line.startswith('--'):
                continue
            
            current_statement += line + " "
            
            # Check if statement ends with semicolon
            if line.endswith(';'):
                statement = current_statement.strip().rstrip(';').strip()
                if statement:
                    statements.append(statement + ';')
                current_statement = ""
        
        # Add final statement if exists
        if current_statement.strip():
            statements.append(current_statement.strip())
        
        return statements
    
    def _validate_data(self, cursor):
        """Validate that the seed data was inserted correctly."""
        validations = [
            ("users", "SELECT COUNT(*) FROM users", 5, "users"),
            ("movies", "SELECT COUNT(*) FROM movies", 6, "movies"),
            ("showtimes", "SELECT COUNT(*) FROM showtimes", 14, "showtimes"),
            ("reservations", "SELECT COUNT(*) FROM reservations", 4, "reservations"),
        ]
        
        validation_passed = True
        
        for name, query, expected, description in validations:
            try:
                cursor.execute(query)
                actual = cursor.fetchone()[0]
                
                if actual != expected:
                    print(f"Validation failed for {description}: {actual} (expected {expected})")
                    validation_passed = False
                    
            except mysql.connector.Error as err:
                print(f"Validation error for {description}: {err}")
                validation_passed = False
        
        if validation_passed:
            print("Data validation passed")
        else:
            print("Data validation failed")
        
        return validation_passed
    
    def seed(self):
        """Execute complete database seeding process."""
        print("Starting database seeding...")
        
        try:
            # Step 1: Check database exists
            if not self._check_database_exists():
                return False
            
            # Step 2: Connect to database
            connection = mysql.connector.connect(**self.config)
            connection.autocommit = False  # Use transactions
            cursor = connection.cursor()
            
            # Step 3: Execute seed data
            self._execute_seed_data(cursor)
            
            # Step 4: Validate data
            validation_passed = self._validate_data(cursor)
            
            # Step 5: Commit all changes
            connection.commit()
            
            # Cleanup
            cursor.close()
            connection.close()
            
            if validation_passed:
                print("Database seeding completed successfully!")
            else:
                print("Database seeding completed with validation errors")
            
            return validation_passed
            
        except Exception as err:
            print(f"Seeding failed: {err}")
            print("Troubleshooting: Ensure database schema exists (run setup.py) and MySQL server is running")
            return False


def main():
    """Main function to run database seeding."""
    try:
        # Initialize and run seeding
        seeder = DatabaseSeeder()
        success = seeder.seed()
        
        # Exit with appropriate code
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("Seeding interrupted by user")
        sys.exit(1)
    except Exception as err:
        print(f"Unexpected error: {err}")
        sys.exit(1)


if __name__ == "__main__":
    main() 