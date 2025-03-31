/**
 * Storage module for the To-Do List application
 * Handles storing and retrieving tasks using localStorage
 */
const Storage = (function() {
    const TASKS_KEY = 'todo_tasks';
    const RECYCLED_TASKS_KEY = 'todo_recycled_tasks';
    const RECYCLED_DAYS = 30; // Days to keep tasks in recycle bin
    
    /**
     * Get all tasks from localStorage
     * @returns {Array} Array of task objects
     */
    async function getTasks() {
        try {
            const tasksJson = localStorage.getItem(TASKS_KEY);
            return tasksJson ? JSON.parse(tasksJson) : [];
        } catch (error) {
            console.error('Error getting tasks from localStorage:', error);
            return [];
        }
    }
    
    /**
     * Save tasks to localStorage
     * @param {Array} tasks - Array of task objects
     */
    async function saveTasks(tasks) {
        try {
            localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
            return true;
        } catch (error) {
            console.error('Error saving tasks to localStorage:', error);
            return false;
        }
    }
    
    /**
     * Add a new task
     * @param {Object} task - Task object to add
     */
    async function addTask(task) {
        const tasks = await getTasks();
        tasks.push(task);
        return await saveTasks(tasks);
    }
    
    /**
     * Update a task
     * @param {String} taskId - ID of the task to update
     * @param {Object} updatedTask - Updated task object
     */
    async function updateTask(taskId, updatedTask) {
        const tasks = await getTasks();
        const index = tasks.findIndex(task => task.id === taskId);
        
        if (index !== -1) {
            tasks[index] = updatedTask;
            return await saveTasks(tasks);
        }
        return false;
    }
    
    /**
     * Toggle task completion status
     * @param {String} taskId - ID of the task to toggle
     */
    async function toggleTaskStatus(taskId) {
        const tasks = await getTasks();
        const index = tasks.findIndex(task => task.id === taskId);
        
        if (index !== -1) {
            tasks[index].completed = !tasks[index].completed;
            return await saveTasks(tasks);
        }
        return false;
    }
    
    /**
     * Delete a task (move to recycle bin)
     * @param {String} taskId - ID of the task to delete
     */
    async function deleteTask(taskId) {
        // Get current tasks
        const tasks = await getTasks();
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        
        if (taskIndex === -1) return false;
        
        // Get the task to be deleted
        const taskToDelete = tasks[taskIndex];
        
        // Add deletion timestamp
        taskToDelete.deletedAt = new Date().toISOString();
        
        // Move to recycle bin
        const recycledTasks = getRecycledTasks();
        recycledTasks.push(taskToDelete);
        localStorage.setItem(RECYCLED_TASKS_KEY, JSON.stringify(recycledTasks));
        
        // Remove from active tasks
        tasks.splice(taskIndex, 1);
        return await saveTasks(tasks);
    }
    
    /**
     * Get all recycled tasks
     * @returns {Array} Array of recycled task objects
     */
    function getRecycledTasks() {
        try {
            const recycledTasksJson = localStorage.getItem(RECYCLED_TASKS_KEY);
            return recycledTasksJson ? JSON.parse(recycledTasksJson) : [];
        } catch (error) {
            console.error('Error getting recycled tasks from localStorage:', error);
            return [];
        }
    }
    
    /**
     * Save recycled tasks
     * @param {Array} tasks - Array of recycled task objects
     */
    function saveRecycledTasks(tasks) {
        try {
            localStorage.setItem(RECYCLED_TASKS_KEY, JSON.stringify(tasks));
            return true;
        } catch (error) {
            console.error('Error saving recycled tasks to localStorage:', error);
            return false;
        }
    }
    
    /**
     * Restore a task from the recycle bin
     * @param {String} taskId - ID of the task to restore
     */
    async function restoreTask(taskId) {
        // Get recycled tasks
        const recycledTasks = getRecycledTasks();
        const taskIndex = recycledTasks.findIndex(task => task.id === taskId);
        
        if (taskIndex === -1) return false;
        
        // Get the task to restore
        const taskToRestore = recycledTasks[taskIndex];
        
        // Remove deletion timestamp
        delete taskToRestore.deletedAt;
        
        // Add back to active tasks
        const tasks = await getTasks();
        tasks.push(taskToRestore);
        await saveTasks(tasks);
        
        // Remove from recycle bin
        recycledTasks.splice(taskIndex, 1);
        return saveRecycledTasks(recycledTasks);
    }
    
    /**
     * Permanently delete a task from the recycle bin
     * @param {String} taskId - ID of the task to delete
     */
    function permanentlyDeleteTask(taskId) {
        // Get recycled tasks
        const recycledTasks = getRecycledTasks();
        const taskIndex = recycledTasks.findIndex(task => task.id === taskId);
        
        if (taskIndex === -1) return false;
        
        // Remove from recycle bin
        recycledTasks.splice(taskIndex, 1);
        return saveRecycledTasks(recycledTasks);
    }
    
    /**
     * Empty the recycle bin
     */
    function emptyRecycleBin() {
        return saveRecycledTasks([]);
    }
    
    /**
     * Clean up old tasks from the recycle bin
     */
    function cleanupRecycleBin() {
        const recycledTasks = getRecycledTasks();
        const now = new Date();
        
        // Filter out tasks that have been in the bin for more than RECYCLED_DAYS
        const filteredTasks = recycledTasks.filter(task => {
            const deletedAt = new Date(task.deletedAt);
            const daysDiff = Math.floor((now - deletedAt) / (1000 * 60 * 60 * 24));
            return daysDiff < RECYCLED_DAYS;
        });
        
        // Save filtered tasks if any were removed
        if (filteredTasks.length !== recycledTasks.length) {
            saveRecycledTasks(filteredTasks);
        }
    }
    
    /**
     * Get all dates that have associated tasks
     * @returns {Array} Array of date strings in the format YYYY-MM-DD
     */
    async function getDatesWithTasks() {
        const tasks = await getTasks();
        const datesSet = new Set();
        
        // Collect all unique dates that have tasks
        tasks.forEach(task => {
            if (task.dueDate) {
                datesSet.add(task.dueDate);
            }
        });
        
        // Convert set to array
        return Array.from(datesSet);
    }
    
    /**
     * Get tasks for a specific date
     * @param {String} dateString - Date string in the format YYYY-MM-DD
     * @returns {Array} Array of task objects for the specified date
     */
    async function getTasksByDate(dateString) {
        const tasks = await getTasks();
        
        // Filter tasks for the specified date
        return tasks.filter(task => task.dueDate === dateString);
    }
    
    // Public API
    return {
        getTasks,
        addTask,
        updateTask,
        toggleTaskStatus,
        deleteTask,
        getRecycledTasks,
        restoreTask,
        permanentlyDeleteTask,
        emptyRecycleBin,
        cleanupRecycleBin,
        getDatesWithTasks,
        getTasksByDate
    };
})();
