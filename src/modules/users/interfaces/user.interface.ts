export interface User {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly roles: string[];
  readonly description: string;
}