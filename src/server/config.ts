import taskRouter from "../routes/task/route";
import express from "express";
import jwt from 'jsonwebtoken';
import * as fs from 'fs';

import 'dotenv/config';

const app = express()
const port = 3333

const privateKey = fs.readFileSync('src\\utils\\private.pem', 'utf8');

const users = [
    {
        id: 'a33361a4-50d8-11ee-be56-0242ac120002',
        username: 'user1',
        password: 'pass1'
    },
    {
        id: 'a3336492-50d8-11ee-be56-0242ac120002',
        username: 'user2',
        password: 'pass2'
    },
    {
        id: 'a33365e6-50d8-11ee-be56-0242ac120002',
        username: 'user3',
        password: 'pass3'
    },
    {
        id: 'a333671c-50d8-11ee-be56-0242ac120002',
        username: 'user4',
        password: 'pass4'
    },
    {
        id: 'a3336848-50d8-11ee-be56-0242ac120002',
        username: 'user5',
        password: 'pass5'
    }
]

app.use(express.json());
app.use(taskRouter);

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/api/login', (req, res) => {
    try {
        const { username, password } = req.body;

        const user = users.find(user => user.username === username && user.password === password);

        if(user) {
            const token = jwt.sign(
                { userId: user.id },
                privateKey,
                { 
                    expiresIn: '1hr',
                    algorithm: 'RS256'
                }       
            )

            res.status(200).send({message: 'Logged in Successfully', token});
        } else {
            res.status(401).send({error: 'Invalid Username or password'});
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Internal Server Error' });
    }
})


app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})

