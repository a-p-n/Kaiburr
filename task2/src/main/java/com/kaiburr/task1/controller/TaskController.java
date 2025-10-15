package com.kaiburr.task1.controller;

import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.openapi.Configuration;
import io.kubernetes.client.openapi.apis.CoreV1Api;
import io.kubernetes.client.openapi.models.V1Container;
import io.kubernetes.client.openapi.models.V1ObjectMeta;
import io.kubernetes.client.openapi.models.V1Pod;
import io.kubernetes.client.openapi.models.V1PodSpec;
import io.kubernetes.client.util.Config;

import com.kaiburr.task1.model.Task;
import com.kaiburr.task1.model.TaskExecution;
import com.kaiburr.task1.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.Arrays;

@RestController
@RequestMapping("/tasks")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    @GetMapping
    public ResponseEntity<?> getTasks(@RequestParam(required = false) String id) {
        if (id != null) {
            Optional<Task> task = taskRepository.findById(id);
            return task.map(t -> ResponseEntity.ok(List.of(t))).orElse(ResponseEntity.notFound().build());
        } else {
            List<Task> tasks = taskRepository.findAll();
            return ResponseEntity.ok(tasks);
        }

    }

    @PutMapping
    public ResponseEntity<Task> createTask(@RequestBody Task task) {
        if (isUnsafe(task.getCommand())) {
            return ResponseEntity.badRequest().build();
        }
        Task savedTask = taskRepository.save(task);
        return ResponseEntity.ok(savedTask);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable String id) {
        if (!taskRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        taskRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/findByName/{name}")
    public ResponseEntity<List<Task>> findTasksByName(@PathVariable String name) {
        List<Task> tasks = taskRepository.findByNameContaining(name);
        if (tasks.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(tasks);
    }

    @PutMapping("/{id}/execute")
    public ResponseEntity<Task> executeTask(@PathVariable String id) {
        Optional<Task> taskOptional = taskRepository.findById(id);
        if (!taskOptional.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        Task task = taskOptional.get();

        try {
            ApiClient client = Config.defaultClient();
            Configuration.setDefaultApiClient(client);
            CoreV1Api api = new CoreV1Api();

            V1Pod pod = new V1Pod()
                    .apiVersion("v1")
                    .kind("Pod")
                    .metadata(new V1ObjectMeta()
                            .name("task-runner-" + task.getId() + "-" + System.currentTimeMillis()))
                    .spec(new V1PodSpec()
                            .containers(Collections.singletonList(new V1Container()
                                    .name("task-runner-container")
                                    .image("busybox")
                                    .command(Collections.singletonList("/bin/sh"))
                                    .args(Arrays.asList("-c", task.getCommand()))))
                            .restartPolicy("Never"));

            api.createNamespacedPod("default", pod);

            TaskExecution execution = new TaskExecution();
            execution.setStartTime(new Date());
            if (task.getTaskExecutions() == null) {
                task.setTaskExecutions(new ArrayList<>());
            }
            task.getTaskExecutions().add(execution);
            taskRepository.save(task);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }

        return ResponseEntity.ok(task);
    }

    private boolean isUnsafe(String command) {
        if (command == null || command.trim().isEmpty()) {
            return true;
        }
        String[] maliciousCommands = { "rm", "sudo", ";", "&&", "||", "`", "$(" };
        String lowerCaseCommand = command.toLowerCase();
        for (String malicious : maliciousCommands) {
            if (lowerCaseCommand.contains(malicious)) {
                return true;
            }
        }
        return false;
    }
}
