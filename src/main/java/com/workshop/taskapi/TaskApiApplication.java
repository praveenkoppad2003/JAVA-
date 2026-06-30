package com.workshop.taskapi;

import com.workshop.taskapi.model.Task;
import com.workshop.taskapi.service.TaskService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class TaskApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(TaskApiApplication.class, args);
	}

	@Bean
	CommandLineRunner loadSampleData(TaskService taskService) {
		return args -> {
			if (!taskService.findAll().isEmpty()) {
				return;
			}

			taskService.save(new Task(null, "Set up Spring Boot project", "OPEN"));
			taskService.save(new Task(null, "Build Task REST API", "IN_PROGRESS"));
			taskService.save(new Task(null, "Test endpoints with curl", "DONE"));
		};
	}
}
