import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth/auth.service';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const mockUser = new User({
  email: 'truongtrongtin0305@gmail.com',
  password: 'password1',
  firstName: 'Tin',
  lastName: 'Truong',
});

const mockUsers = [
  mockUser,
  new User({
    email: 'another@gmail.com',
    password: 'another_password',
    firstName: 'another_firstname',
    lastName: 'another_lastName',
  }),
];

const mockUserService = {
  getAll: jest.fn().mockResolvedValue(mockUsers),
  findByEmail: jest.fn().mockImplementation((email: string) => {
    return Promise.resolve(mockUsers.find((user) => user.email === email));
  }),
  deleteOneById: jest.fn().mockResolvedValue(undefined),
};

describe('UsersController', () => {
  let usersController: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUserService,
        },
        {
          provide: AuthService,
          useValue: {},
        },
        {
          provide: ConfigService,
          useValue: {},
        },
      ],
    }).compile();

    usersController = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(usersController).toBeDefined();
  });

  describe('get all users', () => {
    it('should get an array of cats', async () => {
      await expect(usersController.getAll()).resolves.toEqual(mockUsers);
    });
  });
  describe('get user by email', () => {
    it('should get a single user matched with email', async () => {
      await expect(usersController.getByEmail(mockUser.email)).resolves.toEqual(
        mockUser,
      );
    });
  });
  describe('delete user by id', () => {
    it('should get nothing', async () => {
      await expect(
        usersController.delete(mockUser.id),
      ).resolves.toBeUndefined();
    });
  });
});
