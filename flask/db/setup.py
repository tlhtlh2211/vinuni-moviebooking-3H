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
    
    def _get_schema_path(self):
        """Get the path to schema.sql file."""
        schema_path = Path(__file__).parent / 'schema.sql'
        if not schema_path.exists():
            raise FileNotFoundError(f"Schema file not found: {schema_path}")
        return schema_path
    
    def _create_database(self):
        """Create the database if it doesn't exist."""
        try:
            # Connect without specifying database
            connection = mysql.connector.connect(**self.admin_config)
            cursor = connection.cursor()
            
            # Create database if not exists
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{self.db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
            print(f"Database '{self.db_name}' ready")
            
            cursor.close()
            connection.close()
            
        except mysql.connector.Error as err:
            print(f"Error creating database: {err}")
            raise
    
    def _drop_database(self):
        """Drop the entire database if it exists."""
        try:
            # Connect without specifying database
            connection = mysql.connector.connect(**self.admin_config)
            cursor = connection.cursor()
            
            # Drop database if exists
            cursor.execute(f"DROP DATABASE IF EXISTS `{self.db_name}`")
            print(f"Database '{self.db_name}' dropped")
            
            cursor.close()
            connection.close()
            
        except mysql.connector.Error as err:
            print(f"Error dropping database: {err}")
            raise
    
    def _execute_schema(self, cursor):
        """Execute the schema.sql file."""
        schema_path = self._get_schema_path()
        
        try:
            with open(schema_path, 'r', encoding='utf-8') as file:
                schema_content = file.read()
            
            # Split statements by semicolon, handling DELIMITER changes
            statements = self._parse_sql_statements(schema_content)
            
            for i, statement in enumerate(statements, 1):
                statement = statement.strip()
                if statement and not statement.startswith('--'):
                    try:
                        cursor.execute(statement)
                        # Consume any result sets to prevent "Commands out of sync" error
                        self._consume_results(cursor)
                    except mysql.connector.Error as err:
                        print(f"Error in statement {i}: {err}")
                        print(f"Statement: {statement[:100]}...")
                        raise
            
            print("Schema executed successfully")
            
        except FileNotFoundError:
            print(f"Schema file not found: {schema_path}")
            raise
        except Exception as err:
            print(f"Error executing schema: {err}")
            raise
    
    def _consume_results(self, cursor):
        """Consume any result sets to prevent 'Commands out of sync' error."""
        try:
            # Try to fetch all results from the current statement
            while True:
                try:
                    cursor.fetchall()
                except mysql.connector.Error:
                    # No more results to fetch
                    break
                
                # Check if there are more result sets
                if not cursor.nextset():
                    break
        except mysql.connector.Error:
            # No results to consume or nextset() not available
            pass
    
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
    
    def setup(self):
        """Execute complete database schema setup."""
        print("Starting database schema setup...")
        
        try:
            # Step 1: Drop existing database
            self._drop_database()
            
            # Step 2: Create fresh database
            self._create_database()
            
            # Step 3: Connect to the specific database
            connection = mysql.connector.connect(**self.config)
            connection.autocommit = False  # Use transactions
            cursor = connection.cursor()
            
            # Step 4: Execute schema
            self._execute_schema(cursor)
            
            # Step 5: Commit all changes
            connection.commit()
            
            # Cleanup
            cursor.close()
            connection.close()
            
            # Success message
            print("Database schema setup completed successfully!")
            print(f"Database: {self.db_name} at {self.config['host']}:{self.config['port']}")
            print("Next: Run 'python seed_data.py' to add sample data")
            
            return True
            
        except Exception as err:
            print(f"Setup failed: {err}")
            print("Check MySQL server, credentials, and schema.sql file")
            return False


def main():
    """Main function to run database setup."""
    try:
        # Initialize and run setup
        setup = DatabaseSetup()
        success = setup.setup()
        
        # Exit with appropriate code
        sys.exit(0 if success else 1)
        
    except KeyboardInterrupt:
        print("Setup interrupted by user")
        sys.exit(1)
    except Exception as err:
        print(f"Unexpected error: {err}")
        sys.exit(1)


if __name__ == "__main__":
    main() 