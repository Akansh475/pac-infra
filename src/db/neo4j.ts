import neo4j from 'neo4j-driver'

const driver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', 'password123')
)

export async function initNeo4j(): Promise<void> {
  const session = driver.session()
  try {
    // create constraints
    await session.run(
      'CREATE CONSTRAINT IF NOT EXISTS FOR (p:Person) REQUIRE p.email IS UNIQUE'
    )
    await session.run(
      'CREATE CONSTRAINT IF NOT EXISTS FOR (proj:Project) REQUIRE proj.name IS UNIQUE'
    )
    await session.run(
      'CREATE CONSTRAINT IF NOT EXISTS FOR (m:Memory) REQUIRE m.id IS UNIQUE'
    )
    console.log('✅ Neo4j constraints created')
  } finally {
    await session.close()
  }
}

export async function createPersonNode(email: string, name?: string): Promise<void> {
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