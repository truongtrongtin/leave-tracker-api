import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthService } from 'auth/auth.service';
import { UsersService } from 'users/users.service';

@Injectable()
export class JwtGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private userService: UsersService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    try {
      const req = context.switchToHttp().getRequest();
      const authHeader = req.headers['authorization'];
      const token = authHeader.split(' ')[1];
      const { email } = this.authService.verifyJwt(token);
      const user = this.userService.findByEmail(email);
      if (!user) {
        return false;
      }
      req.user = user;
      return true;
    } catch (e) {
      return false;
    }
  }
}
