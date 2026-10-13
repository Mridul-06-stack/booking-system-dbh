# 🎯 Technical Interview Cheat Sheet: DBH Laundry Booking Platform

This guide is your direct preparation companion for interviewing on this project. It covers high-impact elevator pitches, system design trade-offs, concurrency handling, and model answers to tough engineering questions.

---

## ⚡ 1. The Elevator Pitches

### ⏱️ 30-Second Pitch (When asked: *"Tell me about a project you've built"*)
> *"I designed and built a full-stack, real-time laundry slot booking system for the 500+ residents of Dhauladhar Boys Hostel at NIT Hamirpur using the MERN stack, TypeScript, and Socket.IO. The platform eliminates physical queuing and conflict by providing live slot availability, preventing double-booking race conditions through MongoDB partial unique indexes, and enforcing fair-usage rules like weekly quotas and single-booking-per-day locks. It features real-time WebSocket state synchronization, Google OAuth domain verification, and an automated background worker that cleans up expired slots every minute."*

---

### 🎙️ 2-Minute Deep-Dive (When asked: *"Walk me through the architecture and design of this project"*)
> *"In a university hostel like DBH, shared infrastructure creates high contention. Students used to physically queue buckets, leading to disputes, slot hogging, and phantom bookings.*
> 
> *To solve this, I engineered a high-concurrency booking platform with four key pillars:*
> 1. ***Client & Real-Time UX**: Built with React 19, TypeScript, and Tailwind CSS v4. Instead of requiring students to refresh the page to see if a slot opened up, I integrated Socket.IO client-side to listen for booking creation, cancellation, and waitlist releases in sub-100ms real-time.*
> 2. ***Concurrency & Atomicity**: The hardest technical challenge in any booking platform is race conditions—two students clicking 'Book' on the same machine at 08:00 AM on Sunday. Rather than relying solely on application-level checks, I implemented a MongoDB partial unique compound index on `(machineId, date, startTime, endTime)` filtered strictly on active confirmed statuses. This guarantees atomic, database-enforced exclusivity.*
> 3. ***Fair Usage & Policy Enforcement**: In `bookingController.js`, I instituted automated checks: dynamic weekly quotas, a 1-machine-per-day restriction, a 48-hour forward booking window, and a 30-minute cancellation cutoff to prevent last-minute machine idling.*
> 4. ***Operational Resilience**: I built an admin console with MongoDB aggregation analytics, machine maintenance toggles, and an asynchronous daemon that auto-expires past bookings every 60 seconds.*
> 
> *The result is a production-tested system that completely removes friction from hostel laundry operations."*

---

## ⚖️ 2. Architectural Trade-offs & Engineering Decisions

When interviewers ask *"Why did you choose X over Y?"*, use these concrete justifications:

### Trade-Off 1: MongoDB Partial Unique Index vs. Redis Distributed Lock (Redlock)
- **Question**: *"How did you prevent race conditions, and why didn't you use Redis distributed locks?"*
- **Talking Points**:
  - *"For our scale (500-1,000 hostel users with peak concurrent bursts of dozens of requests per minute), introducing a dedicated Redis cluster would add architectural complexity, deployment cost, and network serialization overhead without tangible benefit."*
  - *"Instead, I leveraged MongoDB's compound partial unique index: `{ machineId: 1, date: 1, startTime: 1, endTime: 1, status: 1 }` with `{ unique: true, partialFilterExpression: { status: 'confirmed' } }`."*
  - *"This offloads concurrency guarantees to the database's atomic write lock per document key. If two simultaneous HTTP requests pass the application-level check, the second write fails with an `E11000 Duplicate Key Error`, which our controller catches and transforms into a clean `409 Conflict`."*
  - *"If the system scaled to 100,000+ users across an entire university campus, I would introduce Redis with Redlock or Lua scripts for sub-millisecond memory-level lock acquisition before writing to disk."*

### Trade-Off 2: WebSockets (Socket.IO) vs. HTTP Short/Long Polling vs. Server-Sent Events (SSE)
- **Question**: *"Why did you use Socket.IO instead of simple HTTP polling or SSE?"*
- **Talking Points**:
  - *"HTTP polling creates unnecessary server overhead (hundreds of clients making requests every 2-3 seconds, consuming TCP handshakes and database queries even when no slots changed)."*
  - *"While SSE is great for unidirectional server-to-client streaming, Socket.IO provides bi-directional capabilities, automatic fallback (polling $\rightarrow$ WebSocket), and built-in connection heartbeat monitoring with zero reconnection management boilerplate."*
  - *"Whenever a booking is confirmed or cancelled, the server emits a lightweight event (`booking-created` or `booking-cancelled`), triggering immediate state updates on connected clients with zero polling lag."*

### Trade-Off 3: Stateless JWT vs. Stateful Server Sessions
- **Question**: *"Why did you choose JWT stored in localStorage instead of Express session cookies in Redis?"*
- **Talking Points**:
  - *"JWTs provide a completely stateless authentication architecture. The backend does not need to maintain an in-memory session store across server restarts or cluster nodes."*
  - *"Each request carries the Bearer token in the `Authorization` header, intercepted by our Axios client and verified by `authMiddleware.js` using `jwt.verify`."*
  - *"To handle security revocation (such as an admin blocking a abusive student), our middleware verifies the student's `isBlocked` flag in the database during protected calls, combining the scalability of stateless tokens with authoritative access control."*

### Trade-Off 4: Server-Side Google OAuth ID Token Verification
- **Question**: *"How does your Google Login work, and why not trust the user info sent from the React client?"*
- **Talking Points**:
  - *"Never trust client-supplied identity claims. A malicious user could forge an HTTP POST payload claiming to have an `@nith.ac.in` email."*
  - *"Instead, the client only sends Google's signed `credential` JWT. On the server, we use Google's official `google-auth-library` (`OAuth2Client.verifyIdToken`) to cryptographically verify the token's signature against Google's public certificates, validate the `audience` client ID, and extract the verified email domain."*

---

## 🛡️ 3. Key Edge Cases & How You Handled Them

| Scenario / Edge Case | What Could Go Wrong | How Your Code Solves It |
| :--- | :--- | :--- |
| **Two students book the exact same slot at the exact same millisecond** | Double-booking; both students show up with laundry. | 1. Application checks for overlapping non-cancelled bookings.<br/>2. Database-level compound partial unique index on confirmed status catches concurrent inserts and throws `E11000`. |
| **A student books multiple machines on the same day** | One student hogs all washing machines for the entire hostel. | In `bookingController.js`, `existingDailyBooking` queries if the student already has an active slot on that date across *any* machine. Rejects if found. |
| **A student cancels 5 minutes before the slot starts** | Machine sits idle; nobody has time to take the open slot. | 30-Minute Cancellation Cutoff rule (`diffMs < 30 * 60 * 1000`). Once within 30 minutes of start time, cancellations are rejected. |
| **A cancelled slot was wanted by someone else** | Slot becomes open, but other students don't know and it goes unused. | Waitlist Alert Engine: Students can subscribe to full slots (`POST /api/bookings/waitlist`). When cancelled, Socket.IO emits `waitlist-slot-opened` and an automated email alert is dispatched. |
| **A machine breaks down mid-day** | Students book broken machines; caretaker gets overwhelmed. | Fleet Management: Admin toggles machine status to `maintenance`. In `getAvailableSlots` and `createBooking`, any machine with status `'maintenance'` is blocked from reservation. |
| **Stale past slots remain in 'confirmed' state** | Analytics and usage quotas become distorted over time. | Autonomous Background Worker (`slotCompleter.js`) runs every 60 seconds and updates past confirmed slots to `'completed'`. |
| **Malicious or non-hostel student tries to register** | Non-residents take slots away from hostel students. | 1. Domain lock: email must end with `@nith.ac.in`.<br/>2. Allowed list verification: optional pre-approved roster check via `AllowedUser` collection. |

---

## ❓ 4. Top 12 Technical Interview Questions & Model Answers

### Q1: "Explain how MongoDB partial unique indexes work in your Booking model."
**Answer**:
> *"In MongoDB, standard unique indexes apply to all documents in a collection. But in our system, a slot (e.g., Machine 1 at 08:00 on Monday) can have multiple booking documents over time if previous bookings were 'cancelled'.*
> *If we used a standard unique index on `(machineId, date, startTime, endTime)`, cancelling a booking would prevent anyone from ever re-booking that slot.*
> *By using a Partial Filter Expression: `{ unique: true, partialFilterExpression: { status: 'confirmed' } }`, MongoDB only enforces uniqueness among documents where `status === 'confirmed'`. When a booking is cancelled, its status changes to `'cancelled'`, automatically removing it from the unique index filter and freeing the slot for re-booking."*

---

### Q2: "What is your strategy for handling state synchronization between the frontend and backend?"
**Answer**:
> *"We use an event-driven synchronization pattern. When the user loads `/book`, we make an initial HTTP GET request to `/api/bookings/slots` to populate the grid.*
> *To keep this view accurate without forcing users to refresh, the component initializes a Socket.IO connection in a `useEffect` hook. We listen for `booking-created` and `booking-cancelled`.*
> *When an event arrives, instead of re-fetching the entire slot list over HTTP, we update the local React state immutably: finding the affected slot by time and machine ID and updating its `available` and `isBooked` properties. This provides sub-second UI reactivity with minimal network overhead."*

---

### Q3: "How does the weekly quota calculation work?"
**Answer**:
> *"To ensure fair distribution, students have a configurable limit (default 2 bookings/week). When a booking request arrives in `bookingController.js`:*
> 1. *We calculate the week boundaries (`getWeekStart` and `getWeekEnd`) for the target booking date based on Monday 00:00 to Sunday 23:59.*
> 2. *We execute `Booking.countDocuments({ studentId, status: { $ne: 'cancelled' }, date: { $gte: weekStart, $lte: weekEnd } })`.*
> 3. *If the count meets or exceeds `settings.weeklyQuota`, the request is rejected with a 400 Bad Request.*
> *Because we indexed `{ studentId: 1, date: 1, status: 1 }`, this check is an indexed B-tree scan that executes in sub-millisecond time."*

---

### Q4: "How do you protect routes and authorize admin vs student actions?"
**Answer**:
> *"We use a layered defense:*
> 1. ***Client Layer**: In React Router, we wrap pages in `<ProtectedRoute>` and `<ProtectedRoute adminOnly>`. The wrapper reads the student's role from `AuthContext` and redirects unauthorized students away from admin views.*
> 2. ***Server Middleware Layer**: The actual security enforcement happens on the backend. Routes use `protect` and `adminOnly` middleware. `protect` parses the Bearer JWT, decodes the user ID, verifies the student is in the database and not blocked, and attaches `req.student`. Then `adminOnly` checks `req.student.role === 'admin'`. If not an admin, it responds with 403 Forbidden."*

---

### Q5: "What happens if the background slot completer fails or the server restarts?"
**Answer**:
> *"The slot completer is designed to be idempotent and resilient:*
> - *It runs immediately upon server boot inside `connectDB().then(...)` before `httpServer.listen()` starts serving traffic.*
> - *It executes `Booking.updateMany` with a query matching all bookings where `status === 'confirmed'` and `(date < todayStr OR (date == todayStr AND endTime <= currentTime))`.*
> - *Because `updateMany` with `$set: { status: 'completed' }` is completely idempotent, running it multiple times has no side effects, and any downtime or restarts immediately self-heal on startup."*

---

### Q6: "How did you structure the MongoDB aggregation pipeline for the admin analytics?"
**Answer**:
> *"In `adminController.js`, we use native MongoDB aggregation pipelines to minimize in-memory server processing:*
> - ***Machine Utilization**: `$group` by `$status` with `$sum: 1`.*
> - ***Booking Status Breakdown**: `$group` by `$status`.*
> - ***Peak Operating Hours**: `$group` by `$startTime`, followed by `$sort: { count: -1 }` and `$limit: 10`.*
> *This lets MongoDB's query optimizer execute the aggregations directly against the database indexes without streaming raw documents into Node.js memory."*

---

### Q7: "Why did you use Vite over Create React App (CRA)?"
**Answer**:
> *"Create React App is officially deprecated and relies on Webpack, which bundles the entire application before serving it, resulting in slow cold starts and noticeable HMR lag.*
> *Vite leverages native ES modules (ESM) in modern browsers, compiling code on-demand via esbuild (written in Go) during development. This provides sub-200ms cold starts and instantaneous Hot Module Replacement. In production, Vite uses Rollup to produce highly-optimized, tree-shaken chunks."*

---

### Q8: "How does the QR code check-in feature work end-to-end?"
**Answer**:
> *"The QR code feature bridges digital reservations with physical machine usage:*
> 1. *When a student reserves a slot, `react-qr-code` dynamically encodes their unique MongoDB `booking._id` into an SVG QR code displayed on their dashboard.*
> 2. *At the laundry room, the caretaker opens the Admin Scanner console (`/admin/scanner`) and scans or enters the Booking ID.*
> 3. *The backend route `POST /api/bookings/:id/checkin` finds the booking, verifies it is active, and records the physical check-in timestamp.*
> *This prevents phantom bookings where students reserve slots but never show up."*

---

### Q9: "How do you handle API errors and invalid tokens on the frontend?"
**Answer**:
> *"We handle this centrally through Axios interceptors in `client/src/services/api.ts`:*
> - ***Request Interceptor**: Reads the JWT from `localStorage` and automatically attaches `Authorization: Bearer <token>` to every outgoing request.*
> - ***Response Interceptor**: Catches responses. If any API endpoint returns a `401 Unauthorized` (indicating the token expired or was invalidated), the interceptor wipes `token` and `student` from `localStorage` and redirects the user to `/login`.*
> *This ensures zero stale authorization state across the application."*

---

### Q10: "If the hostel expanded to 10 hostels with 50 machines each, what bottlenecks would you anticipate and how would you scale?"
**Answer**:
> *"At 10 hostels and 50 machines (500 machines total, ~5,000 students):*
> 1. ***Database Read/Write Load**: We would add compound indexes covering `{ hostel: 1, machineId: 1, date: 1 }` and consider MongoDB horizontal sharding keyed by `hostel`.*
> 2. ***WebSocket Fanout**: Currently, Socket.IO runs on a single Node process. With multiple server instances, an event emitted on Server A would not reach clients connected to Server B. We would implement the **Socket.IO Redis Adapter** (Pub/Sub) to broadcast events seamlessly across all horizontal server replicas.*
> 3. ***Caching**: Frequently queried static data (like machine lists and operating hours) would be cached in Redis with TTLs or invalidated on admin updates."*

---

### Q11: "What security measures prevent students from booking slots for other people or spoofing identities?"
**Answer**:
> *"1. **Authentication Token Binding**: Every booking request extracts `req.student._id` exclusively from the verified JWT payload (`req.student._id`), never from the request body. A student cannot send another user's ID in the POST body to book on their behalf.*
> *2. **Cancellation Ownership Guard**: In `cancelBooking`, we check `booking.studentId.toString() === req.student._id.toString() || req.student.role === 'admin'`. Normal students cannot cancel other students' bookings.*
> *3. **Single Daily Booking Enforcement**: The backend verifies that the requesting student ID does not already have an active booking on that date across any machine."*

---

### Q12: "What is your favorite feature in this project and why?"
**Answer**:
> *"My favorite feature is the real-time waitlist notification and slot recovery engine.*
> *In university hostels, people often cancel at the last minute when their plans change, leaving machines completely idle even though five other students needed that slot.*
> *By building a waitlist subscription where students can 'watch' a full slot, the moment a cancellation happens, Socket.IO emits a targeted event and an automated email is dispatched to the waitlisted students. It turns what used to be wasted machine downtime into a 100% utilized system."*

---

## 📋 5. Interview Live Demo Playbook

When demonstrating this project live on screen:
1. **Window Setup**: Open two side-by-side browser windows:
   - Window 1: Student Account (e.g. `student@nith.ac.in`).
   - Window 2: Admin Account or a Second Student Account.
2. **Demonstrate Real-Time Concurrency**:
   - In Window 1, navigate to `/book` and select a slot (e.g., Machine 1 at 10:00 AM).
   - In Window 2, watch the same slot grid.
   - Click **"Confirm Booking"** in Window 1.
   - Point out to the interviewer how Window 2 **instantly turns red / "Booked" in real time without refreshing the browser**.
3. **Demonstrate Fair-Usage Policy**:
   - Try to book a second machine on the same date with Window 1 $\rightarrow$ Show the error modal: *"You already have a slot reserved on this date"*.
4. **Demonstrate Cancellation & Instant Re-opening**:
   - Cancel the booking in Window 1.
   - Point out how Window 2 **instantly turns green / available again**.
5. **Demonstrate Admin Console**:
   - Navigate to `/admin/analytics` to show live peak-hour charts and status breakdowns.
   - Toggle a machine into `maintenance` mode on `/admin/machines` and show how it disappears from the student booking grid.
