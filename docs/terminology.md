# Growl — Terminology

This document defines the core concepts that Growl works with. It is intended as a shared language for contributors, designers, and users. Implementation details are intentionally omitted; see the linked files and folders for those.

---

## Project

A **Project** is the top-level workspace in Growl. It is self-contained: it owns its schema (the definition of what can exist), the actual data (entities and relationships), and one or more views over that data.

Projects are independent of each other. The same person can belong to multiple projects with different roles.

> Example: "ACME Software Architecture" and "HR Org Chart" are two separate projects. They have entirely separate schemas, data, and views.

Relevant: `src/routes/projects/`

---

## Schema

The **Schema** of a project is its structural definition: which entity types and relationship types exist, what fields they have, and how they are visually represented by default.

The schema is defined by users with the Modeller or Owner role. Once defined, it governs what entities and relationships can be created in the project.

> Example: A C4 project schema defines entity types "Software System", "Container", "Component", and "Person", and relationship types "Uses", "Belongs To", etc.

Relevant: `src/routes/projects/[id]/schema/`

---

## Entity Type

An **Entity Type** is a named category of things that can exist in a project. It defines:

- A **name** (e.g. "Software System")
- A set of **fields** — the attributes that every entity of this type will have
- A default **representation** — how entities of this type appear in graph views

> Example: The entity type "Container" might have fields: `name` (string), `technology` (string), `description` (string).

---

## Entity

An **Entity** is a concrete instance of an Entity Type within a project. It stores actual values for the fields defined by its type.

> Example: "Payment Service" is an entity of type "Container", with `technology = "Node.js"` and `description = "Handles payment processing"`.

Entities can be created via the graph view (by interacting directly with the canvas) or via a form interface.

Relevant: `src/routes/projects/[id]/entities/`

---

## Field

A **Field** is a named, typed attribute defined on an Entity Type or Relationship Type. Every entity or relationship of that type stores a value for each of its fields.

Supported field types: `string`, `int`, `boolean`, `date`, `url`.

---

## Relationship Type

A **Relationship Type** is a named, directed category of connections between entities. It defines:

- A **name** (e.g. "Depends On")
- Optionally, constraints on which entity types can be the **source** and which can be the **target**
- Optional **fields** — properties that each relationship instance can store
- A default **representation** — how relationships of this type appear in graph views (line style, arrowhead, colour, label)

> Example: "Belongs To" might only allow a "Container" as source and a "Software System" as target.

---

## Relationship

A **Relationship** is a concrete directed connection between two entity instances, of a specific Relationship Type. It may store values for the fields defined by its type.

> Example: An edge from "Payment Service" (Container) to "ACME Platform" (Software System) of type "Belongs To".

---

## View

A **View** is a named, saved perspective over a project's entities and relationships. Each view has:

- A **name**
- **Filter criteria** — which entity types and/or relationship types (and optionally property values) to include
- A saved **layout** — the position of each entity on the canvas for this view
- Optional **representation overrides** — a view can change how certain entity types appear specifically within it (see Representation)

A project can have many views. The same entity or relationship can appear in multiple views. Views do not duplicate data — they are always live projections of the underlying model.

> Example: A C4 project might have views: "System Context", "Container Diagram for Payment Domain", "Component Diagram for Payment Service".

Relevant: `src/routes/projects/[id]/views/`

---

## Representation

A **Representation** defines the visual appearance of an entity type or relationship type. For an entity it covers:

- **Shape** — circle, square, triangle, or a custom SVG
- **Colour** and **size**
- **Label configuration** — which field(s) to display on the node in the graph, and how (initially: one field; later: a multi-field template with typography control such as bold name + italic description)

For a relationship it covers:

- **Line style** — solid, dashed, dotted
- **Arrowhead** style
- **Colour**
- **Label** field

Representations are attached to entity types and relationship types as defaults. They can be overridden on individual entity instances, and optionally per view.

Relevant: `src/lib/components/d3graph/graphNodes/` (rendering primitives)

---

## Representation Library

A **Representation Library** is a named, reusable collection of representations. A library can be shared across entity types and relationship types within a project, or across multiple projects.

Using a library makes it easy to apply a consistent visual style across a project, or to share a style between projects (e.g. a shared "AWS icon set" or a "C4 colour palette").

Relevant: `src/routes/projects/[id]/settings/`

---

## Project Template

A **Project Template** is a reusable scaffold that bundles a schema (entity types, relationship types, fields) together with default representations. Users can create a new project by instantiating a template, which pre-populates the schema — saving the work of defining it from scratch.

After instantiation, the project's schema can be freely customised.

> Example: The built-in "C4 Model" template creates a project pre-configured with the four C4 entity types and the standard C4 relationship types and visual style. A user can then add their own entity types on top.

Relevant: `src/routes/templates/`

---

## User

A **User** is a person with an account in Growl. Users can belong to multiple projects, each with a potentially different role.

---

## Project Role

Every user who belongs to a project has a **Project Role** that governs what they can do in it. Roles are ordered: each role includes all the permissions of the roles below it.

| Role | Permissions |
|---|---|
| **Viewer** | Read-only access: can browse all views in the project |
| **Editor** | Can create, edit, and delete entities and relationships |
| **Modeller** | Can also define and modify the schema (entity types, relationship types, fields, representations) |
| **Owner** | Can also manage project membership (invite users, assign roles) and rename or delete the project |

---

## Graph vs. Domain terminology

Growl uses two parallel sets of terms depending on context:

| Context | Entity-related term | Relationship-related term |
|---|---|---|
| **Domain / UI** | Entity, Entity Type | Relationship, Relationship Type |
| **Graph component** | Node | Link |

The graph component (`src/lib/components/d3graph/`) is a generic visualization primitive that knows nothing about projects or schemas. It works with the generic `Node` and `Link` types. A mapping layer converts domain entities and relationships into nodes and links before passing them to the component.

This separation means the graph component can be reused or tested independently of any domain logic.

Relevant: `src/lib/components/d3graph/`, `src/lib/mappers/`
