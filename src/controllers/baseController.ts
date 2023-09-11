import { Request, Response } from 'express'

export abstract class BaseController {

    abstract index(req: Request, res: Response): Promise<any>; // Get All
    abstract create(req: Request, res: Response): Promise<any>; // Create One 
    abstract update(req: Request, res: Response): Promise<any>; // Update One
    abstract show(req: Request, res: Response): Promise<any>; // Get One
    abstract delete(req: Request, res: Response): Promise<any>; // Delete One

}