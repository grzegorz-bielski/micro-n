import { Guard, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
// import { Observable } from 'rxjs/Observable';

@Guard()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  public canActivate(request, context: ExecutionContext): boolean {
    // parrent -> Class which handler belongs to
    // handler -> reference to route handler function
    const { handler } = context;
    const roles = this.reflector.get<string[]>('roles', handler);
    console.log('guard', roles);
    if (!roles) {
      return true;
    }

    const user = request.user;
    console.log('user roles', user.roles);
    // console.log('guard', user, this.hasRole(user.roles, roles));
    return user && user.roles && this.hasRole(user.roles, roles);
  }

  private hasRole(userRoles: string[], routeRoles: string[]) {
    return !!userRoles.find(userRole => (
      !!routeRoles.find(routeRole => (
        userRole === routeRole
    ))));

  }
}