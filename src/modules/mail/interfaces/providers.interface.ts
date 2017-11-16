export interface ImailProviders {
  provide: string;
  useFactory: () => Promise<any>;
}