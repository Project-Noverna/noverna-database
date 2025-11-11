import { db } from "./db";
import type { QueryParams } from "./db";

// Lade Konfiguration
const config = {
	host: GetConvar("noverna_db_host", "localhost"),
	port: parseInt(GetConvar("noverna_db_port", "5432")),
	database: GetConvar("noverna_db_name", "noverna"),
	user: GetConvar("noverna_db_user", "postgres"),
	password: GetConvar("noverna_db_password", ""),
	max: parseInt(GetConvar("noverna_db_max_connections", "20")),
	idleTimeoutMillis: parseInt(GetConvar("noverna_db_idle_timeout", "30000")),
	connectionTimeoutMillis: parseInt(GetConvar("noverna_db_connection_timeout", "2000")),
};

// Initialisiere Datenbank beim Start
setImmediate(async () => {
	const success = await db.initialize(config);
	if (!success) {
		console.error("^1[Noverna-Database]^7 Failed to initialize database. Please check your configuration.");
	}
});

// Export: query - Führt einen Query aus und gibt alle Zeilen zurück
global.exports("query", async (query: string, params?: QueryParams) => {
	try {
		return await db.query(query, params);
	} catch (error) {
		console.error("^1[Noverna-Database]^7 Export query error:", error);
		return null;
	}
});

// Export: single - Führt einen Query aus und gibt nur die erste Zeile zurück
global.exports("single", async (query: string, params?: QueryParams) => {
	try {
		return await db.single(query, params);
	} catch (error) {
		console.error("^1[Noverna-Database]^7 Export single error:", error);
		return null;
	}
});

// Export: scalar - Führt einen Query aus und gibt einen einzelnen Wert zurück
global.exports("scalar", async (query: string, params?: QueryParams) => {
	try {
		return await db.scalar(query, params);
	} catch (error) {
		console.error("^1[Noverna-Database]^7 Export scalar error:", error);
		return null;
	}
});

// Export: execute - Führt einen INSERT/UPDATE/DELETE Query aus
global.exports("execute", async (query: string, params?: QueryParams) => {
	try {
		return await db.execute(query, params);
	} catch (error) {
		console.error("^1[Noverna-Database]^7 Export execute error:", error);
		return 0;
	}
});

// Export: insert - Führt einen INSERT aus und gibt die ID zurück
global.exports("insert", async (query: string, params?: QueryParams) => {
	try {
		return await db.insert(query, params);
	} catch (error) {
		console.error("^1[Noverna-Database]^7 Export insert error:", error);
		return null;
	}
});

// Export: update - Führt einen UPDATE aus
global.exports("update", async (query: string, params?: QueryParams) => {
	try {
		return await db.update(query, params);
	} catch (error) {
		console.error("^1[Noverna-Database]^7 Export update error:", error);
		return 0;
	}
});

// Export: transaction - Führt eine Transaction aus
global.exports("transaction", async (callback: (client: any) => Promise<any>) => {
	try {
		return await db.transaction(callback);
	} catch (error) {
		console.error("^1[Noverna-Database]^7 Export transaction error:", error);
		return null;
	}
});

// Export: insertBatch - Batch Insert
global.exports("insertBatch", async (table: string, columns: string[], values: any[][]) => {
	try {
		return await db.insertBatch(table, columns, values);
	} catch (error) {
		console.error("^1[Noverna-Database]^7 Export insertBatch error:", error);
		return 0;
	}
});

// Export: rawQuery - Raw Query ohne Parameter-Verarbeitung
global.exports("rawQuery", async (query: string, values?: any[]) => {
	try {
		return await db.rawQuery(query, values);
	} catch (error) {
		console.error("^1[Noverna-Database]^7 Export rawQuery error:", error);
		return null;
	}
});

// Export: tableExists - Prüft ob eine Tabelle existiert
global.exports("tableExists", async (tableName: string) => {
	try {
		return await db.tableExists(tableName);
	} catch (error) {
		console.error("^1[Noverna-Database]^7 Export tableExists error:", error);
		return false;
	}
});

// Export: isReady - Prüft ob die Verbindung aktiv ist
global.exports("isReady", () => {
	return db.isReady();
});

// Export: getPoolInfo - Gibt Pool-Informationen zurück
global.exports("getPoolInfo", () => {
	return db.getPoolInfo();
}); // Export: single - Führt einen Query aus und gibt nur die erste Zeile zurück
exports("single", async (query: string, params?: QueryParams) => {
	try {
		return await db.single(query, params);
	} catch (error) {
		console.error("^1[Noverna-Database]^7 Export single error:", error);
		return null;
	}
});

// Export: scalar - Führt einen Query aus und gibt einen einzelnen Wert zurück
exports("scalar", async (query: string, params?: QueryParams) => {
	try {
		return await db.scalar(query, params);
	} catch (error) {
		console.error("^1[Noverna-Database]^7 Export scalar error:", error);
		return null;
	}
});

// Export: execute - Führt einen INSERT/UPDATE/DELETE Query aus
exports("execute", async (query: string, params?: QueryParams) => {
	try {
		return await db.execute(query, params);
	} catch (error) {
		console.error("^1[Noverna-Database]^7 Export execute error:", error);
		return 0;
	}
});

// Export: insert - Führt einen INSERT aus und gibt die ID zurück
exports("insert", async (query: string, params?: QueryParams) => {
	try {
		return await db.insert(query, params);
	} catch (error) {
		console.error("^1[Noverna-Database]^7 Export insert error:", error);
		return null;
	}
});

// Export: update - Führt einen UPDATE aus
exports("update", async (query: string, params?: QueryParams) => {
	try {
		return await db.update(query, params);
	} catch (error) {
		console.error("^1[Noverna-Database]^7 Export update error:", error);
		return 0;
	}
});

// Export: transaction - Führt eine Transaction aus
exports("transaction", async (callback: (client: any) => Promise<any>) => {
	try {
		return await db.transaction(callback);
	} catch (error) {
		console.error("^1[Noverna-Database]^7 Export transaction error:", error);
		return null;
	}
});

// Export: insertBatch - Batch Insert
exports("insertBatch", async (table: string, columns: string[], values: any[][]) => {
	try {
		return await db.insertBatch(table, columns, values);
	} catch (error) {
		console.error("^1[Noverna-Database]^7 Export insertBatch error:", error);
		return 0;
	}
});

// Export: rawQuery - Raw Query ohne Parameter-Verarbeitung
exports("rawQuery", async (query: string, values?: any[]) => {
	try {
		return await db.rawQuery(query, values);
	} catch (error) {
		console.error("^1[Noverna-Database]^7 Export rawQuery error:", error);
		return null;
	}
});

// Export: tableExists - Prüft ob eine Tabelle existiert
exports("tableExists", async (tableName: string) => {
	try {
		return await db.tableExists(tableName);
	} catch (error) {
		console.error("^1[Noverna-Database]^7 Export tableExists error:", error);
		return false;
	}
});

// Export: isReady - Prüft ob die Verbindung aktiv ist
exports("isReady", () => {
	return db.isReady();
});

// Export: getPoolInfo - Gibt Pool-Informationen zurück
exports("getPoolInfo", () => {
	return db.getPoolInfo();
});

// Cleanup beim Resource-Stop
on("onResourceStop", (resourceName: string) => {
	if (resourceName === GetCurrentResourceName()) {
		db.close();
	}
});
