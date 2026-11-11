/// <reference path="../pb_data/types.d.ts" />

// A skipped frame uses up its number on the roll without exposure details.
migrate((app) => {
  const frames = app.findCollectionByNameOrId("frames");
  frames.fields.addAt(frames.fields.length - 3, new BoolField({ name: "skipped" }));
  app.save(frames);
}, (app) => {
  const frames = app.findCollectionByNameOrId("frames");
  frames.fields.removeByName("skipped");
  app.save(frames);
});
