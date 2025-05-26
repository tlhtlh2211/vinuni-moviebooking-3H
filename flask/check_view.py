from app import create_app
from extensions import db
from datetime import datetime
from sqlalchemy import text

app = create_app()

with app.app_context():
    # 1. Check showtime date ranges
    print("=== CHECKING SHOWTIME DATES ===")
    result = db.session.execute(text("""
        SELECT 
            MIN(start_time) as min_date,
            MAX(start_time) as max_date,
            COUNT(*) as total_showtimes
        FROM showtimes
    """)).fetchone()
    
    if result:
        print(f"Min showtime date: {result.min_date}")
        print(f"Max showtime date: {result.max_date}")
        print(f"Total showtimes: {result.total_showtimes}")
        print(f"Today's date: {datetime.now()}")
        print(f"90 days ago: {datetime.now().date()}")
    
    # 2. Check reservations and tickets
    print("\n=== CHECKING RESERVATIONS AND TICKETS ===")
    
    # Count confirmed reservations
    confirmed_count = db.session.execute(text("""
        SELECT COUNT(*) as count
        FROM reservations
        WHERE status = 'confirmed'
    """)).scalar()
    print(f"Confirmed reservations: {confirmed_count}")
    
    # Count all reservations by status
    all_reservations = db.session.execute(text("""
        SELECT status, COUNT(*) as count
        FROM reservations
        GROUP BY status
    """)).fetchall()
    print("\nReservations by status:")
    for row in all_reservations:
        print(f"  {row.status}: {row.count}")
    
    # Count tickets
    ticket_count = db.session.execute(text("""
        SELECT COUNT(*) as count
        FROM tickets
    """)).scalar()
    print(f"\nTotal tickets: {ticket_count}")
    
    # 3. Test the view directly
    print("\n=== TESTING v_top_performing_movies VIEW ===")
    view_results = db.session.execute(text("""
        SELECT * FROM v_top_performing_movies
        LIMIT 10
    """)).fetchall()
    
    if view_results:
        print(f"View returned {len(view_results)} results")
        for row in view_results:
            print(f"  Movie ID {row.movie_id}: Revenue ${row.total_revenue}, Tickets {row.tickets_sold}")
    else:
        print("View returned NO results")
    
    # 4. Check the view definition to understand the 90-day window
    print("\n=== CHECKING VIEW LOGIC ===")
    # Let's manually run the core query without the 90-day filter
    no_date_filter = db.session.execute(text("""
        SELECT 
            m.movie_id,
            m.title,
            SUM(t.ticket_price) as total_revenue,
            COUNT(t.ticket_id) as tickets_sold
        FROM movies m
        JOIN showtimes st ON m.movie_id = st.movie_id
        JOIN reservations r ON st.showtime_id = r.showtime_id
        JOIN tickets t ON r.reservation_id = t.reservation_id
        WHERE r.status = 'confirmed'
        GROUP BY m.movie_id, m.title
        ORDER BY total_revenue DESC
        LIMIT 10
    """)).fetchall()
    
    if no_date_filter:
        print(f"\nWithout date filter: {len(no_date_filter)} movies with revenue")
        for row in no_date_filter:
            print(f"  {row.title}: Revenue ${row.total_revenue}, Tickets {row.tickets_sold}")
    
    # Check with the 90-day filter
    with_date_filter = db.session.execute(text("""
        SELECT 
            m.movie_id,
            m.title,
            SUM(t.ticket_price) as total_revenue,
            COUNT(t.ticket_id) as tickets_sold
        FROM movies m
        JOIN showtimes st ON m.movie_id = st.movie_id
        JOIN reservations r ON st.showtime_id = r.showtime_id
        JOIN tickets t ON r.reservation_id = t.reservation_id
        WHERE r.status = 'confirmed'
        AND st.start_time >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
        GROUP BY m.movie_id, m.title
        ORDER BY total_revenue DESC
        LIMIT 10
    """)).fetchall()
    
    if with_date_filter:
        print(f"\nWith 90-day filter: {len(with_date_filter)} movies with revenue")
    else:
        print("\nWith 90-day filter: NO movies found (this is likely the issue)")