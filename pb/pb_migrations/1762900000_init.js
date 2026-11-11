/// <reference path="../pb_data/types.d.ts" />

// Collections for ana-log. References between records (camera, film, roll, lens)
// are plain text ids rather than PocketBase relations: the client generates ids
// offline and syncs in any order, so the server must not enforce them.

const OWNER = "user = @request.auth.id";
const CREATE = '@request.auth.id != "" && @request.body.user = @request.auth.id';
const UPDATE = OWNER + " && (@request.body.user:isset = false || @request.body.user = @request.auth.id)";

const COLLECTIONS = {
  cameras: [
    { name: "name", type: "text", required: true },
    { name: "format", type: "text" },
    { name: "notes", type: "text" },
  ],
  lenses: [
    { name: "name", type: "text", required: true },
    { name: "focal_length", type: "text" },
    { name: "max_aperture", type: "text" },
    { name: "mount", type: "text" },
    { name: "notes", type: "text" },
  ],
  films: [
    { name: "name", type: "text", required: true },
    { name: "iso", type: "number" },
    { name: "kind", type: "text" },
    { name: "format", type: "text" },
    { name: "notes", type: "text" },
  ],
  rolls: [
    { name: "name", type: "text" },
    { name: "camera", type: "text" },
    { name: "film", type: "text" },
    { name: "shot_iso", type: "number" },
    { name: "exposures", type: "number" },
    { name: "loaded_at", type: "text" },
    { name: "finished_at", type: "text" },
    { name: "developed_at", type: "text" },
    { name: "notes", type: "text" },
  ],
  frames: [
    { name: "roll", type: "text", required: true },
    { name: "number", type: "number" },
    { name: "aperture", type: "text" },
    { name: "shutter", type: "text" },
    { name: "lens", type: "text" },
    { name: "exposure_comp", type: "text" },
    { name: "taken_at", type: "text" },
    { name: "lat", type: "number" },
    { name: "lng", type: "number" },
    { name: "notes", type: "text" },
  ],
};

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");

  for (const [name, fields] of Object.entries(COLLECTIONS)) {
    const collection = new Collection({
      type: "base",
      name,
      listRule: OWNER,
      viewRule: OWNER,
      createRule: CREATE,
      updateRule: UPDATE,
      deleteRule: OWNER,
      fields: [
        // Client-generated 15 char ids so records can be created offline.
        { name: "id", type: "text", primaryKey: true, required: true, system: true, min: 15, max: 15, pattern: "^[a-z0-9]+$", autogeneratePattern: "[a-z0-9]{15}" },
        { name: "user", type: "relation", required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: true },
        ...fields,
        // Soft delete so deletions propagate to other devices on sync.
        { name: "deleted", type: "bool" },
        { name: "created", type: "autodate", onCreate: true },
        { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
      ],
      indexes: [`CREATE INDEX idx_${name}_user_updated ON ${name} (user, updated)`],
    });
    app.save(collection);
  }
}, (app) => {
  for (const name of Object.keys(COLLECTIONS).reverse()) {
    app.delete(app.findCollectionByNameOrId(name));
  }
});
