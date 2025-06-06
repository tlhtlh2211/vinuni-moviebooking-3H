# Movie Booking Management System - Technical Report

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Design Decisions and Rationale](#3-design-decisions--rationale)
4. [User Flows](#4-user-flows)
5. [Administrative Operations](#5-administrative-operations)
6. [Database Architecture and Design](#6-database-architecture--design)
7. [Security Implementation](#7-security-implementation)
8. [API Design and Implementation](#8-api-design--implementation)
9. [Component Interaction Sequence](#9-component-interaction-sequence)

## 1. Introduction

### 1.1 Project Overview

The Movie Booking Management System is a full-stack web application designed to streamline cinema operations and enhance customer experience. Built with modern technologies including Next.js frontend, Flask backend, and MySQL database, the system provides comprehensive functionality for both customers and administrators.

### 1.2 Key Features

**Customer Features:**
- Intuitive movie browsing and showtime selection
- Real-time seat availability with visual seat map
- Secure booking with temporary seat locking
- Personal booking history and ticket management

**Administrative Features:**
- Comprehensive dashboard with revenue analytics
- Movie and showtime management with conflict detection
- Performance metrics and reporting
- Timeslot management across multiple screens

### 1.3 Technical Highlights

- **Database-First Architecture:** Schema-driven development with auto-generated models
- **Real-Time Seat Management:** Temporary locking mechanism preventing double-booking
- **Atomic Operations:** Stored procedures ensuring data consistency
- **Performance Optimization:** Database views for complex queries
- **Scalable Design:** Modular architecture supporting future expansion

## 2. System Architecture Overview

### 2.1 High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend - Next.js"
        UI[React UI Components]
        Pages[App Router Pages]
        Context[Auth Context]
        API[API Routes Proxy]
    end
    
    subgraph "Backend - Flask"
        Routes[RESTful API Routes]
        Models[SQLAlchemy Models]
        Serializers[Business Logic]
        Auth[JWT Authentication]
    end
    
    subgraph "Database - MySQL 8.0"
        Tables[(Tables)]
        Triggers[Triggers]
        Procedures[Stored Procedures]
        Views[Views]
    end
    
    UI --> Pages
    Pages --> Context
    Pages --> API
    API --> |HTTP/JWT| Routes
    Routes --> Serializers
    Serializers --> Models
    Models --> Tables
    Tables --> Triggers
    Tables --> Procedures
    Tables --> Views
    
    style UI fill:#e3f2fd
    style Routes fill:#fff3e0
    style Tables fill:#e8f5e9
```

### 2.2 Technology Stack

**Frontend (Next.js 14)**
- React 18 with Server Components
- App Router for navigation
- Tailwind CSS for styling
- Radix UI for accessible components
- Context API for state management

**Backend (Flask)**
- RESTful API architecture
- SQLAlchemy ORM with auto-generated models
- Structured error handling

**Database (MySQL 8.0)**
- Relational schema with referential integrity and indexes
- Stored procedures for complex operations
- Triggers for business rule enforcement
- Views

### 2.3 Communication Flow

The system implements a clear request-response pattern:
1. Frontend components make requests through Next.js API routes
2. API routes proxy requests to Flask backend with authentication
3. Flask processes requests using business logic in serializers
4. Database operations executed through ORM with stored procedures for complex transactions

## 3. Design Decisions and Rationale

### 3.1 Database-First Approach (Instead of Code-first)

**Decision:** Implement schema-first development using `sqlacodegen` for model generation.

**Rationale:**
- **Data Integrity:** Database constraints ensure data consistency at the source
- **Performance:** Native SQL optimizations and indexing strategies
- **Maintainability:** Single source of truth for schema changes

### 3.2 Unified Seat Layout Design

**Decision:** Standardize all cinema screens to 8×12 seat grid (96 seats total).

**Rationale:**
- **Consistency:** Uniform user experience across all screens
- **Simplicity:** Single codebase for seat rendering
- **Scalability:** Easy to add new screens without UI changes
- **Pricing Logic:** Clear tier separation (Standard: A-E, Premium: F-H)

**Seat Configuration:**
```
Rows A-E: Standard class (60 seats) - $8 base price
Rows F-H: Premium class (36 seats) - $16 base price
Format multipliers: 2D (1.0x), 3D (1.25x), IMAX (1.5x)
```

### 3.3 Temporary Seat Locking Strategy

**Decision:** Implement 15-minute seat locks during selection process.

**Rationale:**
- **Prevents Double-Booking:** Ensures seats remain available during purchase
- **User Experience:** Provides reasonable time for decision-making
- **Resource Management:** Automatic cleanup prevents permanent locks
- **Scalability:** Database-managed expiration reduces server overhead

### 3.4 Atomic Transaction Design

**Decision:** Use stored procedures for complex multi-table operations.

**Rationale:**
- **Data Consistency:** ACID compliance for critical operations
- **Performance:** Reduced network round-trips
- **Business Logic:** Database-enforced business rules
- **Error Handling:** Atomic rollback on failures

## 4. User Flows

### 4.1 Customer Booking

The customer booking flow prioritizes simplicity while ensuring data integrity and preventing conflicts.

```mermaid
flowchart TD
    Start([User Visits Site]) --> Browse[Browse Movies Page]
    Browse --> |Select Movie| MovieDetails[Movie Details Page]
    MovieDetails --> |Not Logged In| LoginPrompt[Login Prompt]
    LoginPrompt --> |Login Success| MovieDetails
    MovieDetails --> |Select Cinema and Format| FilterShowtimes[Filter Showtimes]
    FilterShowtimes --> |Choose Showtime| SeatSelection[Seat Selection Page]
    
    SeatSelection --> |Select Seats| LockSeats[Lock Selected Seats]
    LockSeats --> |Lock Success| ShowPrice[Display Total Price]
    ShowPrice --> |Confirm Booking| CreateReservation[Create Reservation]
    
    CreateReservation --> |Success| Confirmation[Booking Confirmation]
    CreateReservation --> |Failure| UnlockSeats[Unlock All Seats]
    UnlockSeats --> ErrorMsg[Show Error Message]
    
    Confirmation --> |View Tickets| ProfilePage[User Profile]
    Confirmation --> |Browse More| Browse
    
    SeatSelection --> |Timer Expires| AutoUnlock[Auto Unlock Seats]
    SeatSelection --> |Navigate Away| ManualUnlock[Manual Unlock Seats]
    
    style Start fill:#e1f5fe
    style Confirmation fill:#c8e6c9
    style ErrorMsg fill:#ffcdd2
```
-----
*1. Landing page showing featured movies*
![](images/screenshot_01.png)

*2. Movie details page with showtime filtering options*
![](images/screenshot_02.png)

*3. Seats options*
![](images/screenshot_03.png)

*4. Booking confirmation page with reservation details*
![](images/screenshot_04.png)

*5. User profile showing booking history and tickets*
![](images/screenshot_05.png)

### 4.2 Seat Availability Management

Real-time seat availability ensures accurate booking information and prevents conflicts.

```mermaid
flowchart TD
    Request([Check Seat Availability]) --> GetShowtime[Get Showtime Info]
    GetShowtime --> QueryView[Query v_available_seats]
    
    QueryView --> CheckTickets{Has Tickets?}
    CheckTickets --> |Yes| MarkSold[Mark as Sold]
    CheckTickets --> |No| CheckLocks{Has Active Lock?}
    
    CheckLocks --> |Yes| CheckOwner{Lock Owner?}
    CheckOwner --> |Current User| MarkSelected[Mark as Selected]
    CheckOwner --> |Other User| MarkLocked[Mark as Locked]
    CheckLocks --> |No| MarkAvailable[Mark as Available]
    
    MarkSold --> BuildGrid[Build Seat Grid]
    MarkSelected --> BuildGrid
    MarkLocked --> BuildGrid
    MarkAvailable --> BuildGrid
    
    BuildGrid --> FormatResponse[Format 8x12 Grid Response]
    FormatResponse --> |Include| PriceInfo[Add Pricing Info:<br/>Standard: $8<br/>Premium: $16<br/>Format Multipliers]
    PriceInfo --> ReturnData([Return Seat Map Data])
    
    style Request fill:#e1f5fe
    style ReturnData fill:#c8e6c9
```

**Key Features:**
- **Real-Time Updates:** Immediate reflection of seat status changes
- **User-Specific Locking:** Users can modify their own selections
- **Automatic Cleanup:** Expired locks automatically released
- **Visual Feedback:** Clear indication of seat states and pricing

### 4.3 Seat State Machine

The seat state machine ensures consistent behavior across all user interactions.

```mermaid
stateDiagram-v2
    [*] --> Available: Initial State
    
    Available --> Locked: User Selects Seat
    Locked --> Available: Unlock (Manual/Timer/Navigation)
    Locked --> Sold: Reservation Confirmed
    Sold --> [*]: Final State
    
    state Locked {
        [*] --> Active: Lock Created
        Active --> Expiring: 15 min timer
        Expiring --> Expired: Timer Ends
    }
    
    note right of Available: Seat can be selected
    note right of Locked: Temporary hold for user
    note right of Sold: Permanent - seat purchased
```

**State Transitions:**
- **Available → Locked:** User clicks seat (immediate response)
- **Locked → Available:** Manual unlock, timer expiry, or navigation
- **Locked → Sold:** Successful reservation confirmation
- **Sold:** Terminal state (no further transitions)

## 5. Administrative Operations

### 5.1 Admin Dashboard Workflow

The administrative interface provides comprehensive cinema management capabilities with intuitive workflows.

```mermaid
flowchart TD
    AdminLogin([Admin Login]) --> Dashboard[Admin Dashboard]
    
    Dashboard --> QuickStats[View Quick Stats]
    Dashboard --> AddMovie[Add New Movie]
    Dashboard --> Analytics[Analytics Section]
    Dashboard --> TimeslotMgmt[Timeslot Management]
    
    AddMovie --> MovieForm[Enter Movie Details]
    MovieForm --> |Optional| ScheduleShowtimes[Schedule Showtimes]
    ScheduleShowtimes --> ConflictCheck{Check Conflicts}
    ConflictCheck --> |No Conflicts| SaveMovie[Save Movie and Showtimes]
    ConflictCheck --> |Conflicts Found| ShowConflicts[Display Conflicts]
    ShowConflicts --> EditSchedule[Edit Schedule]
    EditSchedule --> ConflictCheck
    
    Analytics --> TopMovies[Top Movies Leaderboard]
    TopMovies --> FilterGenre[Filter by Genre]
    TopMovies --> SortMetrics[Sort by Metrics]
    
    TimeslotMgmt --> ViewSchedule[View All Showtimes]
    ViewSchedule --> DeleteShowtime[Delete Showtime]
    
    QuickStats --> |Display| RevenueMetrics[Revenue Breakdown]
    QuickStats --> |Display| TicketStats[Ticket Statistics]
    
    style AdminLogin fill:#e1f5fe
    style Dashboard fill:#fff3e0
    style SaveMovie fill:#c8e6c9
```

------

*Admin dashboard with quick stats and navigation options*
![](images/screenshot_06.png)

### 5.2 Analytics and Reporting System

Comprehensive analytics provide actionable insights for business decision-making.

```mermaid
flowchart LR
    subgraph Data Collection
        Reservations[(Reservations)]
        Tickets[(Tickets)]
        Movies[(Movies)]
        Showtimes[(Showtimes)]
    end
    
    subgraph Views
        RevenueSummary[v_admin_revenue_summary]
        TopMovies[v_top_performing_movies]
    end
    
    subgraph Analytics Display
        Dashboard[Dashboard Stats]
        Leaderboard[Movies Leaderboard]
        Trends[Performance Trends]
    end
    
    Reservations --> RevenueSummary
    Tickets --> RevenueSummary
    Movies --> TopMovies
    Showtimes --> TopMovies
    Tickets --> TopMovies
    
    RevenueSummary --> Dashboard
    TopMovies --> Leaderboard
    TopMovies --> Trends
    
    Dashboard --> |Shows| TimeMetrics[Today/Week/Month Revenue]
    Dashboard --> |Shows| FormatBreakdown[2D/3D/IMAX Revenue]
    Dashboard --> |Shows| ClassBreakdown[Standard/Premium Revenue]
    
    Leaderboard --> |Calculates| Score[Composite Score: 40% Revenue + 30% Occupancy + 30% Volume]
```
------
*Top movies leaderboard with performance metrics and filtering*
![](images/screenshot_07.png)

**Analytics Features:**
- **Revenue Tracking:** Time-based metrics (daily, weekly, monthly)
- **Performance Scoring:** Composite algorithm balancing multiple factors
- **Format Analysis:** Revenue breakdown by screen format (2D/3D/IMAX)
- **Occupancy Rates:** Real-time calculation of seat utilization

### 5.3 Conflict Resolution System

Automated conflict detection prevents scheduling errors and optimizes screen utilization.

```mermaid
flowchart TD
    Start([Schedule New Showtime]) --> InputDetails[Enter Showtime Details]
    InputDetails --> CheckConflicts[Check for Conflicts]
    
    CheckConflicts --> Query{Query Existing Showtimes}
    Query --> |Direct Overlap| DirectConflict[Direct Time Conflict]
    Query --> |Buffer Overlap| BufferConflict[15-min Buffer Conflict]
    Query --> |No Overlap| NoConflict[No Conflicts]
    
    DirectConflict --> ShowError[Display Conflicting Movie]
    BufferConflict --> ShowError
    NoConflict --> SaveShowtime[Save Showtime]
    
    ShowError --> Options{Admin Options}
    Options --> |Modify Time| ChangeTime[Adjust Showtime]
    Options --> |Change Screen| ChangeScreen[Select Different Screen]
    Options --> |Cancel| CancelOperation[Cancel Operation]
    
    ChangeTime --> CheckConflicts
    ChangeScreen --> CheckConflicts
    
    style Start fill:#e1f5fe
    style SaveShowtime fill:#c8e6c9
    style ShowError fill:#ffcdd2
```
------
*Timeslot management interface showing schedule conflicts*
![](images/screenshot_08.png)

**Conflict Prevention Features:**
- **15-Minute Buffer:** Automatic inclusion of cleaning/transition time
- **Real-Time Delete:** Immediate delete showtime on click (with confirmation)
- **Visual Indicators:** Clear display of showtimes
- **Flexible Resolution:** Multiple options for conflict resolution

## 6. Database Architecture and Design

*ER Diagram*
![](images/dbdiagram.png)

### 6.1 Database Triggers

Implemented 4 triggers that enforce business rules and maintain data integrity at the database level.

```mermaid
flowchart TD
    subgraph INSERT Triggers
        I1[trg_showtime_no_overlap]
        I2[trg_movie_set_close_date_insert]
    end
    
    subgraph UPDATE Triggers
        U1[trg_showtime_no_overlap_update]
        U2[trg_movie_set_close_date_update]
    end
    
    subgraph Showtime Validation
        I1 --> |New Showtime| ValidateTime{Check Overlaps}
        U1 --> |Update Time/Screen| ValidateTime
        ValidateTime --> |Overlap Found| RaiseError[SIGNAL Error with Movie Name]
        ValidateTime --> |15min Buffer Check| BufferCheck{Buffer Violation?}
        BufferCheck --> |Yes| RaiseError
        BufferCheck --> |No| AllowOperation[Allow Insert/Update]
    end
    
    subgraph Movie Lifecycle
        I2 --> |New Movie| SetCloseDate[Set scheduled_close_date = release + 1 month]
        U2 --> |Update Release| UpdateCloseDate[Recalculate scheduled_close_date]
        UpdateCloseDate --> CheckExpired{Past Close Date?}
        CheckExpired --> |Yes| AutoClose[Set movie_status = 'closed']
        CheckExpired --> |No| KeepOpen[Keep movie_status]
    end
```

**Trigger Functions:**

1. **Showtime Overlap Prevention**
   - Validates new showtimes against existing schedules
   - Enforces 15-minute buffer for cleaning and transitions
   - Provides detailed error messages with conflicting movie names

2. **Movie Lifecycle Management**
   - Automatically sets close dates (release + 1 month)
   - Updates close dates when release dates change
   - Automatically closes expired movies

### 6.2 Stored Procedures

```mermaid
flowchart TD
    subgraph sp_create_reservation
        Start1([User Confirms Booking]) --> ValidateSeats[Validate Seats]
        ValidateSeats --> CheckScreen{Seats Match Screen?}
        CheckScreen --> |No| Error1[Error: Invalid Seats]
        CheckScreen --> |Yes| CheckAvailable{Seats Available?}
        CheckAvailable --> |No| Error2[Error: Seats Taken]
        CheckAvailable --> |Yes| CalcPrice[Calculate Prices]
        CalcPrice --> CreateRes[Create Reservation]
        CreateRes --> CreateTickets[Create Tickets]
        CreateTickets --> RemoveLocks[Remove User Locks]
        RemoveLocks --> Success1[Return Reservation ID]
    end
    
    subgraph sp_cancel_reservation
        Start2([Cancel Request]) --> CheckStatus{Valid Status?}
        CheckStatus --> |No| Error3[Error: Cannot Cancel]
        CheckStatus --> |Yes| DeleteTickets[Delete Tickets]
        DeleteTickets --> UpdateStatus[Update to Cancelled]
        UpdateStatus --> ClearLocks[Clear Related Locks]
        ClearLocks --> Success2[Cancellation Complete]
    end
    
    style Success1 fill:#c8e6c9
    style Success2 fill:#c8e6c9
    style Error1 fill:#ffcdd2
    style Error2 fill:#ffcdd2
    style Error3 fill:#ffcdd2
```

### 6.3 Views

Optimized views provide efficient access to complex analytical data. Including 5 views:

```mermaid
graph TD
    subgraph Business Views
        V1[v_available_seats]
        V2[v_active_showtimes_details]
        V3[v_admin_revenue_summary]
        V4[v_top_performing_movies]
        V5[v_occupied_timeslots]
    end
    
    V1 --> |Shows| AvailSeats[Available Seats per Showtime<br/>Excludes: Sold and Locked]
    
    V2 --> |Returns| ActiveShows[Active Showtimes with<br/>Movie + Screen + Cinema Details]
    
    V3 --> |Calculates| RevStats[Revenue Statistics:<br/>- Time-based totals<br/>- Format breakdown<br/>- Class breakdown<br/>- Average prices]
    
    V4 --> |Ranks| MoviePerf[Movie Performance:<br/>- Composite Score<br/>- Revenue metrics<br/>- Occupancy rates<br/>- Ticket volumes]
    
    V5 --> |Maps| TimeSlots[Showtime Schedule:<br/>- With 15min buffers<br/>- For admin grid UI]
```

**View Optimization:**
- **Performance:** Pre-calculated complex joins and aggregations
- **Consistency:** Single source of truth for analytical data

### 6.4 Performance Indexes

Beyond the automatically created indexes (primary keys, unique constraints, and foreign keys), the database implements 18 strategic performance indexes that dramatically improve query execution for critical operations.

```mermaid
graph TD
    subgraph "Time-Based Query Indexes"
        T1[idx_showtimes_start_time]
        T2[idx_showtimes_end_time]
        T3[idx_showtimes_movie_start]
        T4[idx_showtimes_screen_end]
        T5[idx_reservations_created_at]
        T6[idx_reservations_expires_at]
        T7[idx_seat_locks_expires_at]
    end
    
    subgraph "Analytics & Reporting Indexes"
        A1[idx_tickets_issued_at]
        A2[idx_movies_scheduled_close_date]
        A3[idx_movies_release_date]
        A4[idx_movies_status_release]
    end
    
    subgraph "Booking Flow Indexes"
        B1[idx_reservations_user_status]
        B2[idx_reservations_showtime_status]
        B3[idx_reservations_status]
        B4[idx_tickets_seat_reservation]
        B5[idx_seat_locks_user_id]
    end
    
    subgraph "Content Search Indexes"
        C1[idx_movies_genre]
        C2[idx_seats_seat_class]
        C3[idx_seats_screen_position]
    end
```

**1. Time-Based Query Optimization (7 indexes)**

These indexes transform time-based queries from full table scans to efficient index seeks:

- **idx_showtimes_start_time & idx_showtimes_end_time**
  - Accelerates finding active/upcoming shows: `WHERE end_time > NOW()`
  
- **idx_showtimes_movie_start**
  - Composite index for "all showtimes for movie X" queries
  - Eliminates sorting overhead with pre-ordered results
  
- **idx_reservations_expires_at & idx_seat_locks_expires_at**
  - Enables efficient cleanup of expired reservations and locks
  - Critical for maintaining system health and availability

**2. Analytics & Reporting Optimization (4 indexes)**

Dashboard and reporting queries see dramatic improvements:

- **idx_tickets_issued_at**
  - Revenue analytics by time period (daily/weekly/monthly)
  
- **idx_movies_status_release**
  - Composite index for filtering active movies by release date
  - Supports auto-closing feature and content management

**3. Booking Flow Optimization (5 indexes)**

Critical indexes ensuring smooth user experience during high-traffic booking periods:

- **idx_reservations_user_status & idx_reservations_showtime_status**
  - User booking history: instant lookup vs scanning all reservations
  
- **idx_tickets_seat_reservation**
  - Verifies seat availability without locking entire tables
  - Enables concurrent bookings for different seats

**4. Content Search & Filtering (3 indexes)**

Enhanced content discovery and seat selection:

- **idx_movies_genre**
  - Genre-based filtering without full table scans
  - Supports future faceted search implementation
  
- **idx_seats_screen_position**
  - Composite index for efficient seat grid rendering
  - Optimizes seat layout queries by screen and position

## 7. Security Implementation

### 7.1 Password Encryption

The system implements robust password security using industry-standard hashing algorithms:

- **Hashing Algorithm:** Werkzeug's PBKDF2-SHA256 with automatic salt generation
- **Implementation:** 
  - Password hashing during user registration: `werkzeug.security.generate_password_hash()`
  - Password verification during login: `werkzeug.security.check_password_hash()`
  - Passwords stored as `password_hash` column in database, never as plain text
- **Security Benefits:**
  - Salted hashes prevent rainbow table attacks
  - PBKDF2 key stretching protects against brute force attacks
  - One-way hashing ensures passwords cannot be recovered

### 7.2 SQL Injection Prevention

The application employs multiple layers of protection against SQL injection attacks:

- **SQLAlchemy ORM:** All database queries use parameterized statements
  - Example: `Users.query.filter(Users.email == data['email'])`
  - No string concatenation or formatting for SQL queries
- **Stored Procedures:** Complex operations use parameterized calls
  - Example: `text("CALL sp_create_reservation(:user_id, :showtime_id, :seat_ids)")`
  - All user inputs properly escaped through parameter binding
- **Input Validation:** Required fields validated before database operations
- **Security Benefits:**
  - Complete separation of code and data
  - Database engine handles proper escaping
  - Prevents malicious SQL code execution

### 7.3 Additional Security Measures

- **Role-Based Access Control:** Separate user roles (`admin`, `customer`) stored in database
- **Authentication Endpoints:** Distinct login endpoints for customers and administrators
- **Transaction Management:** Atomic operations prevent partial updates
- **Future Improvements Identified:**
  - JWT token implementation for stateless authentication
  - Rate limiting on authentication endpoints
  - Password complexity requirements
  - Protected admin endpoints with proper authorization

## 8. API Design and Implementation

### 8.1 API Structure

The RESTful API follows consistent patterns and provides comprehensive functionality for all system operations.

```mermaid
flowchart TD
    subgraph API["/api/v1"]
        subgraph Public["Public Endpoints"]
            A1["POST /auth/login"]
            A2["GET /movies"]
            A3["GET /movies/:id"]
            A4["GET /showtimes/:id/seats"]
            A5["POST /reservations"]
        end
        
        subgraph Protected["Protected Endpoints"]
            P1["POST /showtimes/:id/seats/:seatId/lock"]
            P2["POST /showtimes/:id/seats/:seatId/unlock"]
            P3["POST /reservations/:id/cancel"]
            P4["POST /reservations/:id/confirm"]
        end
        
        subgraph Admin["Admin Endpoints"]
            AD1["POST /auth/admin-login"]
            AD2["GET /admin/movies"]
            AD3["GET /admin/showtimes"]
            AD4["GET /admin/analytics"]
            AD5["GET /admin/analytics/top_movies"]
        end
    end
    
    A1 --> UserAuth[User Authentication]
    AD1 --> AdminAuth[Admin Authentication]
    A2 --> ListMovies[List All Movies]
    A3 --> MovieDetails[Get Movie Details]
    P1 --> LockSeat[Lock Seat for User]
    AD4 --> Analytics[Get Analytics Data]
    
    style Public fill:#e3f2fd
    style Protected fill:#fff3e0
    style Admin fill:#fce4ec
```

## 9. Component Interaction Sequence

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant NextAPI as Next.js API
    participant Flask
    participant MySQL
    
    User->>Frontend: Select Movie and Showtime
    Frontend->>NextAPI: Request seat availability
    NextAPI->>Flask: GET /showtimes/:id/seats
    Flask->>MySQL: Query v_available_seats
    MySQL-->>Flask: Available seats data
    Flask-->>NextAPI: Seat grid data
    NextAPI-->>Frontend: Display seat map
    
    User->>Frontend: Select seats
    Frontend->>NextAPI: Lock seats request
    NextAPI->>Flask: POST /seats/:id/lock
    Flask->>MySQL: INSERT seat_locks
    MySQL-->>Flask: Lock confirmation
    Flask-->>NextAPI: Lock expiry time
    NextAPI-->>Frontend: Update UI and start timer
    
    User->>Frontend: Confirm booking
    Frontend->>NextAPI: Create reservation
    NextAPI->>Flask: POST /reservations
    Flask->>MySQL: CALL sp_create_reservation
    MySQL-->>Flask: Reservation ID
    Flask-->>NextAPI: Booking details
    NextAPI-->>Frontend: Show confirmation
```

## Conclusion

Our Movie Booking Management System is the combination between user-centric design and robust technical architecture. The database-first approach ensures data integrity while providing excellent performance, and the modular design supports future scalability and feature expansion.

## GitHub Repository

The complete source code for this Movie Booking Management System is available on GitHub:

**Repository:** [https://github.com/tlhtlh2211/vinuni-moviebooking-3H](https://github.com/tlhtlh2211/vinuni-moviebooking-3H)