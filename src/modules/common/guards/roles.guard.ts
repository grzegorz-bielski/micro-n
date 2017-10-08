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
    console.log('guard', roles);

    if (!roles) {
      return true;
    }
    const requestRoles = request.roles;

    return requestRoles && this.hasRole(requestRoles, roles);
  }

  private hasRole(requestRoles: string[], routeRoles: string[]) {
    return !!requestRoles.find(requestRole => (
      !!routeRoles.find(routeRole => (
        requestRole === routeRole
    ))));

  }
}