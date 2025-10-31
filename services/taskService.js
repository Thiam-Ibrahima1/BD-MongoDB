const Task = require('../models/Task');

async function getTasksForUser(userId) {
    return await Task.find({ userId });
}

async function createTask(title, description, priority, dueDate, userId) {
    const newTask = new Task({
        title,
        description,
        completed: false,
        priority,
        dueDate,
        userId
    });
    await newTask.save();
    return newTask;
}

async function updateTask(id, data) {
    const updatedTask = await Task.findByIdAndUpdate(id, data, { new: true });
    return updatedTask;
}

async function deleteTask(id) {
    const result = await Task.findByIdAndDelete(id);
    return result !== null; 
}

module.exports = {
    getTasksForUser,
    createTask,
    updateTask,
    deleteTask
};