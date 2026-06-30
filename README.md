# Task API Workshop (Spring Boot)

This project is a beginner-friendly, production-style Spring Boot REST API for task management.
It is designed for a 1-day hands-on workshop where students learn:

- how a Spring Boot project is structured
- how REST APIs are created in real projects
- how profiles (`dev`, `prod`) change application behavior
- how to handle errors cleanly (`400`, `404`)
- how in-memory data works before using a real database

## 1. Prerequisites

Install these before running:

- Java 17 (required)
- IntelliJ IDEA Community or Ultimate
- Internet connection (first run downloads Maven dependencies)

Verify Java:

```powershell
java -version
```

You should see Java 17 in output.

## 2. Open the Project in IntelliJ (Step by Step)

1. Open IntelliJ IDEA.
2. Click **Open**.
3. Select the folder `springboot-workshop`.
4. IntelliJ will detect `pom.xml` and import as a Maven project.
5. Wait for indexing and Maven sync to complete.
6. Open [TaskApiApplication.java](/C:/Users/lnlnr/IdeaProjects/springboot-workshop/src/main/java/com/workshop/taskapi/TaskApiApplication.java).
7. Click the green Run icon next to `main()` to run from IDE.

If IntelliJ asks for JDK, choose Java 17.

## 3. Run the Project Using Maven Wrapper (`mvnw`)

This project includes Maven Wrapper, so system Maven is not needed.

### Windows PowerShell

```powershell
.\mvnw.cmd spring-boot:run
```

### macOS/Linux/Git Bash

```bash
./mvnw spring-boot:run
```

Default active profile is `dev`, and app starts on port `8080`.

## 4. Switch Profiles (`dev` and `prod`)

### Run with `dev`

```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
```

### Run with `prod`

```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=prod"
```

Notes:

- `dev` profile: port `8080`, mode `development`, DEBUG logging.
- `prod` profile: port `80`, mode `production`, WARN logging.
- On some systems, port `80` may require admin/root permission.

## 5. API Endpoints + `curl` Examples

Base URL (dev): `http://localhost:8080`

### A. Get all tasks

```bash
curl -s http://localhost:8080/tasks
```

Expected response:

```json
[
  {"id":1,"title":"Set up Spring Boot project","status":"OPEN"},
  {"id":2,"title":"Build Task REST API","status":"IN_PROGRESS"},
  {"id":3,"title":"Test endpoints with curl","status":"DONE"}
]
```

### B. Create task

```bash
curl -s -X POST http://localhost:8080/tasks \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Write workshop notes\",\"status\":\"OPEN\"}"
```

Expected response (`201 Created`):

```json
{"id":4,"title":"Write workshop notes","status":"OPEN"}
```

### C. Get one task by ID

```bash
curl -s http://localhost:8080/tasks/2
```

Expected response:

```json
{"id":2,"title":"Build Task REST API","status":"IN_PROGRESS"}
```

### D. Update task

```bash
curl -s -X PUT http://localhost:8080/tasks/2 \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Build Task REST API - updated\",\"status\":\"DONE\"}"
```

Expected response:

```json
{"id":2,"title":"Build Task REST API - updated","status":"DONE"}
```

### E. Delete task

```bash
curl -i -X DELETE http://localhost:8080/tasks/2
```

Expected response:

- HTTP status: `204 No Content`
- Body: empty

### F. App info endpoint

```bash
curl -s http://localhost:8080/tasks/info
```

Expected response in `dev`:

```json
{"appVersion":"1.0.0","appMode":"development","port":"8080"}
```

Expected response in `prod`:

```json
{"appVersion":"1.0.0","appMode":"production","port":"80"}
```

## 6. Error Handling Examples

### `404 Not Found` (task does not exist)

```bash
curl -s http://localhost:8080/tasks/999
```

Expected response:

```json
{"status":404,"error":"Not Found","message":"Task not found with id: 999"}
```

### `400 Bad Request` (invalid status)

```bash
curl -s -X POST http://localhost:8080/tasks \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"Bad status test\",\"status\":\"PENDING\"}"
```

Expected response:

```json
{"status":400,"error":"Bad Request","message":"Status must be one of: OPEN, IN_PROGRESS, DONE."}
```

### `400 Bad Request` (blank title)

```bash
curl -s -X POST http://localhost:8080/tasks \
  -H "Content-Type: application/json" \
  -d "{\"title\":\"   \",\"status\":\"OPEN\"}"
```

Expected response:

```json
{"status":400,"error":"Bad Request","message":"Title is required and cannot be blank."}
```

## 7. Project Structure (What Each File Does)

- [TaskApiApplication.java](/C:/Users/lnlnr/IdeaProjects/springboot-workshop/src/main/java/com/workshop/taskapi/TaskApiApplication.java)
  - Main entry point (`main()`), starts Spring Boot.
  - Contains startup data seeder (`CommandLineRunner`) that inserts 3 sample tasks.
- [Task.java](/C:/Users/lnlnr/IdeaProjects/springboot-workshop/src/main/java/com/workshop/taskapi/model/Task.java)
  - Data model (POJO) with fields `id`, `title`, `status`.
- [TaskService.java](/C:/Users/lnlnr/IdeaProjects/springboot-workshop/src/main/java/com/workshop/taskapi/service/TaskService.java)
  - In-memory storage using `HashMap`.
  - ID generation using `AtomicLong`.
  - CRUD-style methods used by controller.
- [TaskController.java](/C:/Users/lnlnr/IdeaProjects/springboot-workshop/src/main/java/com/workshop/taskapi/controller/TaskController.java)
  - REST endpoints (`GET`, `POST`, `PUT`, `DELETE`, `/info`).
  - Input validation and HTTP error handling.
- [application.yml](/C:/Users/lnlnr/IdeaProjects/springboot-workshop/src/main/resources/application.yml)
  - Common/base config (name, default profile, app metadata).
- [application-dev.yml](/C:/Users/lnlnr/IdeaProjects/springboot-workshop/src/main/resources/application-dev.yml)
  - Dev profile config (`8080`, development mode, DEBUG logs).
- [application-prod.yml](/C:/Users/lnlnr/IdeaProjects/springboot-workshop/src/main/resources/application-prod.yml)
  - Prod profile config (`80`, production mode, WARN logs).
- [pom.xml](/C:/Users/lnlnr/IdeaProjects/springboot-workshop/pom.xml)
  - Maven build configuration and dependencies.

## 8. Common Errors and Fixes

1. `mvnw is not recognized`
   - Windows: use `.\mvnw.cmd` (not `mvnw`).
2. Port already in use (8080 or 80)
   - Close the app using that port, or run with another port:
   - `.\mvnw.cmd spring-boot:run "-Dspring-boot.run.arguments=--server.port=8081"`
3. Java version mismatch
   - Ensure `java -version` shows 17.
4. `403/permission denied` on port 80 in prod
   - Run terminal as Administrator, or temporarily override port while keeping prod profile.
5. `curl` command issues in PowerShell
   - Use `curl.exe` explicitly instead of `curl` alias.

## 9. Student Exercises (Try Yourself)

1. Add a new field `description` to `Task` and return it in all APIs.
2. Add endpoint `GET /tasks/status/{status}` to filter by status.
3. Add validation rule: title must be at least 5 characters.
4. Add endpoint `PATCH /tasks/{id}/status` to update only status.
5. Enforce `app.max-tasks` strictly and return a custom error when limit is reached.
6. Add a simple unit test for `TaskService` (optional advanced exercise).

## 10. Quick Workshop Flow Suggestion

1. Run app and hit `GET /tasks`.
2. Explain model, service, controller layers.
3. Walk through create/update/delete APIs.
4. Show error handling (`400`, `404`) live.
5. Switch profiles and call `/tasks/info`.
6. Give exercises for pair practice.

## 11. Local Web App Demo (Spring Boot Fundamentals Lab)

This project now also includes a browser-based learning UI served directly by Spring Boot.

### Open it

1. Start the application:
   - PowerShell: `.\mvnw.cmd spring-boot:run`
2. Open browser:
   - `http://localhost:8080`

### What students can do in the web app

1. Learn key concepts from visual cards (`Controller`, `Service`, `Model`, `Profiles`).
2. Use the API Playground to call:
   - `GET /tasks`
   - `POST /tasks`
   - `GET /tasks/{id}`
   - `PUT /tasks/{id}`
   - `DELETE /tasks/{id}`
   - `GET /tasks/info`
3. Use the Live Task Board to move tasks across statuses.
4. Complete Challenge Mode:
   - create one task
   - move one task
   - trigger `404`
   - trigger `400`

## 12. Classroom Assessment Mode (New)

The web app now includes built-in student assessment and reporting.

### New capabilities

1. Student Session capture:
   - Roll number (required)
   - Name (optional)
   - Batch/Section (optional)
2. Quiz Arena:
   - 12 multiple-choice questions on Spring Boot fundamentals
   - Instant feedback on each question
   - Auto score + percentage + grade (`A+` to `F`)
3. Grade Report:
   - JSON report download
   - TXT report download
   - Includes student details, quiz score, challenge progress, API metrics
4. API Inspector:
   - Timeline of API calls with method, endpoint, status, and latency
   - Click any call to inspect full request and response
5. Observation prompts:
   - Students are guided on what to observe while interacting with APIs

### Suggested in-class flow (30-40 mins)

1. Ask each student to enter roll number in **Student Session**.
2. Let students complete API challenge tasks.
3. Ask students to inspect at least one API call from **API Inspector**.
4. Run the 12-question quiz.
5. Download and collect grade reports (`JSON` or `TXT`).
