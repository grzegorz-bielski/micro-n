export interface Iparsed {
  type: string;
  username: string;
  password: string;
  host: string;
  port: number;
  database: string;
}

export interface IConnectionStringParser extends Iparsed {
  all: Iparsed;
}

export class ConnectionStringParser implements IConnectionStringParser {
  private readonly pattern: RegExp = /^(.*?):\/\/(.*?):(.*?)@(.*?):(\d+)\/(.*?)$/;
  private parsed: Iparsed;

  constructor(connectionString: string) {
    const matched = connectionString.match(this.pattern);
    this.parsed = {
      type: matched[1],
      username: matched[2],
      password: matched[3],
      host: matched[4],
      port: parseInt(matched[5], 10),
      database: matched[6],
    };
  }

  get type(): string {
    return this.parsed.type;
  }

  get username(): string {
    return this.parsed.username;
  }

  get password(): string {
    return this.parsed.password;
  }

  get host(): string {
    return this.parsed.host;
  }

  get port(): number {
    return this.parsed.port;
  }

  get database(): string {
    return this.parsed.database;
  }

  get all(): Iparsed {
    return this.parsed;
  }
}
