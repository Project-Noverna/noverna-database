# Noverna PostgreSQL Database Wrapper

A modern PostgreSQL database wrapper for FiveM, similar to ox_mysql but designed for PostgreSQL.

## Features

-   ✅ TypeScript backend with full type support
-   ✅ Lua library for easy integration
-   ✅ Named parameters (`:param` syntax)
-   ✅ Connection pooling
-   ✅ Transactions support
-   ✅ Batch inserts
-   ✅ Prepared statements
-   ✅ Async/Await support

## Prerequisites

Before you start, make sure you have:

-   **Node.js** (version 16 or higher) - [Download here](https://nodejs.org/)
-   **PostgreSQL** database server - [Download here](https://www.postgresql.org/download/)
-   **FiveM server** (artifact 5848 or higher)

## Installation

### Step 1: Install Dependencies

Open your terminal/PowerShell and navigate to the TypeScript folder:

```bash
cd resources/noverna-database/typescript
npm install
```

**What this does:** Downloads all required Node.js packages (pg, esbuild, TypeScript, etc.)

### Step 2: Build the Project

Still in the same folder, run:

```bash
npm run build
```

**What this does:** Compiles the TypeScript code into JavaScript that FiveM can run.

**For Development:** If you're actively developing, use watch mode:

```bash
npm run watch
```

This will automatically rebuild whenever you change files.

### Step 3: Configure Your Database

Add these lines to your `server.cfg` file (usually in `server/data/server.cfg`):

```cfg
# PostgreSQL Database Configuration
set noverna_db_host "localhost"          # Your database server address
set noverna_db_port "5432"               # PostgreSQL port (default: 5432)
set noverna_db_name "noverna"            # Your database name
set noverna_db_user "postgres"           # Database username
set noverna_db_password "your_password"  # Database password
set noverna_db_max_connections "20"      # Maximum connection pool size

# Start the resource
ensure noverna-database
```

**Important:** Replace `your_password` with your actual PostgreSQL password!

### Step 4: Start Your Server

Start your FiveM server. You should see:

```
[Noverna-Database] PostgreSQL connection established successfully
```

If you see this, congratulations! The database wrapper is working. ✅

## Usage in Your Resources

There are two ways to use this database wrapper in your own resources:

### Method 1: Direct Exports (Simple)

This method is straightforward but more verbose.

**In your `fxmanifest.lua`:**

```lua
fx_version 'cerulean'
game 'gta5'

dependencies {
    'noverna-database'
}

server_scripts {
    'server/*.lua'
}
```

**In your server code:**

```lua
-- Query example
local result = exports['noverna-database']:query('SELECT * FROM users WHERE id = :id', {
    id = 1
})
```

### Method 2: Library Import (Recommended ⭐)

This method is cleaner and provides better IDE support.

**In your `fxmanifest.lua`:**

```lua
fx_version 'cerulean'
game 'gta5'
lua54 'yes'

dependencies {
    'noverna-database'
}

shared_scripts {
    '@noverna-database/lib/postgres.lua'  -- Import the library
}

server_scripts {
    'server/*.lua'
}
```

**In your server code:**

```lua
-- Wait for database connection on resource start
CreateThread(function()
    -- Wait up to 10 seconds for database to be ready
    if not postgres:awaitReady(10000) then
        print('Database not available!')
        return
    end

    print('Database is ready!')

    -- Now you can run queries
    local users = postgres:query('SELECT * FROM users')
    print('Found users:', #users)
end)
```

**Note:** The `postgres` object is globally available after importing the library!

## API Reference

### 🔍 query(query, params)

Executes a query and returns all rows.

**Parameters:**

-   `query` (string): SQL query with named parameters using `:param` syntax
-   `params` (table, optional): Table with parameter values

**Returns:** Array of row objects or `nil` on error

**Example:**

```lua
local users = postgres:query('SELECT * FROM users WHERE age > :age', {
    age = 18
})

for _, user in ipairs(users) do
    print(user.name, user.age)
end
```

---

### 📄 single(query, params)

Executes a query and returns only the first row.

**Parameters:**

-   `query` (string): SQL query with named parameters
-   `params` (table, optional): Table with parameter values

**Returns:** Single row object or `nil` if no results

**Example:**

```lua
local user = postgres:single('SELECT * FROM users WHERE id = :id', {
    id = 1
})

if user then
    print('Found user:', user.name)
else
    print('User not found')
end
```

---

### 🔢 scalar(query, params)

Executes a query and returns a single value (first column of first row).

**Parameters:**

-   `query` (string): SQL query
-   `params` (table, optional): Table with parameter values

**Returns:** Single value or `nil`

**Example:**

```lua
local count = postgres:scalar('SELECT COUNT(*) FROM users')
print('Total users:', count)

local userName = postgres:scalar('SELECT name FROM users WHERE id = :id', { id = 1 })
print('User name:', userName)
```

---

### ➕ insert(query, params)

Executes an INSERT query and returns the inserted row's ID.

**Parameters:**

-   `query` (string): INSERT query
-   `params` (table, optional): Table with parameter values

**Returns:** Inserted row ID (number/string) or `nil` on error

**Example:**

```lua
local userId = postgres:insert([[
    INSERT INTO users (name, age, email)
    VALUES (:name, :age, :email)
]], {
    name = 'John Doe',
    age = 25,
    email = 'john@example.com'
})

print('New user ID:', userId)
```

**Note:** Automatically adds `RETURNING id` if not present in your query.

---

### ✏️ update(query, params)

Executes an UPDATE query and returns the number of affected rows.

**Parameters:**

-   `query` (string): UPDATE query
-   `params` (table, optional): Table with parameter values

**Returns:** Number of affected rows

**Example:**

```lua
local affected = postgres:update([[
    UPDATE users
    SET age = :age
    WHERE id = :id
]], {
    age = 26,
    id = 1
})

print('Updated rows:', affected)
```

---

### ⚡ execute(query, params)

Executes any query (INSERT/UPDATE/DELETE) and returns affected row count.

**Parameters:**

-   `query` (string): SQL query
-   `params` (table, optional): Table with parameter values

**Returns:** Number of affected rows

**Example:**

```lua
local affected = postgres:execute('DELETE FROM users WHERE age < :age', {
    age = 18
})

print('Deleted rows:', affected)
```

---

### 🔄 transaction(callback)

Executes multiple queries in a database transaction (all-or-nothing).

**Parameters:**

-   `callback` (function): Function that receives a client object for queries

**Returns:** Result of callback function or `nil` on error

**Example:**

```lua
-- Transfer money between accounts (atomic operation)
local success = postgres:transaction(function(client)
    -- Subtract from account 1
    client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', {100, 1})

    -- Add to account 2
    client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', {100, 2})

    return true
end)

if success then
    print('Transfer successful!')
else
    print('Transfer failed - rolled back')
end
```

**Important:** If any query fails, ALL changes are rolled back automatically.

---

### 📦 insertBatch(table, columns, values)

Inserts multiple rows in a single query (much faster than individual inserts).

**Parameters:**

-   `table` (string): Table name
-   `columns` (array): Column names
-   `values` (array of arrays): Values for each row

**Returns:** Number of inserted rows

**Example:**

```lua
local count = postgres:insertBatch('users',
    {'name', 'age', 'email'},
    {
        {'Alice', 20, 'alice@test.com'},
        {'Bob', 25, 'bob@test.com'},
        {'Charlie', 30, 'charlie@test.com'}
    }
)

print('Inserted rows:', count)
```

---

### 🔧 rawQuery(query, values)

Executes a raw query using PostgreSQL's `$1, $2` parameter syntax (without named parameters).

**Parameters:**

-   `query` (string): SQL query with `$1, $2, $3` placeholders
-   `values` (array, optional): Parameter values

**Returns:** Array of rows or `nil` on error

**Example:**

```lua
local results = postgres:rawQuery('SELECT * FROM users WHERE id = $1 OR id = $2', {1, 2})
```

**When to use:** For complex queries or when you need exact PostgreSQL syntax.

---

### 🔍 tableExists(tableName)

Checks if a table exists in the database.

**Parameters:**

-   `tableName` (string): Name of the table to check

**Returns:** `true` if table exists, `false` otherwise

**Example:**

```lua
if postgres:tableExists('users') then
    print('Users table exists')
else
    print('Creating users table...')
    postgres:execute([[
        CREATE TABLE users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            age INTEGER
        )
    ]])
end
```

---

### ✅ isReady()

Checks if the database connection is active.

**Returns:** `true` if connected, `false` otherwise

**Example:**

```lua
if postgres:isReady() then
    print('Database is ready!')
else
    print('Database not connected')
end
```

---

### ⏳ awaitReady(timeout)

Waits for the database connection to be ready (blocking).

**Parameters:**

-   `timeout` (number, optional): Timeout in milliseconds (default: 10000)

**Returns:** `true` if ready, `false` on timeout

**Example:**

```lua
CreateThread(function()
    if postgres:awaitReady(5000) then
        print('Database ready!')
        -- Start your code here
    else
        print('Database connection timeout!')
    end
end)
```

**Use this:** At resource startup to ensure database is ready before running queries.

---

### 📊 getPoolInfo()

Returns information about the connection pool status.

**Returns:** Table with pool statistics

**Example:**

```lua
local info = postgres:getPoolInfo()
print('Total connections:', info.totalCount)
print('Idle connections:', info.idleCount)
print('Waiting clients:', info.waitingCount)
```

**Use this:** For debugging connection pool issues or monitoring database load.

## Complete Examples

### Example 1: User Management System

Create a complete user management system with commands.

```lua
-- Wait for database to be ready
CreateThread(function()
    if not postgres:awaitReady() then
        error('Database connection failed!')
        return
    end

    -- Create users table if it doesn't exist
    if not postgres:tableExists('users') then
        print('Creating users table...')
        postgres:execute([[
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                identifier VARCHAR(50) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                age INTEGER DEFAULT 18,
                money INTEGER DEFAULT 5000,
                created_at TIMESTAMP DEFAULT NOW()
            )
        ]])
        print('Users table created!')
    end
end)

-- Command: Create a user
RegisterCommand('createuser', function(source, args)
    local name = args[1]
    local age = tonumber(args[2]) or 18

    if not name then
        print('Usage: /createuser <name> [age]')
        return
    end

    -- Insert user and get their ID
    local userId = postgres:insert([[
        INSERT INTO users (identifier, name, age, money)
        VALUES (:identifier, :name, :age, :money)
    ]], {
        identifier = 'user_' .. os.time(),
        name = name,
        age = age,
        money = 5000
    })

    if userId then
        print('Created user with ID:', userId)

        -- Fetch the created user
        local user = postgres:single('SELECT * FROM users WHERE id = :id', {
            id = userId
        })

        print('User data:', json.encode(user, {indent = true}))
    else
        print('Failed to create user')
    end
end, true)

-- Command: Get user info
RegisterCommand('getuser', function(source, args)
    local userId = tonumber(args[1])

    if not userId then
        print('Usage: /getuser <id>')
        return
    end

    local user = postgres:single('SELECT * FROM users WHERE id = :id', {
        id = userId
    })

    if user then
        print(string.format('User #%d: %s (Age: %d, Money: $%d)',
            user.id, user.name, user.age, user.money))
    else
        print('User not found')
    end
end, true)

-- Command: List all users
RegisterCommand('listusers', function(source, args)
    local users = postgres:query('SELECT * FROM users ORDER BY id')

    print(string.format('Found %d users:', #users))
    for _, user in ipairs(users) do
        print(string.format('  #%d: %s (Age: %d)', user.id, user.name, user.age))
    end
end, true)
```

---

### Example 2: Inventory System

A complete inventory system with item management.

```lua
-- Initialize inventory tables
CreateThread(function()
    if not postgres:awaitReady() then return end

    -- Create items table
    if not postgres:tableExists('items') then
        postgres:execute([[
            CREATE TABLE items (
                name VARCHAR(50) PRIMARY KEY,
                label VARCHAR(100) NOT NULL,
                weight DECIMAL(5,2) DEFAULT 0.0,
                stackable BOOLEAN DEFAULT true
            )
        ]])

        -- Add some default items
        postgres:insertBatch('items',
            {'name', 'label', 'weight', 'stackable'},
            {
                {'water', 'Water Bottle', 0.5, true},
                {'bread', 'Bread', 0.3, true},
                {'phone', 'Phone', 0.2, false}
            }
        )
    end

    -- Create inventory table
    if not postgres:tableExists('inventory') then
        postgres:execute([[
            CREATE TABLE inventory (
                id SERIAL PRIMARY KEY,
                identifier VARCHAR(50) NOT NULL,
                item_name VARCHAR(50) NOT NULL,
                count INTEGER DEFAULT 1,
                FOREIGN KEY (item_name) REFERENCES items(name),
                UNIQUE(identifier, item_name)
            )
        ]])

        -- Create index for faster lookups
        postgres:execute([[
            CREATE INDEX idx_inventory_identifier ON inventory(identifier)
        ]])
    end
end)

-- Get player's inventory
function GetPlayerInventory(identifier)
    return postgres:query([[
        SELECT
            i.id,
            i.item_name,
            i.count,
            it.label,
            it.weight,
            it.stackable
        FROM inventory i
        JOIN items it ON i.item_name = it.name
        WHERE i.identifier = :identifier
        ORDER BY it.label
    ]], {
        identifier = identifier
    })
end

-- Add item to inventory
function AddItem(identifier, itemName, count)
    count = count or 1

    -- Check if item exists in items table
    local item = postgres:single('SELECT * FROM items WHERE name = :name', {
        name = itemName
    })

    if not item then
        print('Item does not exist:', itemName)
        return false
    end

    -- Check if player already has this item
    local existing = postgres:single([[
        SELECT * FROM inventory
        WHERE identifier = :identifier AND item_name = :item
    ]], {
        identifier = identifier,
        item = itemName
    })

    if existing then
        -- Update count if stackable
        if item.stackable then
            postgres:update([[
                UPDATE inventory
                SET count = count + :count
                WHERE id = :id
            ]], {
                count = count,
                id = existing.id
            })
            print(string.format('Added %dx %s (now has %d)', count, item.label, existing.count + count))
        else
            print('Item is not stackable!')
            return false
        end
    else
        -- Insert new item
        postgres:insert([[
            INSERT INTO inventory (identifier, item_name, count)
            VALUES (:identifier, :item, :count)
        ]], {
            identifier = identifier,
            item = itemName,
            count = count
        })
        print(string.format('Added %dx %s', count, item.label))
    end

    return true
end

-- Remove item from inventory
function RemoveItem(identifier, itemName, count)
    count = count or 1

    local existing = postgres:single([[
        SELECT * FROM inventory
        WHERE identifier = :identifier AND item_name = :item
    ]], {
        identifier = identifier,
        item = itemName
    })

    if not existing then
        print('Player does not have this item')
        return false
    end

    if existing.count < count then
        print('Not enough items')
        return false
    end

    if existing.count == count then
        -- Remove completely
        postgres:execute('DELETE FROM inventory WHERE id = :id', {
            id = existing.id
        })
    else
        -- Decrease count
        postgres:update([[
            UPDATE inventory
            SET count = count - :count
            WHERE id = :id
        ]], {
            count = count,
            id = existing.id
        })
    end

    return true
end

-- Commands
RegisterCommand('inventory', function(source, args)
    local identifier = 'player_' .. source
    local inventory = GetPlayerInventory(identifier)

    if #inventory == 0 then
        print('Inventory is empty')
        return
    end

    print('=== Inventory ===')
    for _, item in ipairs(inventory) do
        print(string.format('%dx %s (%.1fkg)', item.count, item.label, item.weight))
    end
end, false)

RegisterCommand('giveitem', function(source, args)
    local itemName = args[1]
    local count = tonumber(args[2]) or 1

    if not itemName then
        print('Usage: /giveitem <item> [count]')
        return
    end

    local identifier = 'player_' .. source
    AddItem(identifier, itemName, count)
end, false)
```

---

### Example 3: Server Statistics Dashboard

Real-time server statistics with caching.

```lua
local statsCache = {
    data = nil,
    lastUpdate = 0,
    cacheDuration = 60000 -- 1 minute
}

function GetServerStats()
    local now = GetGameTimer()

    -- Return cached data if still valid
    if statsCache.data and (now - statsCache.lastUpdate) < statsCache.cacheDuration then
        return statsCache.data
    end

    -- Fetch fresh stats
    local stats = {
        totalUsers = postgres:scalar('SELECT COUNT(*) FROM users') or 0,
        activeUsers = postgres:scalar([[
            SELECT COUNT(*) FROM users
            WHERE last_login > NOW() - INTERVAL '7 days'
        ]]) or 0,
        newUsersToday = postgres:scalar([[
            SELECT COUNT(*) FROM users
            WHERE created_at > CURRENT_DATE
        ]]) or 0,
        totalMoney = postgres:scalar('SELECT SUM(money + bank) FROM users') or 0,
        avgAge = postgres:scalar('SELECT AVG(age) FROM users') or 0,
        poolInfo = postgres:getPoolInfo()
    }

    -- Cache the results
    statsCache.data = stats
    statsCache.lastUpdate = now

    return stats
end

-- Command to display stats
RegisterCommand('stats', function()
    local stats = GetServerStats()

    print('╔════════════════════════════════════╗')
    print('║       Server Statistics            ║')
    print('╠════════════════════════════════════╣')
    print(string.format('║ Total Users:         %12d ║', stats.totalUsers))
    print(string.format('║ Active Users (7d):   %12d ║', stats.activeUsers))
    print(string.format('║ New Users Today:     %12d ║', stats.newUsersToday))
    print(string.format('║ Total Money:      $%13d ║', stats.totalMoney))
    print(string.format('║ Average Age:         %12.1f ║', stats.avgAge))
    print('╠════════════════════════════════════╣')
    print('║       Database Pool                ║')
    print('╠════════════════════════════════════╣')
    print(string.format('║ Total Connections:   %12d ║', stats.poolInfo.totalCount))
    print(string.format('║ Idle Connections:    %12d ║', stats.poolInfo.idleCount))
    print(string.format('║ Waiting Clients:     %12d ║', stats.poolInfo.waitingCount))
    print('╚════════════════════════════════════╝')
end, true)

-- Auto-update stats every 5 minutes
CreateThread(function()
    while true do
        Wait(300000) -- 5 minutes
        GetServerStats() -- This will update the cache
    end
end)
```

## Performance Tips 🚀

### 1. Use Batch Inserts

When inserting multiple rows, use `insertBatch` instead of multiple `insert` calls:

```lua
-- ❌ Slow (3 queries)
for i = 1, 3 do
    postgres:insert('INSERT INTO users (name) VALUES (:name)', { name = 'User ' .. i })
end

-- ✅ Fast (1 query)
postgres:insertBatch('users', {'name'}, {
    {'User 1'},
    {'User 2'},
    {'User 3'}
})
```

### 2. Use Transactions for Multiple Operations

Group related queries in a transaction:

```lua
-- ❌ Without transaction (can leave data inconsistent if one fails)
postgres:execute('UPDATE accounts SET balance = balance - 100 WHERE id = 1')
postgres:execute('UPDATE accounts SET balance = balance + 100 WHERE id = 2')

-- ✅ With transaction (all-or-nothing)
postgres:transaction(function(client)
    client.query('UPDATE accounts SET balance = balance - $1 WHERE id = $2', {100, 1})
    client.query('UPDATE accounts SET balance = balance + $1 WHERE id = $2', {100, 2})
end)
```

### 3. Cache Frequently-Used Data

Don't query the database for data that rarely changes:

```lua
local itemCache = {}

function GetItem(itemName)
    -- Check cache first
    if itemCache[itemName] then
        return itemCache[itemName]
    end

    -- Query database
    local item = postgres:single('SELECT * FROM items WHERE name = :name', {
        name = itemName
    })

    -- Cache for future use
    if item then
        itemCache[itemName] = item
    end

    return item
end
```

### 4. Use Indexes

Create database indexes for columns you frequently query:

```sql
-- Speed up lookups by identifier
CREATE INDEX idx_users_identifier ON users(identifier);

-- Speed up inventory queries
CREATE INDEX idx_inventory_player ON inventory(player_id);
```

### 5. Monitor Connection Pool

Check pool status to detect issues:

```lua
local info = postgres:getPoolInfo()
if info.waitingCount > 0 then
    print('Warning: Database connections are saturated!')
    print('Consider increasing noverna_db_max_connections')
end
```

---

## Comparison with ox_mysql

If you're coming from ox_mysql, here's what's different:

| Feature         | ox_mysql        | noverna-database         |
| --------------- | --------------- | ------------------------ |
| Database        | MySQL/MariaDB   | PostgreSQL               |
| Parameters      | `@param` or `?` | `:param`                 |
| Language        | Lua             | TypeScript + Lua         |
| Type Safety     | No              | Yes (TypeScript)         |
| Transactions    | Via rawExecute  | Built-in `transaction()` |
| Batch Inserts   | No              | Yes (`insertBatch`)      |
| Connection Pool | Yes             | Yes (pg-pool)            |

### Migration Example

```lua
-- ox_mysql
MySQL.query('SELECT * FROM users WHERE id = @id', {
    ['@id'] = 1
})

-- noverna-database (same functionality)
postgres:query('SELECT * FROM users WHERE id = :id', {
    id = 1
})
```

---

## Troubleshooting 🔧

### ❌ Error: "Database is not connected"

**Cause:** Database connection hasn't been established yet.

**Solutions:**

1. Make sure `noverna-database` is started before your resource:

    ```cfg
    ensure noverna-database
    ensure your-resource
    ```

2. Use `awaitReady()` at resource start:

    ```lua
    CreateThread(function()
        if not postgres:awaitReady(10000) then
            error('Database connection failed!')
        end
        -- Your code here
    end)
    ```

3. Check your database credentials in `server.cfg`

4. Verify PostgreSQL is running:

    ```bash
    # Windows (PowerShell)
    Get-Service postgresql*

    # Linux
    sudo systemctl status postgresql
    ```

---

### ❌ Error: "SyntaxError: Unexpected token"

**Cause:** The built JavaScript file is incompatible with FiveM.

**Solution:**

1. Make sure you ran `npm run build`:

    ```bash
    cd resources/noverna-database/typescript
    npm run build
    ```

2. Check that `dist/index.js` exists

3. If problem persists, delete `dist` folder and rebuild:
    ```bash
    rm -rf dist
    npm run build
    ```

---

### ❌ Error: "ECONNREFUSED" or connection timeout

**Cause:** Can't connect to PostgreSQL server.

**Solutions:**

1. Check PostgreSQL is running
2. Verify `noverna_db_host` and `noverna_db_port` in `server.cfg`
3. Check firewall isn't blocking port 5432
4. Test connection manually:
    ```bash
    psql -h localhost -p 5432 -U postgres -d noverna
    ```

---

### ⚠️ Performance Issues

**Symptoms:** Slow queries, high server lag, timeouts

**Solutions:**

1. **Check connection pool status:**

    ```lua
    local info = postgres:getPoolInfo()
    print('Pool:', info.totalCount, 'Idle:', info.idleCount, 'Waiting:', info.waitingCount)
    ```

    If `waitingCount` is consistently high, increase pool size in `server.cfg`:

    ```cfg
    set noverna_db_max_connections "50"  # Increase from 20
    ```

2. **Add database indexes:**

    ```sql
    -- Analyze slow queries
    EXPLAIN ANALYZE SELECT * FROM users WHERE identifier = 'xyz';

    -- Add indexes for frequently queried columns
    CREATE INDEX idx_users_identifier ON users(identifier);
    ```

3. **Use batch operations:**

    - Use `insertBatch` instead of multiple `insert` calls
    - Group related operations in transactions

4. **Enable query logging** (for debugging only):
    ```lua
    -- In db.ts, temporarily uncomment console.log statements
    console.log('Query:', query, 'Params:', params)
    ```

---

### 🔍 Enable Debug Mode

To see detailed logs, modify `src/index.ts`:

```typescript
// Add at the top
const DEBUG = true;

// Before each export function, add:
if (DEBUG) console.log("[DB] query called:", query, params);
```

Then rebuild: `npm run build`

---

## Support & Contributing

-   **Issues:** [GitHub Issues](https://github.com/your-repo/issues)
-   **Discussions:** [GitHub Discussions](https://github.com/your-repo/discussions)
-   **Discord:** [Your Discord Server](#)

### Contributing

Pull requests are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Credits

Created by the Noverna Team. Inspired by [ox_mysql](https://github.com/overextended/ox_mysql).

Special thanks to the FiveM community for their support and feedback.
