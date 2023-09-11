import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken'
import 'dotenv/config';
import * as fs from 'fs';

const publicKey = fs.readFileSync('src\\utils\\public.pem', 'utf8');

interface RequestWithUser extends Request {
    userId? : string;
}

const authenticate = (req: RequestWithUser, res: Response, next: NextFunction) => {
    const authHeader = req.header('Authorization');

    if(!authHeader) {
        return res.status(400).send({
            errors: [
                "Authorization header missing.",
                "Unauthorized"
            ],
            code: 400,
            errorId: "Bad Request",
            timestamp: new Date().toISOString(),
        })
    }

    const authHeaderParts = authHeader.split(' ');

    if(2 !== authHeaderParts.length) {
        return res.status(401).send({
            errors: [
                "Invalid Authorization header.",
                "Unauthorized"
            ],
            code: 401,
            errorId: "Bad Request",
            timestamp: new Date().toISOString(),
        })
    }

    // Desctructuring
    const [ scheme, token ] = authHeaderParts;

    if(scheme !== 'Bearer') {
        return res.status(401).send({
            errors: [
                "Invalid Authorization header",
                "Unauthorized"
            ],
            code: 401,
            errorId: "Bad Request",
            timestamp: new Date().toISOString(),
        })
    }

    // Verifying the token
    jwt.verify(token, publicKey, {algorithms: ['RS256']}, (err, decoded) => { 
        if(err) {
            return res.status(401).send({
                errors: [
                    "Invalid Token",
                    "Unauthorized"
                ],
                code: 401,
                errorId: "Bad Request",
                timestamp: new Date().toISOString(),
            })
        }

        if (typeof decoded === 'object') {
            req['userId'] = decoded.userId;
            next();
        } else {
            return res.status(401).send({
                errors: [
                    "Invalid Token",
                    "Unauthorized"
                ],
                code: 401,
                errorId: "Bad Request",
                timestamp: new Date().toISOString(),
            })
        }
    })
}

export default authenticate;