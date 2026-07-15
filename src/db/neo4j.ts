import neo4j from 'neo4j-driver'

const driver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', 'password123')
)

export async function initNeo4j(): Promise<void> {
  const session = driver.session()
  try {
    await session.run(
      'CREATE CONSTRAINT IF NOT EXISTS FOR (p:Person) REQUIRE p.email IS UNIQUE'
    )
    await session.run(
      'CREATE CONSTRAINT IF NOT EXISTS FOR (proj:Project) REQUIRE proj.name IS UNIQUE'
    )
    await session.run(
      'CREATE CONSTRAINT IF NOT EXISTS FOR (m:Memory) REQUIRE m.id IS UNIQUE'
    )
    await session.run(
      'CREATE CONSTRAINT IF NOT EXISTS FOR (c:Company) REQUIRE c.name IS UNIQUE'
    )
    await session.run(
      'CREATE CONSTRAINT IF NOT EXISTS FOR (e:Event) REQUIRE e.id IS UNIQUE'
    )
    await session.run(
      'CREATE CONSTRAINT IF NOT EXISTS FOR (j:Job) REQUIRE j.id IS UNIQUE'
    )
    console.log('✅ Neo4j constraints created')
  } finally {
    await session.close()
  }
}

// ─── PERSON ──────────────────────────────────────────────
export async function createPersonNode(
  email: string,
  name?:    string
): Promise<void> {
  const session = driver.session()
  try {
    await session.run(
      `MERGE (p:Person {email: $email})
       ON CREATE SET p.name = $name, p.createdAt = datetime()
       ON MATCH SET p.name = COALESCE($name, p.name)`,
      { email, name: name || email }
    )
  } finally {
    await session.close()
  }
}

// ─── COMPANY ─────────────────────────────────────────────
export async function createCompanyNode(name: string): Promise<void> {
  const session = driver.session()
  try {
    await session.run(
      `MERGE (c:Company {name: $name})
       ON CREATE SET c.createdAt = datetime()`,
      { name }
    )
  } finally {
    await session.close()
  }
}

// ─── PERSON → COMPANY ────────────────────────────────────
export async function linkPersonToCompany(
  email:       string,
  companyName: string
): Promise<void> {
  const session = driver.session()
  try {
    await session.run(
      `MERGE (p:Person {email: $email})
       MERGE (c:Company {name: $company})
       MERGE (p)-[:WORKS_AT]->(c)`,
      { email, company: companyName }
    )
  } finally {
    await session.close()
  }
}

// ─── MEMORY → PERSON ─────────────────────────────────────
export async function linkMemoryToPerson(
  memoryId: string,
  email:    string
): Promise<void> {
  const session = driver.session()
  try {
    await session.run(
      `MERGE (m:Memory {id: $memoryId})
       MERGE (p:Person {email: $email})
       MERGE (m)-[:INVOLVES]->(p)`,
      { memoryId, email }
    )
  } finally {
    await session.close()
  }
}

// ─── MEMORY → PROJECT ────────────────────────────────────
export async function linkMemoryToProject(
  memoryId:    string,
  projectName: string
): Promise<void> {
  const session = driver.session()
  try {
    await session.run(
      `MERGE (m:Memory {id: $memoryId})
       MERGE (proj:Project {name: $projectName})
       MERGE (m)-[:BELONGS_TO]->(proj)`,
      { memoryId, projectName }
    )
  } finally {
    await session.close()
  }
}

// ─── EVENT → PERSON ──────────────────────────────────────
export async function linkEventToPerson(
  eventTitle: string,
  email:      string
): Promise<void> {
  const session = driver.session()
  try {
    await session.run(
      `MERGE (e:Event {id: $eventTitle})
       MERGE (p:Person {email: $email})
       MERGE (e)-[:INVOLVES]->(p)`,
      { eventTitle, email }
    )
  } finally {
    await session.close()
  }
}

// ─── TASK → PROJECT ──────────────────────────────────────
export async function linkTaskToProject(
  taskContent: string,
  projectName: string
): Promise<void> {
  const session = driver.session()
  try {
    await session.run(
      `MERGE (t:Task {id: $taskContent})
       MERGE (proj:Project {name: $projectName})
       MERGE (t)-[:BELONGS_TO]->(proj)`,
      { taskContent, projectName }
    )
  } finally {
    await session.close()
  }
}

// ─── USER → JOB ──────────────────────────────────────────
export async function linkUserToJob(
  userId:  string,
  company: string,
  role:    string,
  status:  string
): Promise<void> {
  const session = driver.session()
  try {
    await session.run(
      `MERGE (u:User {id: $userId})
       MERGE (j:Job {id: $jobId})
       ON CREATE SET j.company = $company, j.role = $role, 
                     j.status = $status, j.createdAt = datetime()
       ON MATCH SET j.status = $status
       MERGE (u)-[:APPLIED_TO]->(j)`,
      {
        userId,
        jobId:   `${userId}-${company}-${role}`,
        company,
        role,
        status
      }
    )
    console.log(`📊 Job graph: ${userId} → ${company} (${role}) [${status}]`)
  } finally {
    await session.close()
  }
}

// ─── GET PEOPLE FROM MEMORY ──────────────────────────────
export async function getPeopleFromMemory(memoryId: string): Promise<string[]> {
  const session = driver.session()
  try {
    const result = await session.run(
      `MATCH (m:Memory {id: $memoryId})-[:INVOLVES]->(p:Person)
       RETURN p.email as email`,
      { memoryId }
    )
    return result.records.map(r => r.get('email'))
  } finally {
    await session.close()
  }
}

export default driver