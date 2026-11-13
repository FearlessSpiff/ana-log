/// <reference path="../pb_data/types.d.ts" />

// Flash sync speed per camera. Turning on a flash for a frame sets the shutter
// to this speed.
migrate((app) => {
  const cameras = app.findCollectionByNameOrId("cameras");
  cameras.fields.addAt(cameras.fields.length - 3, new TextField({ name: "flash_sync" }));
  app.save(cameras);
}, (app) => {
  const cameras = app.findCollectionByNameOrId("cameras");
  cameras.fields.removeByName("flash_sync");
  app.save(cameras);
});
