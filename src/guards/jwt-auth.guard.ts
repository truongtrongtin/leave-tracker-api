import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    try {
      const req = context.switchToHttp().getRequest();
      const token = req.cookies['Authentication'];
      if (!token) return false;
      const payload = this.authService.verifyAccessToken(token);
      req.user = payload;
      return true;
    } catch (e) {
      return false;
    }
  }
}
