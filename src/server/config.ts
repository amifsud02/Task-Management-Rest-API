import taskRouter from "../routes/task/route";
import express from "express";
import 'dotenv/config';

const app = express()
const port = 3333

app.use(taskRouter);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})

