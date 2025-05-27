# COMP3030- Database and Database System

## Project Title
Movie Booking Management System

## Brief Description of your system and the problem it solves

The Movie Booking Management System is designed to support online movie ticket reservations for a cinema with multiple screens. This system addresses the limitations of traditional ticket booking methods by allowing users (customers) to view available movies, showtimes, and select their seats via a web-based interface. Admin users can manage movie listings, schedules, ticket prices, and monitor booking activity through a dashboard.

The project emphasizes designing a relational database that can efficiently store and manage information about cinemas, screens, movies, seats, bookings, and users. It also enables handling of ticket payments and reservation details using mock data.

## Functional & Non-functional Requirements

### Functional Requirements

Customers can:

- Register and log in.
- Browse currently showing and upcoming movies.
- View showtimes and seat availability for a specific movie.
- Make reservations by selecting available seats and confirming booking.
- View their reservation history.

Admins can:

- Add/update/delete movies, showtimes, and seat fares.
- View reports on ticket sales and booking statistics.

System functions:

- Calculate total payment per reservation based on seat fare.
- Track seat availability status in real time.
- Generate tickets associated with a reservation.

### Non-functional Requirements

- The system will use mock data for user accounts and payments.
- Security token-based login to access user-specific data via the API.
- The database should be normalized, efficient, and support fast read/write operations for a small-scale project.
- The user interface will be in English only.
- System will be hosted and tested on Heroku (Backend), and Vercell (Frontend)


## Core Entities
- `cinema`: multi‑screen complex
- `screens`: individual screen inside a cinema
- `cinema_types`: 2D, 3D, IMAX, VIP, etc.
- `seats`: physical seats, with row/column and status
- `seat_prices`: base price for each seat‑class (regular, premium, sofa, …)
- `movies`: title, metadata, state (now‑showing, upcoming)
- `showtimes`: a movie playing in a specific cinema at a start/end time
- `users`: login credentials and roles (admin, customer).
- `reservations`: a user's booking for one showtime (total payment, number of tickets, discounts, payment ref)
- `tickets`: seat‑level records linked to a reservation

## Tech Stack
- MySQL
- React
- Django

## Team Members and Roles
- Tran Le Hai – Backend Developer, Database Designer
- Vuong Chi Hao – Frontend Developer, Tester
- Truong Dang Gia Huy – System Integrator, Database Designer

## Timeline

### Week 1: May 6 – May 12  
**Focus:** Planning & Early Database Design  
- Finalize system requirements and core entities  
- Design the initial **Entity Relationship Diagram (ERD)**  
- Review and refine ERD with team feedback  
- Start creating database schema (tables, keys, relationships)  
- Begin inserting mock data for initial testing  

### Week 2: May 13 – May 19  
**Focus:** Database Development & API Setup  
- Complete and polish the ERD for submission by **May 20**  
- Implement remaining tables and constraints  
- Develop stored procedures, basic views, and simple triggers  
- Start backend API (Django) for core CRUD operations (e.g., Movies, Showtimes, Users, Reservations)  
- Ensure database and backend are connected and working locally  

### Week 3: May 20 – May 27  
**Focus:** Web Interface & Finalization  
- Build React frontend: forms for booking, viewing movies/showtimes  
- Implement admin dashboard: view reservations, ticket stats  
- Integrate API with frontend for real data flow  
- Add simple data visualizations (charts for bookings, revenue)  
- Final testing and bug fixes  
- Optimize database queries and indexes (where needed)  
- Prepare and submit final report and project presentation  

## Setup Instructions

### Database Setup

```bash
# Navigate
cd flask/db

# Install Python dependencies
pip install mysql-connector-python pymysql

# 1. Setup database schema
python setup.py

# 2. Add sample data
python seed_data.py

# 3. Add test users
python python add_test_users.py

```

### Frontend Setup

```bash
cd movie-ui
npm install
npm run dev
```

### Backend Setup

```bash
# Navigate to flask directory
cd flask

# Install Python dependencies
pip install flask flask-cors flask-sqlalchemy pymysql mysql-connector-python

# Generate/regenerate SQLAlchemy models from database
pip install sqlacodegen
sqlacodegen mysql+pymysql://root:12345678@localhost:3306/movie_booking > models.py

# Run the Flask application
python app.py
```

