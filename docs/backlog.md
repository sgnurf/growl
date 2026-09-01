# Growl — Backlog

Non-critical items and remaining roadmap, tracked here so they don't get lost between
sessions. Remove an item once it's addressed; add new ones as they come up during
testing.

---

## Remaining roadmap

Representations still needs a test coverage pass: API tests for representation
library CRUD, entity/relationship type `representationId` coverage, and a
`graphMapper`/`graph.svelte` unit test for a dashed/arrowhead link.

Beyond that, the following phases from the original product plan are still ahead:

- Project Templates; rich label templates (multi-field, bold/italic, multi-line);
  per-view representation overrides
- Real authentication and access control (replacing the current stub dev-user/Owner)
- Quality-of-life improvements and sharing

## Known issues & polish

Picked up during manual testing — not urgent, but worth addressing eventually:

- **Saving a view's layout leaks into "All entities".** Changing node positions in a
  specific view appears to also move entities in the unfiltered "All entities" view.
  Likely cause: `positionOverrides` sets `fx`/`fy` directly on the shared
  `SimulatedNode` objects in `graph.svelte`, but switching back to no override (`All
  entities`) never clears those pinned coordinates — they're only ever set, never
  reset to `null`.
- **Simulation/Static mode toggle is confusing.** Consider replacing the persistent
  two-mode toggle with a single one-click "Arrange" action that runs the simulation
  briefly and then settles, rather than a mode the user has to remember to switch back.
- **Too many clicks to assign a representation.** Assigning a representation to a type
  means leaving the Schema page, opening the Representations tab, and opening one
  library at a time. Consider an accordion view showing all libraries and their
  representations at once, so picking one doesn't require hopping between pages.
- **No way to edit or delete an entity/relationship.** The graph page's side panel only
  supports *creating* entities and relationships — there's no UI yet to edit field
  values or delete an existing one.
- **Table view for entities (and relationships?).** A tabular/grid representation of a
  project's entities, as an alternative to the graph canvas — useful for bulk
  review/editing of field values.
