## Setup

### 1. Clone and install
```bash
git clone https://github.com/YOUR_USERNAME/pac-agent-engine
cd pac-agent-engine
npm install
```

### 2. Environment variables
```bash
cp .env.example .env
# fill in your keys
```

Required keys:
- `GROQ_API_KEY` → get from console.groq.com (free)
- `POSTGRES_*` → handled by Docker
- `QDRANT_*` → handled by Docker

### 3. Start databases
```bash
# make sure Docker Desktop is running
docker-compose up -d
```

### 4. Run migrations
```bash
docker exec -i pac-infra-postgres-1 psql -U pac_user -d pac_db < src/db/migrations/001_init_schema.sql
```

### 5. Run
```bash
npm run dev
```

## How it works