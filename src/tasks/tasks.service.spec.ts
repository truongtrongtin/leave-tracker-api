import { EntityRepository } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from 'users/user.entity';
import { Task } from './task.entity';
import { TasksService } from './tasks.service';

const mockUser = new User('test@gmail.com', '1234');
const oneTask = new Task('test task 1', 'description 1', mockUser);

describe('TasksService', () => {
  let tasksService: TasksService;
  let taskRepository: EntityRepository<Task>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            findOne: jest.fn().mockResolvedValue(oneTask),
          },
        },
      ],
    }).compile();

    tasksService = module.get<TasksService>(TasksService);
    taskRepository = module.get(getRepositoryToken(Task));
  });

  describe('getTasks', () => {
    it('should get a single task', () => {
      const repoSpy = jest.spyOn(taskRepository, 'findOne');
      expect(tasksService.getTaskById(1, mockUser)).resolves.toEqual(oneTask);
      expect(repoSpy).toBeCalledWith({ id: 1, user: mockUser });
    });
  });
});
