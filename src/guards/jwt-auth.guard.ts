import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UsersService } from '../users/users.service';
import { AuthService } from '../auth/auth.service';

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
      const payload: TokenPayload = this.authService.verifyAccessToken(token);
      const user = this.userService.findById(payload.id);
      req.user = user;
      return true;
    } catch (e) {
      return false;
    }
  }
}
