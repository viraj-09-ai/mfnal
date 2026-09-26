const Task = require('../models/Task');

exports.createTask = async (taskData) => {
    return await Task.create(taskData);
};

exports.getAllTasks = async () => {
    return await Task.find({});
};

exports.updateTask = async (id, updateData) => {
    return await Task.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
};

exports.deleteTask = async (id) => {
    return await Task.findByIdAndDelete(id);
};