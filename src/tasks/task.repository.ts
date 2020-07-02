import { Repository, EntityRepository } from 'typeorm';
import { Task } from './task.model';

@EntityRepository(Task)
export class TaskRepository extends Repository<Task> {}
