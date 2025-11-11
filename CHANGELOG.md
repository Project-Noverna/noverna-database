# Changelog

All notable changes to the Noverna Database project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial PostgreSQL database wrapper for FiveM
- TypeScript backend with full type support
- Lua library for easy integration
- Named parameters (`:param` syntax)
- Connection pooling with pg-pool
- Transaction support
- Batch insert functionality
- Prepared statements support
- Async/Await support
- Complete API documentation
- Installation guide
- Example scripts

### Features

- `query()` - Execute queries and get all rows
- `single()` - Execute query and get first row
- `scalar()` - Execute query and get single value
- `insert()` - Insert and return ID
- `update()` - Update and return affected rows
- `execute()` - Execute any query
- `transaction()` - Execute queries in transaction
- `insertBatch()` - Batch insert multiple rows
- `rawQuery()` - Raw PostgreSQL queries
- `tableExists()` - Check if table exists
- `isReady()` - Check connection status
- `awaitReady()` - Wait for connection
- `getPoolInfo()` - Get connection pool statistics

### Documentation

- Complete README with API reference
- Step-by-step installation guide
- Troubleshooting section
- Example projects (User Management, Inventory System, Statistics)
- Performance tips
- Comparison with ox_mysql

## [1.0.0] - YYYY-MM-DD (Template for first release)

### Added

- Initial release of Noverna PostgreSQL Database Wrapper
- Full PostgreSQL support with connection pooling
- TypeScript backend compiled to CommonJS for FiveM
- Lua library for resource integration
- Named parameter support with `:param` syntax
- Transaction support
- Batch operations
- Comprehensive documentation

### Requirements

- FiveM Server (artifact 5848+)
- PostgreSQL 12+
- Node.js 16+ (for building only)

---

## Version Format

- **[MAJOR.MINOR.PATCH]** - Release date
  - **MAJOR**: Breaking changes
  - **MINOR**: New features (backward compatible)
  - **PATCH**: Bug fixes (backward compatible)

## Types of Changes

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security fixes

---

[Unreleased]: https://github.com/YOUR_USERNAME/Project-Noverna/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/YOUR_USERNAME/Project-Noverna/releases/tag/v1.0.0
