# Project Import/Export

## Summary

Add versioned portable JSON export/import for complete projects, including phases, tasks, and events. Exports are available from the dashboard and project page; imports are available from the dashboard.

Imports preserve ordering, statuses, descriptions, task metadata, event dates, and event scope relationships while generating new database IDs.

## Key Changes

- Define a versioned export document in shared schemas/types:
  - `formatVersion: 1`
  - project identifier, name, description, status
  - ordered phases and tasks, including all existing fields
  - events with `scopeType` and stable document references instead of database IDs
  - omit database IDs and timestamps for portability
- Add server-side export handling:
  - `GET /api/projects/:id/export`
  - require authentication and verify the project exists
  - serialize the full project tree
  - return downloadable JSON with a safe filename based on the identifier
- Add server-side import handling:
  - accept uploaded JSON
  - validate file size, JSON syntax, schema version, enum values, required fields, ordering, and event references
  - resolve event scopes from document references to newly created phase/task IDs
  - create the entire project inside one database transaction
  - assign positions from the document while preserving their order
- Support three collision outcomes when the imported identifier already exists:
  - import with a new user-supplied identifier
  - explicitly overwrite the existing project
  - cancel
- Require explicit overwrite confirmation and delete/recreate the matching project transactionally, including all cascaded child records.
- Add reusable server utilities for:
  - export-document construction
  - import validation and reference remapping
  - transactional project creation/replacement
- Add dashboard controls for “Import project” and project-card/page controls for “Export project”.
- Provide an import modal with:
  - file picker
  - validation/error display
  - project summary preview
  - identifier editing when creating a copy
  - explicit overwrite confirmation
  - success navigation to the imported project
- Refresh dashboard/project data after successful operations.

## Test Plan

- Export contains every project, phase, task, and event field currently supported.
- Export preserves phase/task ordering and all statuses.
- Project-, phase-, and task-scoped events remap to the correct new records after import.
- Invalid JSON, unsupported versions, malformed references, invalid enums, and duplicate document references are rejected without writes.
- New-identifier imports succeed and create entirely new database IDs.
- Existing identifiers produce a conflict response.
- Copy imports require and validate a unique identifier.
- Overwrite imports require confirmation and replace the complete project atomically.
- Failed imports leave no partially created or partially deleted records.
- Unauthorized export/import requests return the existing authentication error.
- UI tests or component checks cover file selection, preview, conflict choices, overwrite confirmation, and refresh/navigation behavior.

## Assumptions

- Version 1 supports JSON only; attachments and external files are out of scope.
- Portable exports exclude database IDs and timestamps.
- Imported identifiers use the existing project identifier validation and normalization rules.
- Overwrite means replacing the complete matching project, not merging individual records.
- No migration is required because the feature uses the existing database schema.
