export interface IdatabaseProviders {
  provide: string;
  useFactory: () => Promise<any>;
}