import postgres, { type Sql } from 'postgres';

type QueryResult<T> = { results: T[] };

let client: Sql | null = null;

function connection() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL não foi configurada no servidor.');
  client ??= postgres(url, {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    ssl: 'require',
  });
  return client;
}

class Statement {
  values: unknown[] = [];
  readonly query: string;

  constructor(text: string) {
    let parameter = 0;
    this.query = text.replace(/\?/g, () => `$${++parameter}`);
  }

  bind(...values: unknown[]) {
    this.values = values;
    return this;
  }

  async first<T>() {
    const rows = await this.execute(connection());
    return (rows[0] as T | undefined) ?? null;
  }

  async all<T>(): Promise<QueryResult<T>> {
    const rows = await this.execute(connection());
    return { results: rows as unknown as T[] };
  }

  async run() {
    await this.execute(connection());
    return { success: true };
  }

  execute(sql: Sql) {
    return sql.unsafe(this.query, this.values as never[]);
  }
}

export const db = {
  get available() {
    return Boolean(process.env.DATABASE_URL);
  },
  prepare(text: string) {
    return new Statement(text);
  },
  async batch(statements: Statement[]) {
    return connection().begin(async sql => {
      const results = [];
      for (const statement of statements) results.push(await sql.unsafe(statement.query, statement.values as never[]));
      return results;
    });
  },
};
