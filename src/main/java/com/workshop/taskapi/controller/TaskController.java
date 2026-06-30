package com.workshop.taskapi.controller;

import com.workshop.taskapi.model.Task;
import com.workshop.taskapi.service.TaskService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.http.converter.HttpMessageNotReadableException;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/tasks")
public class TaskController {

    private static final Set<String> ALLOWED_STATUSES = Set.of("OPEN", "IN_PROGRESS", "DONE");

    private final TaskService taskService;

    @Value("${app.version}")
    private String appVersion;

    @Value("${app.mode}")
    private String appMode;

    @Value("${server.port}")
    private String appPort;

    @Value("${app.max-tasks}")
    private int maxTasks;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public ResponseEntity<List<Task>> findAll() {
        return ResponseEntity.ok(taskService.findAll());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Task task) {
        validateTask(task);

        if (taskService.findAll().size() >= maxTasks) {
            return badRequest("Cannot create task. Maximum task limit reached: " + maxTasks);
        }

        Task savedTask = taskService.save(new Task(null, normalizeTitle(task.getTitle()), normalizeStatus(task.getStatus())));
        return ResponseEntity.created(URI.create("/tasks/" + savedTask.getId())).body(savedTask);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> findById(@PathVariable Long id) {
        Task task = taskService.findById(id);
        if (task == null) {
            return notFound("Task not found with id: " + id);
        }
        return ResponseEntity.ok(task);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Task task) {
        validateTask(task);

        if (taskService.findById(id) == null) {
            return notFound("Task not found with id: " + id);
        }

        Task updatedTask = new Task(id, normalizeTitle(task.getTitle()), normalizeStatus(task.getStatus()));
        return ResponseEntity.ok(taskService.save(updatedTask));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        boolean deleted = taskService.delete(id);
        if (!deleted) {
            return notFound("Task not found with id: " + id);
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/info")
    public ResponseEntity<Map<String, String>> info() {
        Map<String, String> info = new LinkedHashMap<>();
        info.put("appVersion", appVersion);
        info.put("appMode", appMode);
        info.put("port", appPort);
        return ResponseEntity.ok(info);
    }

    @ExceptionHandler({
            IllegalArgumentException.class,
            HttpMessageNotReadableException.class,
            MethodArgumentTypeMismatchException.class,
            MethodArgumentNotValidException.class
    })
    public ResponseEntity<Map<String, Object>> handleBadInput(Exception exception) {
        return badRequest(exception.getMessage());
    }

    private void validateTask(Task task) {
        if (task == null) {
            throw new IllegalArgumentException("Request body is required.");
        }
        if (task.getTitle() == null || task.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Title is required and cannot be blank.");
        }
        String normalizedStatus = normalizeStatus(task.getStatus());
        if (!ALLOWED_STATUSES.contains(normalizedStatus)) {
            throw new IllegalArgumentException("Status must be one of: OPEN, IN_PROGRESS, DONE.");
        }
    }

    private String normalizeTitle(String title) {
        return title.trim();
    }

    private String normalizeStatus(String status) {
        if (status == null) {
            throw new IllegalArgumentException("Status is required.");
        }
        return status.trim().toUpperCase();
    }

    private ResponseEntity<Map<String, Object>> badRequest(String message) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", HttpStatus.BAD_REQUEST.value());
        response.put("error", "Bad Request");
        response.put("message", message);
        return ResponseEntity.badRequest().body(response);
    }

    private ResponseEntity<Map<String, Object>> notFound(String message) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", HttpStatus.NOT_FOUND.value());
        response.put("error", "Not Found");
        response.put("message", message);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }
}
