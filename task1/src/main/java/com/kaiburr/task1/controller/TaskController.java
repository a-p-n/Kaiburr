package com.kaiburr.task1.controller;

import com.kaiburr.task1.model.Task;
import com.kaiburr.task1.model.TaskExecution;
import com.kaiburr.task1.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Optional;

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

        TaskExecution execution = new TaskExecution();
        execution.setStartTime(new Date());
        execution.setEndTime(new Date());
        execution.setOutput("Executed command: " + task.getCommand());

        if (task.getTaskExecutions() == null) {
            task.setTaskExecutions(Collections.singletonList(execution));
        } else {
            task.getTaskExecutions().add(execution);
        }

        taskRepository.save(task);
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
