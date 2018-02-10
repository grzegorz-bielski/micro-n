import { Guard, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Guard()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  public canActivate(request, context: ExecutionContext): boolean {
    // parrent -> Class which handler belongs to
    // handler -> reference to route handler function
    const { handler } = context;
    const roles = this.reflector.get<string[]>('roles', handler);

    if (!roles) {
      return true;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Guard activated: ', roles);
    }

    return request.user.roles && this.hasRole(request.user.roles, roles);
  }

  private hasRole(requestRoles: string[], routeRoles: string[]) {
    return !!requestRoles.find(requestRole => (
      !!routeRoles.find(routeRole => (
        requestRole === routeRole
    ))));

  }
}