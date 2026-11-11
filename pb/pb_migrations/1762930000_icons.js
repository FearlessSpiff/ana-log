/// <reference path="../pb_data/types.d.ts" />

// Camera type and film color pick the icons shown for gear and rolls.
migrate((app) => {
  const cameras = app.findCollectionByNameOrId("cameras");
  cameras.fields.addAt(cameras.fields.length - 3, new TextField({ name: "type" }));
  app.save(cameras);

  const films = app.findCollectionByNameOrId("films");
  films.fields.addAt(films.fields.length - 3, new TextField({ name: "color" }));
  app.save(films);
}, (app) => {
  const cameras = app.findCollectionByNameOrId("cameras");
  cameras.fields.removeByName("type");
  app.save(cameras);

  const films = app.findCollectionByNameOrId("films");
  films.fields.removeByName("color");
  app.save(films);
});
