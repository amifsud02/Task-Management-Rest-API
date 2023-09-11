import express from "express";
import { TaskController } from "../../controllers/taskController";

const taskRouter = express.Router();
const taskController = TaskController.getInstance();

taskRouter.get('/api/Task', async(req, res) => taskController.index(req, res));
taskRouter.post('/api/Task', async(req, res) => taskController.create(req, res))
taskRouter.get('/api/Task/:id', async(req, res) => taskController.show(req, res))
taskRouter.put('/api/Task/:id', async(req, res) => taskController.update(req, res))
taskRouter.delete('/api/Task/:id', async(req, res) => taskController.delete(req, res))

export default taskRouter;