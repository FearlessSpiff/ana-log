/// <reference path="../pb_data/types.d.ts" />

// Flash units as gear, and the flash used for a frame (plain text id like lens)
// with its manual power setting.
const OWNER = "user = @request.auth.id";
const CREATE = '@request.auth.id != "" && @request.body.user = @request.auth.id';
const UPDATE = OWNER + " && (@request.body.user:isset = false || @request.body.user = @request.auth.id)";

migrate((app) => {
  const users = app.findCollectionByNameOrId("users");
  app.save(new Collection({
    type: "base",
    name: "flashes",
    listRule: OWNER,
    viewRule: OWNER,
    createRule: CREATE,
    updateRule: UPDATE,
    deleteRule: OWNER,
    fields: [
      { name: "id", type: "text", primaryKey: true, required: true, system: true, min: 15, max: 15, pattern: "^[a-z0-9]+$", autogeneratePattern: "[a-z0-9]{15}" },
      { name: "user", type: "relation", required: true, collectionId: users.id, maxSelect: 1, cascadeDelete: true },
      { name: "name", type: "text", required: true },
      { name: "guide_number", type: "number" },
      { name: "notes", type: "text" },
      { name: "deleted", type: "bool" },
      { name: "created", type: "autodate", onCreate: true },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
    indexes: ["CREATE INDEX idx_flashes_user_updated ON flashes (user, updated)"],
  }));

  const frames = app.findCollectionByNameOrId("frames");
  frames.fields.addAt(frames.fields.length - 3, new TextField({ name: "flash" }));
  frames.fields.addAt(frames.fields.length - 3, new TextField({ name: "flash_power" }));
  app.save(frames);
}, (app) => {
  const frames = app.findCollectionByNameOrId("frames");
  frames.fields.removeByName("flash");
  frames.fields.removeByName("flash_power");
  app.save(frames);

  app.delete(app.findCollectionByNameOrId("flashes"));
});
