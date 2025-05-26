from extensions import db
from config import Config
from flask import Flask
from sqlalchemy import text

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)

with app.app_context():
    result = db.session.execute(text('SELECT COUNT(*) as count FROM v_top_performing_movies'))
    count = result.first().count
    print(f'Found {count} movies in v_top_performing_movies')
    
    result = db.session.execute(text('SELECT title, total_revenue, avg_occupancy_rate_percent, composite_performance_score FROM v_top_performing_movies LIMIT 3'))
    print('\nTop 3 movies:')
    for row in result:
        print(f'- {row.title}: Revenue=${row.total_revenue}, Occupancy={row.avg_occupancy_rate_percent}%, Score={row.composite_performance_score}')