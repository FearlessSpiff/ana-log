/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const cameras = app.findCollectionByNameOrId("cameras");
  cameras.fields.addAt(cameras.fields.length - 3, new TextField({ name: "mount" }));
  app.save(cameras);
}, (app) => {
  const cameras = app.findCollectionByNameOrId("cameras");
  cameras.fields.removeByName("mount");
  app.save(cameras);
});
