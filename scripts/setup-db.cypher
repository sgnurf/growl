// Growl – Neo4j database setup
// Run once against your Neo4j instance before starting the app.
// Example (neo4j-shell or cypher-shell):
//   cypher-shell -u neo4j -p <password> -f scripts/setup-db.cypher

// ── Meta node constraints ────────────────────────────────────────────────────
// GrowlUser, GrowlProject, etc. use the Growl* prefix to avoid clashing with
// user-defined entity type labels (which are interpolated from project schemas).

CREATE CONSTRAINT growl_user_id IF NOT EXISTS
    FOR (n:GrowlUser) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT growl_project_id IF NOT EXISTS
    FOR (n:GrowlProject) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT growl_entity_type_id IF NOT EXISTS
    FOR (n:GrowlEntityType) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT growl_relationship_type_id IF NOT EXISTS
    FOR (n:GrowlRelationshipType) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT growl_view_id IF NOT EXISTS
    FOR (n:GrowlView) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT growl_representation_id IF NOT EXISTS
    FOR (n:GrowlRepresentation) REQUIRE n.id IS UNIQUE;

CREATE CONSTRAINT growl_template_id IF NOT EXISTS
    FOR (n:GrowlProjectTemplate) REQUIRE n.id IS UNIQUE;

// ── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX growl_user_email IF NOT EXISTS
    FOR (n:GrowlUser) ON (n.email);

CREATE INDEX growl_project_name IF NOT EXISTS
    FOR (n:GrowlProject) ON (n.name);
