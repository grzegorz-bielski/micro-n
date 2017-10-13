export interface IdatabaseProviders {
  provide: symbol;
  useFactory: () => Promise<any>;
}