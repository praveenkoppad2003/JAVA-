package com.workshop.taskapi.service;

import com.workshop.taskapi.model.Task;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class TaskService {

    private final Map<Long, Task> taskStore = new HashMap<>();
    private final AtomicLong idGenerator = new AtomicLong(0);

    public synchronized List<Task> findAll() {
        List<Task> tasks = new ArrayList<>(taskStore.values());
        tasks.sort(Comparator.comparing(Task::getId));
        return tasks;
    }

    public synchronized Task findById(Long id) {
        return taskStore.get(id);
    }

    public synchronized Task save(Task task) {
        if (task.getId() == null) {
            task.setId(idGenerator.incrementAndGet());
        } else {
            idGenerator.updateAndGet(current -> Math.max(current, task.getId()));
        }
        taskStore.put(task.getId(), task);
        return task;
    }

    public synchronized boolean delete(Long id) {
        return taskStore.remove(id) != null;
    }
}
