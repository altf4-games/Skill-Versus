# Quick Reference - Admin CLI Tools

## Most Common Tasks

### Unban a User (Remove Disqualification)
```bash
cd backend

# Method 1: Interactive (Easiest)
node scripts/admin-cli.js interactive
# Select: disqualifications → remove → enter contest ID and user ID

# Method 2: Direct command
node scripts/admin-cli.js disqualifications remove <contestId> <userId>

# Method 3: Script directly
node scripts/manageDisqualifications.js remove <contestId> <userId>
```

### Check Who's Banned
```bash
# List all disqualified users in a contest
node scripts/admin-cli.js disqualifications list <contestId>
```

### Update Ranking System
```bash
# Migrate from CP ranks (Pupil, Newbie) to Valorant ranks (Bronze, Iron)
node scripts/admin-cli.js migrate-ranks
```

## Getting Contest and User IDs

### Find Contest ID
1. Go to the contest page in your browser
2. Look at the URL: `/contests/<contestId>`
3. Or check the MongoDB database: `db.contests.find({}, {title: 1})`

### Find User ID
1. Check the MongoDB database: `db.users.find({username: "username"}, {_id: 1})`
2. Or look in the admin panel if available

## Example Workflow: Unbanning a User

1. **Get the contest ID** from the contest URL or database
2. **Get the user ID** from the database:
   ```bash
   # In MongoDB shell
   db.users.findOne({username: "TestUser"})._id
   ```
3. **Unban the user**:
   ```bash
   cd backend
   node scripts/admin-cli.js disqualifications remove 507f1f77bcf86cd799439011 507f191e810c19729de860ea
   ```

## Troubleshooting

### Redis Connection Error
- Make sure Valkey/Redis is running: `systemctl status redis` or `redis-cli ping`
- Check the REDIS_URL in your `.env` file
- Default: `REDIS_URL=redis://localhost:6379`

### MongoDB Connection Error
- Make sure MongoDB is running
- Check the MONGODB_URI in your `.env` file
- Default: `MONGODB_URI=mongodb://localhost:27017/skill-versus`

### Permission Errors
- Make sure you're running from the `backend` directory
- Check that your `.env` file exists and has the correct values

## All Available Commands

```bash
# Interactive mode (recommended for beginners)
node scripts/admin-cli.js interactive

# Disqualification management
node scripts/admin-cli.js disqualifications list <contestId>
node scripts/admin-cli.js disqualifications remove <contestId> <userId>
node scripts/admin-cli.js disqualifications disqualify <contestId> <userId> "reason"
node scripts/admin-cli.js disqualifications clear <contestId>

# System maintenance
node scripts/admin-cli.js migrate-ranks
node scripts/admin-cli.js add-driver-code
node scripts/admin-cli.js add-signatures

# Help
node scripts/admin-cli.js help
```

## Quick MongoDB Queries

```javascript
// Find contests
db.contests.find({}, {title: 1, startTime: 1}).sort({startTime: -1})

// Find users
db.users.find({}, {username: 1, email: 1}).sort({username: 1})

// Find user by username
db.users.findOne({username: "TestUser"})

// Find contest by title
db.contests.findOne({title: /contest name/i})
```

---