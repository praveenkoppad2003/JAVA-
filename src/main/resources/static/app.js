const STATUS_ORDER = ["OPEN", "IN_PROGRESS", "DONE"];

const QUIZ_QUESTIONS = [
    {
        id: 1,
        question: "Which annotation marks the main Spring Boot application class?",
        options: ["@Component", "@SpringBootApplication", "@RestController", "@EnableAutoConfig"],
        answer: 1,
        explain: "@SpringBootApplication enables component scan and auto-configuration for the app."
    },
    {
        id: 2,
        question: "Which layer should contain business logic in this project?",
        options: ["Controller", "Service", "Model", "application.yml"],
        answer: 1,
        explain: "Business logic belongs in the service layer, not directly in controller."
    },
    {
        id: 3,
        question: "Which HTTP method should be used to create a task?",
        options: ["GET", "PATCH", "POST", "DELETE"],
        answer: 2,
        explain: "POST is used for creating resources."
    },
    {
        id: 4,
        question: "What status code is expected for successful task creation?",
        options: ["200", "201", "204", "404"],
        answer: 1,
        explain: "201 Created is the correct response for successful resource creation."
    },
    {
        id: 5,
        question: "What data structure is used as in-memory storage in this workshop?",
        options: ["ArrayList", "HashMap", "TreeSet", "LinkedList"],
        answer: 1,
        explain: "TaskService stores tasks in HashMap<Long, Task>."
    },
    {
        id: 6,
        question: "Why is AtomicLong used in TaskService?",
        options: ["To store task title", "To validate JSON", "Thread-safe ID generation", "To read application.yml"],
        answer: 2,
        explain: "AtomicLong is used for thread-safe incrementing task IDs."
    },
    {
        id: 7,
        question: "Which endpoint returns app metadata like version and mode?",
        options: ["/tasks/meta", "/tasks/info", "/info/tasks", "/tasks/status"],
        answer: 1,
        explain: "/tasks/info returns appVersion, appMode, and port."
    },
    {
        id: 8,
        question: "What should API return when task ID does not exist?",
        options: ["400 Bad Request", "404 Not Found", "204 No Content", "301 Moved Permanently"],
        answer: 1,
        explain: "Missing resource should return 404 Not Found."
    },
    {
        id: 9,
        question: "Which profile file overrides configuration for development?",
        options: ["application-local.yml", "application-main.yml", "application-dev.yml", "application-default.yml"],
        answer: 2,
        explain: "application-dev.yml is loaded when dev profile is active."
    },
    {
        id: 10,
        question: "Which status is invalid in this task API?",
        options: ["OPEN", "IN_PROGRESS", "DONE", "PENDING"],
        answer: 3,
        explain: "Allowed statuses are OPEN, IN_PROGRESS, DONE."
    },
    {
        id: 11,
        question: "Which class receives HTTP requests in this project?",
        options: ["TaskService", "TaskApiApplication", "TaskController", "Task"],
        answer: 2,
        explain: "TaskController maps endpoints and handles incoming requests."
    },
    {
        id: 12,
        question: "Why inspect API logs during workshop?",
        options: ["To change Java version", "To observe request/response behavior", "To install Maven", "To edit IDE theme"],
        answer: 1,
        explain: "Inspection helps students connect frontend actions with backend behavior."
    }
];

const STUDENT_STORAGE_KEY = "task_lab_student_session";
const REPORT_STORAGE_KEY = "task_lab_last_report";

const state = {
    tasks: [],
    apiLogs: [],
    student: {
        roll: "",
        name: "",
        batch: ""
    },
    info: null,
    quizResult: null,
    challenge: {
        created: false,
        moved: false,
        seen404: false,
        seen400: false,
        inspected: false,
        graded: false
    }
};

const elements = {
    version: document.getElementById("pillVersion"),
    mode: document.getElementById("pillMode"),
    port: document.getElementById("pillPort"),
    apiCalls: document.getElementById("pillApiCalls"),
    responseTitle: document.getElementById("responseTitle"),
    responseStatus: document.getElementById("responseStatus"),
    responseOutput: document.getElementById("responseOutput"),
    progressFill: document.getElementById("progressFill"),
    progressText: document.getElementById("progressText"),
    quizContainer: document.getElementById("quizContainer"),
    quizScoreLine: document.getElementById("quizScoreLine"),
    studentStatus: document.getElementById("studentStatus"),
    reportOutput: document.getElementById("reportOutput"),
    inspectorList: document.getElementById("inspectorList"),
    inspectorDetails: document.getElementById("inspectorDetails"),
    columns: {
        OPEN: document.getElementById("column-OPEN"),
        IN_PROGRESS: document.getElementById("column-IN_PROGRESS"),
        DONE: document.getElementById("column-DONE")
    }
};

function safeParse(text) {
    try {
        return JSON.parse(text);
    } catch (error) {
        return text;
    }
}

function nowIso() {
    return new Date().toISOString();
}

function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString();
}

function gradeFromPercentage(percentage) {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    if (percentage >= 50) return "D";
    return "F";
}

function updateApiCallPill() {
    elements.apiCalls.textContent = String(state.apiLogs.length);
}

function addApiLog(entry) {
    state.apiLogs.unshift(entry);
    if (state.apiLogs.length > 80) {
        state.apiLogs = state.apiLogs.slice(0, 80);
    }
    updateApiCallPill();
    renderInspector();
}

function setResponse(title, result) {
    const pretty = result.data === null ? "" : JSON.stringify(result.data, null, 2);
    elements.responseTitle.textContent = title;
    elements.responseOutput.textContent = pretty || "(no response body)";
    elements.responseStatus.textContent = "status " + result.status;
    elements.responseStatus.className = "status-chip " + (result.ok ? "ok" : "error");

    if (result.status === 404) {
        state.challenge.seen404 = true;
    }
    if (result.status === 400) {
        state.challenge.seen400 = true;
    }
    renderChallenges();
}

async function requestJson(method, path, body) {
    const startedAt = performance.now();
    const timestamp = nowIso();
    const options = {
        method,
        headers: {}
    };

    if (body !== undefined) {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
    }

    let result;
    try {
        const response = await fetch(path, options);
        const contentType = response.headers.get("content-type") || "";

        let data = null;
        if (contentType.includes("application/json")) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = text.length ? safeParse(text) : null;
        }

        result = {
            ok: response.ok,
            status: response.status,
            data
        };
    } catch (error) {
        result = {
            ok: false,
            status: 0,
            data: {
                error: "Network error",
                message: error.message
            }
        };
    }

    const durationMs = Math.round(performance.now() - startedAt);
    addApiLog({
        id: Date.now() + Math.floor(Math.random() * 1000),
        timestamp,
        method,
        path,
        requestBody: body ?? null,
        status: result.status,
        ok: result.ok,
        durationMs,
        responseData: result.data
    });

    return result;
}

function nextStatus(status) {
    const index = STATUS_ORDER.indexOf(status);
    if (index === -1) {
        return "OPEN";
    }
    return STATUS_ORDER[(index + 1) % STATUS_ORDER.length];
}

function renderTasks() {
    STATUS_ORDER.forEach(status => {
        const root = elements.columns[status];
        root.innerHTML = "";

        const list = state.tasks.filter(task => task.status === status);
        if (list.length === 0) {
            const empty = document.createElement("div");
            empty.className = "empty";
            empty.textContent = "No tasks yet in " + status;
            root.appendChild(empty);
            return;
        }

        list.forEach(task => {
            const card = document.createElement("article");
            card.className = "task-card";

            const title = document.createElement("p");
            title.className = "task-title";
            title.textContent = task.title;

            const meta = document.createElement("p");
            meta.className = "task-meta";
            meta.textContent = "ID: " + task.id + " | " + task.status;

            const actions = document.createElement("div");
            actions.className = "task-actions";

            const move = document.createElement("button");
            move.type = "button";
            move.textContent = "Move to " + nextStatus(task.status);
            move.addEventListener("click", async () => {
                const result = await requestJson("PUT", "/tasks/" + task.id, {
                    title: task.title,
                    status: nextStatus(task.status)
                });
                setResponse("PUT /tasks/" + task.id, result);
                if (result.ok) {
                    state.challenge.moved = true;
                    await loadTasks(false);
                }
            });

            const remove = document.createElement("button");
            remove.type = "button";
            remove.className = "danger";
            remove.textContent = "Delete";
            remove.addEventListener("click", async () => {
                const result = await requestJson("DELETE", "/tasks/" + task.id);
                setResponse("DELETE /tasks/" + task.id, result);
                if (result.ok) {
                    await loadTasks(false);
                }
            });

            actions.appendChild(move);
            actions.appendChild(remove);
            card.appendChild(title);
            card.appendChild(meta);
            card.appendChild(actions);
            root.appendChild(card);
        });
    });
}

function renderChallenges() {
    const items = document.querySelectorAll(".challenge-list li");
    const total = items.length;
    let completed = 0;

    items.forEach(item => {
        const key = item.getAttribute("data-challenge");
        const done = Boolean(state.challenge[key]);
        item.classList.toggle("done", done);
        if (done) {
            completed += 1;
        }
    });

    const percent = total === 0 ? 0 : (completed / total) * 100;
    elements.progressFill.style.width = percent + "%";
    elements.progressText.textContent = completed + " / " + total + " completed";
}

function renderStudentStatus() {
    if (!state.student.roll) {
        elements.studentStatus.textContent = "No active student session.";
        return;
    }
    const namePart = state.student.name ? " | " + state.student.name : "";
    const batchPart = state.student.batch ? " | " + state.student.batch : "";
    elements.studentStatus.textContent = "Active: " + state.student.roll + namePart + batchPart;
}

function storeStudentSession() {
    localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(state.student));
}

function loadStudentSession() {
    const saved = localStorage.getItem(STUDENT_STORAGE_KEY);
    if (!saved) {
        return;
    }
    const parsed = safeParse(saved);
    if (parsed && typeof parsed === "object") {
        state.student.roll = parsed.roll || "";
        state.student.name = parsed.name || "";
        state.student.batch = parsed.batch || "";
        document.getElementById("studentRoll").value = state.student.roll;
        document.getElementById("studentName").value = state.student.name;
        document.getElementById("studentBatch").value = state.student.batch;
    }
}

function renderQuizQuestions() {
    elements.quizContainer.innerHTML = "";

    QUIZ_QUESTIONS.forEach((q, index) => {
        const item = document.createElement("article");
        item.className = "quiz-item";
        item.id = "quiz-item-" + q.id;

        const heading = document.createElement("h3");
        heading.textContent = (index + 1) + ". " + q.question;

        const options = document.createElement("div");
        options.className = "quiz-options";

        q.options.forEach((text, optionIndex) => {
            const option = document.createElement("label");
            option.className = "quiz-option";
            option.innerHTML =
                "<input type=\"radio\" name=\"quiz-q" + q.id + "\" value=\"" + optionIndex + "\">" +
                "<span>" + text + "</span>";
            options.appendChild(option);
        });

        const feedback = document.createElement("p");
        feedback.className = "quiz-feedback";
        feedback.id = "quiz-feedback-" + q.id;
        feedback.textContent = "Not graded yet.";

        item.appendChild(heading);
        item.appendChild(options);
        item.appendChild(feedback);
        elements.quizContainer.appendChild(item);
    });
}

function collectQuizAnswers() {
    return QUIZ_QUESTIONS.map(q => {
        const selected = document.querySelector("input[name='quiz-q" + q.id + "']:checked");
        return selected ? Number(selected.value) : null;
    });
}

function renderQuizFeedback(result) {
    QUIZ_QUESTIONS.forEach((q, index) => {
        const item = document.getElementById("quiz-item-" + q.id);
        const feedback = document.getElementById("quiz-feedback-" + q.id);
        const answer = result.answers[index];

        item.classList.remove("correct", "wrong");
        if (answer === q.answer) {
            item.classList.add("correct");
            feedback.className = "quiz-feedback ok";
            feedback.textContent = "Correct. " + q.explain;
        } else if (answer === null) {
            item.classList.add("wrong");
            feedback.className = "quiz-feedback error";
            feedback.textContent = "Not answered. Correct answer: " + q.options[q.answer] + ". " + q.explain;
        } else {
            item.classList.add("wrong");
            feedback.className = "quiz-feedback error";
            feedback.textContent = "Incorrect. Correct answer: " + q.options[q.answer] + ". " + q.explain;
        }
    });
}

function getApiMetrics() {
    const total = state.apiLogs.length;
    const success = state.apiLogs.filter(log => log.ok).length;
    const failed = total - success;
    const avgDuration = total === 0
        ? 0
        : Math.round(state.apiLogs.reduce((sum, log) => sum + log.durationMs, 0) / total);

    return {
        totalCalls: total,
        successfulCalls: success,
        failedCalls: failed,
        averageLatencyMs: avgDuration
    };
}

function buildReport() {
    if (!state.quizResult) {
        return null;
    }
    return {
        generatedAt: nowIso(),
        student: state.student,
        app: {
            version: elements.version.textContent,
            mode: elements.mode.textContent,
            port: elements.port.textContent
        },
        quiz: state.quizResult,
        challengeProgress: state.challenge,
        apiMetrics: getApiMetrics(),
        observationNote: "Inspect API Inspector timeline to connect each UI action with backend behavior."
    };
}

function renderReport(report) {
    if (!report) {
        elements.reportOutput.textContent = "Generate a quiz grade report to preview it here.";
        return;
    }
    elements.reportOutput.textContent = JSON.stringify(report, null, 2);
}

function toReportText(report) {
    const lines = [
        "Spring Boot Fundamentals Lab - Grade Report",
        "Generated At: " + report.generatedAt,
        "",
        "Student",
        "Roll: " + (report.student.roll || "-"),
        "Name: " + (report.student.name || "-"),
        "Batch: " + (report.student.batch || "-"),
        "",
        "Quiz",
        "Score: " + report.quiz.score + "/" + report.quiz.total,
        "Percentage: " + report.quiz.percentage + "%",
        "Grade: " + report.quiz.grade,
        "",
        "API Metrics",
        "Total Calls: " + report.apiMetrics.totalCalls,
        "Successful Calls: " + report.apiMetrics.successfulCalls,
        "Failed Calls: " + report.apiMetrics.failedCalls,
        "Average Latency: " + report.apiMetrics.averageLatencyMs + " ms",
        "",
        "Observation",
        report.observationNote
    ];
    return lines.join("\n");
}

function downloadFile(filename, content, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function timestampForFile() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const date = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    const sec = String(now.getSeconds()).padStart(2, "0");
    return year + month + date + "-" + hour + min + sec;
}

function renderInspector() {
    elements.inspectorList.innerHTML = "";
    if (state.apiLogs.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.textContent = "No API calls yet.";
        elements.inspectorList.appendChild(empty);
        return;
    }

    state.apiLogs.forEach(log => {
        const item = document.createElement("article");
        item.className = "inspector-item";

        const line1 = document.createElement("p");
        line1.className = "line-1";
        line1.textContent = log.method + " " + log.path + " -> " + log.status;

        const line2 = document.createElement("p");
        line2.className = "line-2";
        line2.textContent = formatTime(log.timestamp) + " | " + log.durationMs + " ms";

        item.appendChild(line1);
        item.appendChild(line2);

        item.addEventListener("click", () => {
            state.challenge.inspected = true;
            renderChallenges();

            elements.inspectorDetails.textContent = JSON.stringify({
                timestamp: log.timestamp,
                method: log.method,
                path: log.path,
                status: log.status,
                ok: log.ok,
                latencyMs: log.durationMs,
                requestBody: log.requestBody,
                responseData: log.responseData
            }, null, 2);
        });

        elements.inspectorList.appendChild(item);
    });
}

async function loadInfo() {
    const result = await requestJson("GET", "/tasks/info");
    if (!result.ok) {
        setResponse("GET /tasks/info", result);
        return;
    }
    state.info = result.data;
    elements.version.textContent = result.data.appVersion;
    elements.mode.textContent = result.data.appMode;
    elements.port.textContent = result.data.port;
}

async function loadTasks(showResponse) {
    const result = await requestJson("GET", "/tasks");
    if (showResponse) {
        setResponse("GET /tasks", result);
    }
    if (result.ok && Array.isArray(result.data)) {
        state.tasks = result.data;
        renderTasks();
    }
}

function valueOf(id) {
    return document.getElementById(id).value.trim();
}

function bindStudentForm() {
    document.getElementById("studentForm").addEventListener("submit", event => {
        event.preventDefault();
        const roll = valueOf("studentRoll");
        const name = valueOf("studentName");
        const batch = valueOf("studentBatch");

        if (!roll) {
            elements.studentStatus.textContent = "Roll number is required before grading.";
            return;
        }

        state.student.roll = roll;
        state.student.name = name;
        state.student.batch = batch;
        storeStudentSession();
        renderStudentStatus();
    });

    document.getElementById("clearStudent").addEventListener("click", () => {
        state.student = { roll: "", name: "", batch: "" };
        document.getElementById("studentRoll").value = "";
        document.getElementById("studentName").value = "";
        document.getElementById("studentBatch").value = "";
        localStorage.removeItem(STUDENT_STORAGE_KEY);
        renderStudentStatus();
    });
}

function bindQuiz() {
    document.getElementById("submitQuiz").addEventListener("click", () => {
        if (!state.student.roll) {
            elements.quizScoreLine.textContent = "Save student roll number before submitting quiz.";
            return;
        }

        const answers = collectQuizAnswers();
        let score = 0;
        QUIZ_QUESTIONS.forEach((q, index) => {
            if (answers[index] === q.answer) {
                score += 1;
            }
        });

        const total = QUIZ_QUESTIONS.length;
        const percentage = Number(((score / total) * 100).toFixed(2));
        const grade = gradeFromPercentage(percentage);

        state.quizResult = {
            score,
            total,
            percentage,
            grade,
            answers,
            submittedAt: nowIso()
        };

        renderQuizFeedback(state.quizResult);
        elements.quizScoreLine.textContent =
            "Score: " + score + "/" + total + " | " + percentage + "% | Grade: " + grade;

        state.challenge.graded = true;
        renderChallenges();

        const report = buildReport();
        if (report) {
            renderReport(report);
            localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(report));
        }
    });

    document.getElementById("resetQuiz").addEventListener("click", () => {
        QUIZ_QUESTIONS.forEach(q => {
            const selected = document.querySelector("input[name='quiz-q" + q.id + "']:checked");
            if (selected) {
                selected.checked = false;
            }
            const card = document.getElementById("quiz-item-" + q.id);
            const feedback = document.getElementById("quiz-feedback-" + q.id);
            card.classList.remove("correct", "wrong");
            feedback.className = "quiz-feedback";
            feedback.textContent = "Not graded yet.";
        });
        state.quizResult = null;
        elements.quizScoreLine.textContent = "Quiz reset. Submit again for grading.";
        renderReport(null);
    });
}

function bindReportActions() {
    document.getElementById("downloadJson").addEventListener("click", () => {
        const report = buildReport();
        if (!report) {
            elements.reportOutput.textContent = "Submit quiz first to generate downloadable report.";
            return;
        }
        const filename = (state.student.roll || "student") + "-report-" + timestampForFile() + ".json";
        downloadFile(filename, JSON.stringify(report, null, 2), "application/json");
        localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(report));
    });

    document.getElementById("downloadTxt").addEventListener("click", () => {
        const report = buildReport();
        if (!report) {
            elements.reportOutput.textContent = "Submit quiz first to generate downloadable report.";
            return;
        }
        const filename = (state.student.roll || "student") + "-report-" + timestampForFile() + ".txt";
        downloadFile(filename, toReportText(report), "text/plain");
        localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(report));
    });

    document.getElementById("loadLastReport").addEventListener("click", () => {
        const raw = localStorage.getItem(REPORT_STORAGE_KEY);
        if (!raw) {
            elements.reportOutput.textContent = "No previously saved report found in this browser.";
            return;
        }
        const report = safeParse(raw);
        renderReport(report);
        elements.quizScoreLine.textContent =
            "Loaded previous report for roll: " + ((report.student && report.student.roll) || "unknown");
    });
}

function bindApiPlayground() {
    document.getElementById("createForm").addEventListener("submit", async event => {
        event.preventDefault();
        const payload = {
            title: valueOf("createTitle"),
            status: valueOf("createStatus")
        };
        const result = await requestJson("POST", "/tasks", payload);
        setResponse("POST /tasks", result);
        if (result.ok) {
            state.challenge.created = true;
            event.target.reset();
            await loadTasks(false);
        }
        renderChallenges();
    });

    document.getElementById("updateForm").addEventListener("submit", async event => {
        event.preventDefault();
        const id = valueOf("updateId");
        const payload = {
            title: valueOf("updateTitle"),
            status: valueOf("updateStatus")
        };
        const result = await requestJson("PUT", "/tasks/" + id, payload);
        setResponse("PUT /tasks/" + id, result);
        if (result.ok) {
            state.challenge.moved = true;
            await loadTasks(false);
        }
        renderChallenges();
    });

    document.getElementById("getByIdForm").addEventListener("submit", async event => {
        event.preventDefault();
        const id = valueOf("getId");
        const result = await requestJson("GET", "/tasks/" + id);
        setResponse("GET /tasks/" + id, result);
    });

    document.getElementById("deleteForm").addEventListener("submit", async event => {
        event.preventDefault();
        const id = valueOf("deleteId");
        const result = await requestJson("DELETE", "/tasks/" + id);
        setResponse("DELETE /tasks/" + id, result);
        if (result.ok) {
            await loadTasks(false);
        }
    });

    document.getElementById("btnGetAll").addEventListener("click", async () => {
        await loadTasks(true);
    });

    document.getElementById("btnInfo").addEventListener("click", async () => {
        const result = await requestJson("GET", "/tasks/info");
        setResponse("GET /tasks/info", result);
        if (result.ok) {
            state.info = result.data;
            elements.version.textContent = result.data.appVersion;
            elements.mode.textContent = result.data.appMode;
            elements.port.textContent = result.data.port;
        }
    });

    document.getElementById("btn404").addEventListener("click", async () => {
        const result = await requestJson("GET", "/tasks/99999");
        setResponse("GET /tasks/99999", result);
    });

    document.getElementById("btn400").addEventListener("click", async () => {
        const result = await requestJson("POST", "/tasks", {
            title: "",
            status: "PENDING"
        });
        setResponse("POST /tasks (invalid payload)", result);
    });

    document.getElementById("refreshBoard").addEventListener("click", async () => {
        await loadTasks(true);
    });
}

function bindInspectorControls() {
    document.getElementById("clearInspector").addEventListener("click", () => {
        state.apiLogs = [];
        updateApiCallPill();
        renderInspector();
        elements.inspectorDetails.textContent = "Inspector cleared. Run API calls to observe timeline again.";
    });
}

async function init() {
    loadStudentSession();
    renderStudentStatus();
    renderQuizQuestions();
    renderChallenges();
    renderInspector();
    bindStudentForm();
    bindQuiz();
    bindReportActions();
    bindApiPlayground();
    bindInspectorControls();
    await Promise.all([loadInfo(), loadTasks(false)]);
}

init();
