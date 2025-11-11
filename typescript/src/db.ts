import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";

interface DBConfig {
	host: string;
	port: number;
	database: string;
	user: string;
	password: string;
	max?: number;
	idleTimeoutMillis?: number;
	connectionTimeoutMillis?: number;
}

interface QueryParams {
	[key: string]: any;
}

interface TransactionCallback {
	(client: PoolClient): Promise<any>;
}

class PostgresWrapper {
	private pool: Pool | null = null;
	private isConnected: boolean = false;

	/**
	 * Initialisiert die Datenbankverbindung
	 */
	public async initialize(config: DBConfig): Promise<boolean> {
		try {
			this.pool = new Pool({
				host: config.host,
				port: config.port,
				database: config.database,
				user: config.user,
				password: config.password,
				max: config.max || 20,
				idleTimeoutMillis: config.idleTimeoutMillis || 30000,
				connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
			});

			// Test connection
			const client = await this.pool.connect();
			await client.query("SELECT NOW()");
			client.release();

			this.isConnected = true;
			console.log("^2[Noverna-Database]^7 PostgreSQL connection established successfully");
			return true;
		} catch (error) {
			console.error("^1[Noverna-Database]^7 Failed to connect to PostgreSQL:", error);
			this.isConnected = false;
			return false;
		}
	}

	/**
	 * Prüft ob die Verbindung aktiv ist
	 */
	public isReady(): boolean {
		return this.isConnected && this.pool !== null;
	}

	/**
	 * Bereitet einen Query mit Named Parameters vor
	 * Konvertiert :param zu $1, $2, etc.
	 */
	private prepareQuery(query: string, params?: QueryParams): { text: string; values: any[] } {
		if (!params || Object.keys(params).length === 0) {
			return { text: query, values: [] };
		}

		const values: any[] = [];
		let paramIndex = 1;
		const paramMap = new Map<string, number>();

		const text = query.replace(/:(\w+)/g, (match, paramName) => {
			if (!paramMap.has(paramName)) {
				paramMap.set(paramName, paramIndex++);
				values.push(params[paramName]);
			}
			return `$${paramMap.get(paramName)}`;
		});

		return { text, values };
	}

	/**
	 * Führt einen Query aus und gibt alle Zeilen zurück
	 */
	public async query<T extends QueryResultRow = any>(query: string, params?: QueryParams): Promise<T[]> {
		if (!this.isReady()) {
			throw new Error("Database is not connected");
		}

		try {
			const prepared = this.prepareQuery(query, params);
			const result: QueryResult<T> = await this.pool!.query(prepared.text, prepared.values);
			return result.rows;
		} catch (error) {
			console.error("^1[Noverna-Database]^7 Query error:", error);
			console.error("Query:", query);
			console.error("Params:", params);
			throw error;
		}
	}

	/**
	 * Führt einen Query aus und gibt nur die erste Zeile zurück
	 */
	public async single<T extends QueryResultRow = any>(query: string, params?: QueryParams): Promise<T | null> {
		const results = await this.query<T>(query, params);
		return results.length > 0 ? results[0] : null;
	}

	/**
	 * Führt einen Query aus und gibt einen einzelnen Wert zurück
	 */
	public async scalar<T = any>(query: string, params?: QueryParams): Promise<T | null> {
		const result = await this.single(query, params);
		if (!result) return null;

		const keys = Object.keys(result);
		return keys.length > 0 ? (result[keys[0]] as T) : null;
	}

	/**
	 * Führt einen INSERT/UPDATE/DELETE Query aus
	 */
	public async execute(query: string, params?: QueryParams): Promise<number> {
		if (!this.isReady()) {
			throw new Error("Database is not connected");
		}

		try {
			const prepared = this.prepareQuery(query, params);
			const result = await this.pool!.query(prepared.text, prepared.values);
			return result.rowCount || 0;
		} catch (error) {
			console.error("^1[Noverna-Database]^7 Execute error:", error);
			console.error("Query:", query);
			console.error("Params:", params);
			throw error;
		}
	}

	/**
	 * Führt einen INSERT aus und gibt die ID zurück
	 */
	public async insert(query: string, params?: QueryParams): Promise<number | string | null> {
		// Füge RETURNING id hinzu wenn nicht vorhanden
		if (!query.toLowerCase().includes("returning")) {
			query += " RETURNING id";
		}

		const result = await this.single<{ id: number | string }>(query, params);
		return result ? result.id : null;
	}

	/**
	 * Führt einen UPDATE aus und gibt die Anzahl betroffener Zeilen zurück
	 */
	public async update(query: string, params?: QueryParams): Promise<number> {
		return await this.execute(query, params);
	}

	/**
	 * Batch Insert - Fügt mehrere Zeilen auf einmal ein
	 */
	public async insertBatch(table: string, columns: string[], values: any[][]): Promise<number> {
		if (!this.isReady()) {
			throw new Error("Database is not connected");
		}

		if (values.length === 0) return 0;

		try {
			const placeholders = values
				.map((_, rowIndex) => {
					const rowPlaceholders = columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(", ");
					return `(${rowPlaceholders})`;
				})
				.join(", ");

			const query = `INSERT INTO ${table} (${columns.join(", ")}) VALUES ${placeholders}`;
			const flatValues = values.flat();

			const result = await this.pool!.query(query, flatValues);
			return result.rowCount || 0;
		} catch (error) {
			console.error("^1[Noverna-Database]^7 Batch insert error:", error);
			throw error;
		}
	}

	/**
	 * Führt eine Transaction aus
	 */
	public async transaction<T>(callback: TransactionCallback): Promise<T> {
		if (!this.isReady()) {
			throw new Error("Database is not connected");
		}

		const client = await this.pool!.connect();

		try {
			await client.query("BEGIN");
			const result = await callback(client);
			await client.query("COMMIT");
			return result;
		} catch (error) {
			await client.query("ROLLBACK");
			console.error("^1[Noverna-Database]^7 Transaction error:", error);
			throw error;
		} finally {
			client.release();
		}
	}

	/**
	 * Prepared Statement - für häufig ausgeführte Queries
	 */
	public async prepare(name: string, query: string, params?: QueryParams): Promise<any[]> {
		if (!this.isReady()) {
			throw new Error("Database is not connected");
		}

		try {
			const prepared = this.prepareQuery(query, params);
			const result = await this.pool!.query({
				name: name,
				text: prepared.text,
				values: prepared.values,
			});
			return result.rows;
		} catch (error) {
			console.error("^1[Noverna-Database]^7 Prepared statement error:", error);
			throw error;
		}
	}

	/**
	 * Raw Query - für komplexe Queries ohne Parameter-Verarbeitung
	 */
	public async rawQuery<T extends QueryResultRow = any>(query: string, values?: any[]): Promise<T[]> {
		if (!this.isReady()) {
			throw new Error("Database is not connected");
		}

		try {
			const result: QueryResult<T> = await this.pool!.query(query, values);
			return result.rows;
		} catch (error) {
			console.error("^1[Noverna-Database]^7 Raw query error:", error);
			throw error;
		}
	}

	/**
	 * Schließt die Datenbankverbindung
	 */
	public async close(): Promise<void> {
		if (this.pool) {
			await this.pool.end();
			this.isConnected = false;
			console.log("^3[Noverna-Database]^7 PostgreSQL connection closed");
		}
	}

	/**
	 * Prüft ob eine Tabelle existiert
	 */
	public async tableExists(tableName: string): Promise<boolean> {
		const result = await this.scalar<number>(`SELECT COUNT(*) FROM information_schema.tables WHERE table_name = :tableName`, { tableName });
		return (result || 0) > 0;
	}

	/**
	 * Gibt Informationen über den Pool zurück
	 */
	public getPoolInfo() {
		if (!this.pool) return null;

		return {
			totalCount: this.pool.totalCount,
			idleCount: this.pool.idleCount,
			waitingCount: this.pool.waitingCount,
		};
	}
}

const db = new PostgresWrapper();
export { db };
export type { DBConfig, QueryParams, TransactionCallback };
