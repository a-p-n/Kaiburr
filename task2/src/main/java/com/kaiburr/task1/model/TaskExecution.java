package com.kaiburr.task1.model;

import lombok.Data;
import java.util.Date;

@Data
public class TaskExecution {
    private Date startTime;
    private Date endTime;
    private String output;
}
