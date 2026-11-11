/// <reference path="../pb_data/types.d.ts" />

// Aperture range per lens and shutter range per camera, used to limit the
// choices when logging a frame.
migrate((app) => {
  const lenses = app.findCollectionByNameOrId("lenses");
  lenses.fields.addAt(lenses.fields.length - 3, new TextField({ name: "min_aperture" }));
  app.save(lenses);

  const cameras = app.findCollectionByNameOrId("cameras");
  const at = cameras.fields.length - 3;
  cameras.fields.addAt(at, new TextField({ name: "slowest_shutter" }));
  cameras.fields.addAt(at + 1, new TextField({ name: "fastest_shutter" }));
  cameras.fields.addAt(at + 2, new BoolField({ name: "bulb" }));
  app.save(cameras);
}, (app) => {
  const lenses = app.findCollectionByNameOrId("lenses");
  lenses.fields.removeByName("min_aperture");
  app.save(lenses);

  const cameras = app.findCollectionByNameOrId("cameras");
  for (const name of ["slowest_shutter", "fastest_shutter", "bulb"]) cameras.fields.removeByName(name);
  app.save(cameras);
});
