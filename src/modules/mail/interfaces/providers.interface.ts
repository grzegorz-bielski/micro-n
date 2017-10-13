export interface ImailProviders {
  provide: symbol;
  useFactory: () => Promise<any>;
}