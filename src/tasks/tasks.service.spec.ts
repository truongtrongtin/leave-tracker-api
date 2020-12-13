import { EntityRepository } from '@mikro-orm/core';
import { getRepositoryToken } from '@mikro-orm/nestjs';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '../users/user.entity';
import { Task } from './task.entity';
import { TasksService } from './tasks.service';

const mockUser = new User('user1@gmail.com', 'password');
const mockTask = new Task('task 1', 'description 1', mockUser);

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

  describe('getTaskById', () => {
    it('should call taskRepository.findOne() and sucessfully return the task', () => {
      const repoSpy = jest.spyOn(taskRepository, 'findOne');
      expect(tasksService.getTaskById(1, mockUser)).resolves.toEqual(mockTask);
      expect(repoSpy).toBeCalledWith({ id: 1, user: mockUser });
    });

    it('should throw an error as task is not found', () => {
      jest
        .spyOn(taskRepository, 'findOne')
        .mockRejectedValueOnce(new NotFoundException());
      expect(tasksService.getTaskById(2, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
