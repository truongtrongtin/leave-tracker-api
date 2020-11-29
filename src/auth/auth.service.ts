import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SignUpDto } from 'auth/dto/sign-up.dto';
import { User } from 'users/user.entity';
import { UsersService } from 'users/users.service';
import { SignInDto } from './dto/sign-in.dto';
import { TokenDto } from './dto/token.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<User> {
    return await this.userService.create(signUpDto);
  }

  async signIn(signInDto: SignInDto): Promise<TokenDto> {
    const { email, password } = signInDto;
    const user = await this.userService.findByEmail(email);
    const isRightPassword = await user.checkPassword(password);
    if (!isRightPassword) {
      throw new BadRequestException(`Wrong password`);
    }
    const payload = { email: user.email };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
      expiresIn: `${process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME}s`,
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_TOKEN_SECRET,
      expiresIn: `${process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME}s`,
    });
    return { accessToken, refreshToken };
  }

  verifyJwt(payload: string): { email: string } {
    const jwt = this.jwtService.verify(payload, {
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
    });
    return { email: jwt.email };
  }
}
