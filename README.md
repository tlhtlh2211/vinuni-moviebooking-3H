# COMP3030- Database and Database System

## Project Title
Movie Booking Management System

## Brief Description of your system and the problem it solves

## Functional & Non-functional Requirements

## Planned Core Entities (brief outline)
- Cinema – multi‑screen complex
- Screens – individual screen inside a cinema
- CinemaTypes – 2D, 3D, IMAX, VIP, etc.
- Seats – physical seats, with row/column and status
- SeatFares – base price for each seat‑class (regular, premium, sofa, …)
- Movies – title, metadata, state (now‑showing, upcoming)
- Showtimes – a movie playing in a specific cinema at a start/end time
- Users
- Reservations – a user’s booking for one showtime (total payment, number of tickets, discounts, payment ref)
- Tickets – seat‑level records linked to a reservation
- Payments – charge details and status for a reservation

## Tech Stack (e.g., MySQL, Node.js, PHP, Flask, etc.)
- MySQL
- React
- Django

## Team Members and Roles
- Tran Le Hai
- Vuong Chi Hao
- Truong Dang Gia Huy

## Timeline (planned milestones)
- Database Design and Implementation
  - Create Entity Relationship Diagram
  - Create tables, relationships, and constraints
	- Develop views, stored procedures, and triggers
  - Insert mock data for testing
- Web-based Interface
  - Set up server and database connection
	- Build CRUD APIs for entities
  - Add forms, tables, and basic navigation
  - Add statistics dashboards
	- Add data visualizations (charts/graphs)
- Final
  - Optimize queries and indexes for performance
  - Report and Presentation
