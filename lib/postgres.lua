if not LoadResourceFile(GetCurrentResourceName(), "typescript/dist/index.js") then
	error('^1[Noverna-Database]^7 TypeScript build not found. Please build the TypeScript source before using this resource.')
end

---@class Postgres
---@field private resourceName string
local Postgres = {}
Postgres.__index = Postgres

-- Initialisierung
function Postgres:new()
    local self = setmetatable({}, Postgres)
    self.resourceName = 'noverna-database'
    return self
end

---Prüft ob die Datenbank bereit ist
---@return boolean
function Postgres:isReady()
    return exports[self.resourceName]:isReady()
end

---Wartet bis die Datenbank bereit ist
---@param timeout number? Timeout in Millisekunden (Standard: 10000)
---@return boolean success
function Postgres:awaitReady(timeout)
    timeout = timeout or 10000
    local start = GetGameTimer()

    while not self:isReady() do
        if GetGameTimer() - start > timeout then
            print('^1[Noverna-Database]^7 Timeout waiting for database connection')
            return false
        end
        Wait(100)
    end

    return true
end

---Führt einen Query aus und gibt alle Zeilen zurück
---@param query string SQL Query mit Named Parameters (:param)
---@param params table<string, any>? Parameter für den Query
---@return table[]? Ergebnis-Zeilen oder nil bei Fehler
---@async
function Postgres:query(query, params)
    return exports[self.resourceName]:query(query, params)
end

---Führt einen Query aus und gibt nur die erste Zeile zurück
---@param query string SQL Query mit Named Parameters (:param)
---@param params table<string, any>? Parameter für den Query
---@return table? Erste Zeile oder nil
---@async
function Postgres:single(query, params)
    return exports[self.resourceName]:single(query, params)
end

---Führt einen Query aus und gibt einen einzelnen Wert zurück
---@param query string SQL Query mit Named Parameters (:param)
---@param params table<string, any>? Parameter für den Query
---@return any? Einzelner Wert oder nil
---@async
function Postgres:scalar(query, params)
    return exports[self.resourceName]:scalar(query, params)
end

---Führt einen INSERT/UPDATE/DELETE Query aus
---@param query string SQL Query mit Named Parameters (:param)
---@param params table<string, any>? Parameter für den Query
---@return number Anzahl betroffener Zeilen
---@async
function Postgres:execute(query, params)
    return exports[self.resourceName]:execute(query, params)
end

---Führt einen INSERT aus und gibt die ID zurück
---@param query string SQL Query mit Named Parameters (:param)
---@param params table<string, any>? Parameter für den Query
---@return number|string? ID des eingefügten Eintrags oder nil
---@async
function Postgres:insert(query, params)
    return exports[self.resourceName]:insert(query, params)
end

---Führt einen UPDATE aus und gibt die Anzahl betroffener Zeilen zurück
---@param query string SQL Query mit Named Parameters (:param)
---@param params table<string, any>? Parameter für den Query
---@return number Anzahl betroffener Zeilen
---@async
function Postgres:update(query, params)
    return exports[self.resourceName]:update(query, params)
end

---Führt eine Transaction aus
---@param callback fun(client: any): any Callback-Funktion
---@return any? Ergebnis der Callback-Funktion oder nil bei Fehler
---@async
function Postgres:transaction(callback)
    return exports[self.resourceName]:transaction(callback)
end

---Batch Insert - Fügt mehrere Zeilen auf einmal ein
---@param table string Tabellenname
---@param columns string[] Spaltennamen
---@param values any[][] Werte für die Zeilen
---@return number Anzahl eingefügter Zeilen
---@async
function Postgres:insertBatch(table, columns, values)
    return exports[self.resourceName]:insertBatch(table, columns, values)
end

---Raw Query - für komplexe Queries ohne Parameter-Verarbeitung
---@param query string SQL Query
---@param values any[]? Parameter-Array ($1, $2, etc.)
---@return table[]? Ergebnis-Zeilen oder nil bei Fehler
---@async
function Postgres:rawQuery(query, values)
    return exports[self.resourceName]:rawQuery(query, values)
end

---Prüft ob eine Tabelle existiert
---@param tableName string Name der Tabelle
---@return boolean Existiert die Tabelle?
---@async
function Postgres:tableExists(tableName)
    return exports[self.resourceName]:tableExists(tableName)
end

---Gibt Informationen über den Connection Pool zurück
---@return table? Pool-Informationen oder nil
function Postgres:getPoolInfo()
    return exports[self.resourceName]:getPoolInfo()
end

-- Erstelle globale Instanz
local instance = Postgres:new()

-- Exportiere sowohl die Klasse als auch die Instanz
_G.Postgres = Postgres
_G.postgres = instance

return instance
