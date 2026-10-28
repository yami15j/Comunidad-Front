import test from "node:test";
import assert from "node:assert/strict";
import { zoomLink, libraryItems } from "../src/services/studentContent.js";
test("only HTTPS Zoom destinations are accepted", () => {
  assert.equal(
    zoomLink("https://company.zoom.us/j/123"),
    "https://company.zoom.us/j/123",
  );
  for (const url of [
    "javascript:alert(1)",
    "https://zoom.us.evil.com",
    "https://zoom.us@evil.com",
    "http://zoom.us/j/123",
  ])
    assert.equal(zoomLink(url), null);
});
test("library exposes actual published materials, content types, and ready videos", () => {
  const course = {
    id: "c",
    title: "Workshop",
    contentType: "workshop",
    modules: [
      {
        lessons: [{ title: "Lesson", resources: [{ id: "r", title: "PDF" }] }],
      },
    ],
  };
  const items = libraryItems(
    [course],
    [
      { id: "v", status: "ready" },
      { id: "pending", status: "pending" },
    ],
  );
  assert.deepEqual(
    items.map((item) => item.type),
    ["Talleres", "Grabaciones", "Recursos"],
  );
  assert.equal(items[2].courseTitle, "Workshop");
  assert.equal(items[2].resource.id, "r");
  assert.deepEqual(libraryItems([], []), []);
});
