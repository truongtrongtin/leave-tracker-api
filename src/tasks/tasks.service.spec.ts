import { EntityRepository } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../users/user.entity';
import { Task } from './task.entity';
import { TasksService } from './tasks.service';

const mockUser = new User({
  email: 'user1@gmail.com',
  password: 'password',
  firstName: 'Tin',
  lastName: 'Truong',
});
const mockTask = new Task({
  title: 'task 1',
  description: 'description 1',
  user: mockUser,
});

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
            findOne: jest.fn().mockResolvedValue(mockTask),
          },
        },
      ],
    }).compile();

    tasksService = module.get<TasksService>(TasksService);
    taskRepository = module.get(getRepositoryToken(Task));
  });

  describe('getById', () => {
    it('should call taskRepository.findOne() and sucessfully return the task', () => {
      const repoSpy = jest.spyOn(taskRepository, 'findOne');
      expect(tasksService.getById(1)).resolves.toEqual(mockTask);
      expect(repoSpy).toBeCalledWith(1);
    });

    it('should throw an error as task is not found', () => {
      jest
        .spyOn(taskRepository, 'findOne')
        .mockRejectedValueOnce(new NotFoundException());
      expect(tasksService.getById(2)).rejects.toThrow(NotFoundException);
    });
  });
});
