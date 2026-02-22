package com.kaiburr.task3.repository;

import com.kaiburr.task3.model.Task;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface TaskRepository extends MongoRepository<Task, String> {

    List<Task> findByNameContaining(String name);
}
