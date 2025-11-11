# Noverna Database - Complete Installation Guide

This guide will walk you through every step needed to get the Noverna PostgreSQL database wrapper running on your FiveM server.

## Prerequisites (What You Need First)

Before starting, make sure you have these installed:

### 1. Node.js (Required)

-   **Download:** https://nodejs.org/
-   **Minimum Version:** 16.x or higher
-   **Recommended:** Latest LTS version

**Check if you have it:**

```bash
node --version
# Should show: v16.x.x or higher
```

**Don't have it?** Download and install from the link above. Use the default installation settings.

---

### 2. PostgreSQL Database (Required)

-   **Download:** https://www.postgresql.org/download/
-   **Minimum Version:** 12.x or higher
-   **Recommended:** PostgreSQL 14 or 15

**During installation:**

-   Remember the password you set for the `postgres` user
-   Keep the default port (5432) unless you have a reason to change it
-   Install pgAdmin (comes with installer) - it's useful for managing your database

**Check if it's running:**

**Windows (PowerShell):**

```powershell
Get-Service postgresql*
# Should show "Running"
```

**Linux:**

```bash
sudo systemctl status postgresql
# Should show "active (running)"
```

---

### 3. FiveM Server

-   **Minimum artifact:** 5848 or higher
-   **Check version:** Look at your server folder name (e.g., `server-5848`)

---

## Step-by-Step Installation

### Step 1: Download/Clone the Resource

Place the `noverna-database` folder in your `resources` directory:

```
server/
└── resources/
    └── noverna-database/
        ├── typescript/
        ├── lib/
        ├── fxmanifest.lua
        └── README.md
```

---

### Step 2: Install Node Dependencies

Open a terminal/PowerShell and navigate to the TypeScript folder:

**Windows (PowerShell):**

```powershell
cd C:\path\to\your\server\resources\noverna-database\typescript
npm install
```

**Linux:**

```bash
cd /path/to/your/server/resources/noverna-database/typescript
npm install
```

**What this does:** Downloads all required packages (PostgreSQL driver, esbuild, TypeScript types)

**Expected output:**

```
added 45 packages in 8s
```

**Common issues:**

-   **"npm: command not found"** → Node.js is not installed or not in PATH
-   **"permission denied"** (Linux) → Use `sudo npm install`
-   **Takes forever** → Try `npm install --registry=https://registry.npmmirror.com` (uses faster mirror)

---

### Step 3: Build the Project

Still in the `typescript` folder, run:

```bash
npm run build
```

**What this does:** Compiles TypeScript code into JavaScript that FiveM can execute.

**Expected output:**

```
🔨 Building...
✅ Build complete!
```

**Result:** A new `dist` folder is created with `index.js` inside.

**Common issues:**

-   **Build fails with errors** → Make sure `npm install` completed successfully
-   **"esbuild: command not found"** → Delete `node_modules` and run `npm install` again
-   **"Cannot find module 'pg'"** → Run `npm install pg` manually

**For Development:** Use watch mode to auto-rebuild on file changes:

```bash
npm run watch
```

---

### Step 4: Set Up PostgreSQL Database

You need to create a database for your server.

#### Option A: Using pgAdmin (Easy, GUI)

1. Open **pgAdmin** (installed with PostgreSQL)
2. Connect to your PostgreSQL server (enter the password you set during installation)
3. Right-click **Databases** → **Create** → **Database**
4. Set database name: `noverna` (or whatever you prefer)
5. Click **Save**

#### Option B: Using Command Line (Advanced)

**Windows:**

```powershell
# Open PostgreSQL command prompt (search "SQL Shell (psql)" in Start menu)
# Or use PowerShell:
psql -U postgres

# Then create database:
CREATE DATABASE noverna;

# Optionally create a dedicated user:
CREATE USER noverna_user WITH PASSWORD 'YourSecurePasswordHere';
GRANT ALL PRIVILEGES ON DATABASE noverna TO noverna_user;

# Exit:
\q
```

**Linux:**

```bash
sudo -u postgres psql

CREATE DATABASE noverna;

# Optional: Create user
CREATE USER noverna_user WITH PASSWORD 'YourSecurePasswordHere';
GRANT ALL PRIVILEGES ON DATABASE noverna TO noverna_user;

# Exit
\q
```

**Verify it worked:**

```bash
# List all databases
psql -U postgres -l
# Should show "noverna" in the list
```

---

### Step 5: Configure FiveM Server

Open your `server.cfg` (usually in `server/data/server.cfg`) and add:

```cfg
####################################
# PostgreSQL Database Configuration
####################################

# Database connection settings
set noverna_db_host "localhost"              # Use "localhost" if DB is on same machine
set noverna_db_port "5432"                   # Default PostgreSQL port
set noverna_db_name "noverna"                # Database name you created
set noverna_db_user "postgres"               # Database username
set noverna_db_password "your_password_here" # Your PostgreSQL password
set noverna_db_max_connections "20"          # Connection pool size

# Connection timeouts (optional, defaults shown)
set noverna_db_idle_timeout "30000"          # 30 seconds
set noverna_db_connection_timeout "2000"     # 2 seconds

####################################
# Start Resources
####################################

# IMPORTANT: Start noverna-database BEFORE resources that use it!
ensure noverna-database

# Your other resources that use the database
# ensure your-gamemode
# ensure your-inventory
```

**⚠️ IMPORTANT:**

-   Replace `your_password_here` with your actual PostgreSQL password
-   Keep the password secure - don't share your server.cfg publicly!
-   Make sure `noverna-database` is started BEFORE any resources that depend on it

**Common mistakes:**

-   ❌ Wrong password → Connection will fail
-   ❌ Wrong database name → "database does not exist" error
-   ❌ Starting dependent resources before `noverna-database` → "Database is not connected" errors

---

### Step 6: Start Your Server

Start your FiveM server normally.

**What to look for in console:**

✅ **Success looks like:**

```
[Noverna-Database] PostgreSQL connection established successfully
```

❌ **Failure looks like:**

```
[Noverna-Database] Failed to connect to PostgreSQL: password authentication failed
```

**If you see the success message:** Congratulations! You're done! 🎉

**If you see errors:** See troubleshooting section below.

---

## Using the Database in Your Resources

### Basic Setup

**1. In your resource's `fxmanifest.lua`:**

```lua
fx_version 'cerulean'
game 'gta5'
lua54 'yes'  -- Required!

-- Tell FiveM this resource needs noverna-database
dependencies {
    'noverna-database'
}

-- Import the Lua library (recommended)
shared_scripts {
    '@noverna-database/lib/postgres.lua'
}

-- Your scripts
server_scripts {
    'server/main.lua'
}
```

**2. In your `server/main.lua`:**

```lua
-- Wait for database to be ready
CreateThread(function()
    print('[YourResource] Waiting for database...')

    if not postgres:awaitReady(10000) then  -- Wait max 10 seconds
        error('[YourResource] Database connection failed!')
        return
    end

    print('[YourResource] Database is ready!')

    -- Create your tables if they don't exist
    if not postgres:tableExists('your_table') then
        print('[YourResource] Creating table...')
        postgres:execute([[
            CREATE TABLE your_table (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT NOW()
            )
        ]])
        print('[YourResource] Table created!')
    end

    -- Your initialization code here
    print('[YourResource] Ready to go!')
end)

-- Example query
RegisterCommand('testdb', function()
    local count = postgres:scalar('SELECT COUNT(*) FROM your_table')
    print('Records in table:', count)
end, true)
```

---

## Troubleshooting

### Problem: "Database is not connected"

**Cause:** Database connection hasn't been established.

**Solutions:**

1. **Check server console** for database errors
2. **Verify credentials** in `server.cfg` are correct
3. **Test PostgreSQL connection manually:**
    ```bash
    psql -h localhost -p 5432 -U postgres -d noverna
    # Enter your password
    # Should connect successfully
    ```
4. **Make sure PostgreSQL is running:**

    ```bash
    # Windows
    Get-Service postgresql*

    # Linux
    sudo systemctl status postgresql
    ```

5. **Check firewall** isn't blocking port 5432

---

### Problem: "password authentication failed"

**Cause:** Wrong password in `server.cfg`

**Solutions:**

1. Double-check the password in `server.cfg`
2. Make sure there are no extra spaces around the password
3. Test the password manually with psql (see above)
4. If you forgot the password, reset it:

    ```bash
    # Linux
    sudo -u postgres psql
    ALTER USER postgres PASSWORD 'new_password';

    # Windows (as admin in psql)
    ALTER USER postgres PASSWORD 'new_password';
    ```

---

### Problem: "ECONNREFUSED" or connection refused

**Causes:** PostgreSQL not running, wrong host/port, firewall blocking

**Solutions:**

1. **Start PostgreSQL:**

    ```bash
    # Windows (as admin)
    Start-Service postgresql*

    # Linux
    sudo systemctl start postgresql
    ```

2. **Check if PostgreSQL is listening:**

    ```bash
    # Windows
    netstat -an | findstr "5432"

    # Linux
    sudo netstat -tulpn | grep 5432
    ```

    Should show PostgreSQL listening on port 5432

3. **If using a different machine for database:**
    - Update `noverna_db_host` to the database server's IP
    - Edit PostgreSQL's `pg_hba.conf` to allow remote connections
    - Edit `postgresql.conf` to set `listen_addresses = '*'`
    - Restart PostgreSQL

---

### Problem: "npm: command not found"

**Cause:** Node.js not installed or not in PATH

**Solution:**

1. Install Node.js from https://nodejs.org/
2. During installation, check "Add to PATH"
3. Restart your terminal/PowerShell
4. Verify: `node --version`

---

### Problem: "SyntaxError: Unexpected token" in FiveM

**Cause:** Build failed or outdated build

**Solution:**

1. Delete the `dist` folder completely
2. Run `npm run build` again
3. Make sure no errors occur
4. Restart FiveM server

---

### Problem: Build fails with TypeScript errors

**Solution:**

```bash
# Clean install
rm -rf node_modules package-lock.json  # Linux/Mac
# or
Remove-Item -Recurse -Force node_modules, package-lock.json  # Windows PowerShell

# Reinstall
npm install

# Rebuild
npm run build
```

---

### Problem: Server lag or slow queries

**Solutions:**

1. **Increase connection pool:**

    ```cfg
    set noverna_db_max_connections "50"  # Increase from 20
    ```

2. **Add database indexes:**

    ```sql
    CREATE INDEX idx_users_identifier ON users(identifier);
    ```

3. **Check pool status in game:**

    ```lua
    local info = postgres:getPoolInfo()
    print('Total:', info.totalCount, 'Idle:', info.idleCount, 'Waiting:', info.waitingCount)
    ```

    If `waitingCount` is high, increase pool size.

4. **Use batch operations** instead of loops:

    ```lua
    -- ❌ Slow
    for i = 1, 100 do
        postgres:insert('INSERT INTO ...')
    end

    -- ✅ Fast
    postgres:insertBatch('table', {'col1'}, data)
    ```

---

## Getting Help

If you're still stuck:

1. **Check server console** for error messages
2. **Enable debug mode** (see README.md)
3. **Search for similar issues** in GitHub Issues
4. **Create a new issue** with:
    - Full error message from console
    - Your FiveM server version
    - PostgreSQL version
    - Steps you've tried

---

## Next Steps

✅ Database is working? Great! Now:

1. Read the [README.md](README.md) for complete API documentation
2. Check out the example resource in `noverna_example/server/database_example.lua`
3. Create your database schema (tables, indexes)
4. Start building your gamemode!

---

## Quick Reference

### Useful Commands

```bash
# Build project
npm run build

# Watch mode (auto-rebuild)
npm run watch

# Test database connection
psql -h localhost -U postgres -d noverna

# Check PostgreSQL status
# Windows:
Get-Service postgresql*

# Linux:
sudo systemctl status postgresql

# View database logs
# Windows: C:\Program Files\PostgreSQL\{version}\data\log\
# Linux: /var/log/postgresql/
```

### Common File Locations

```
server/
├── data/
│   └── server.cfg                    # Server configuration
└── resources/
    └── noverna-database/
        ├── fxmanifest.lua            # Resource manifest
        ├── lib/
        │   └── postgres.lua          # Lua library
        └── typescript/
            ├── src/
            │   ├── index.ts          # Main entry point
            │   └── db.ts             # Database wrapper
            ├── dist/
            │   └── index.js          # Compiled output
            ├── package.json          # Node dependencies
            └── build.js              # Build script
```

---

Good luck! 🚀
