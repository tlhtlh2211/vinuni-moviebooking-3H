from flask_sqlalchemy import SQLAlchemy
from models import Base

# Initialize SQLAlchemy
db = SQLAlchemy()

# Integrate new DDL-first models with Flask-SQLAlchemy
# This allows us to use db.session with the new models while keeping Flask-SQLAlchemy patterns
db.Model = Base 