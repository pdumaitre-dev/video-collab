import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GET, POST, DELETE } from "./route";

const routeSource = readFileSync(join(process.cwd(), "app/api/blob/comments/route.ts"), "utf8");

describe("GET /api/blob/comments", () => {
  it("returns 400 when pathname is missing", async () => {
    const res = await GET(new Request("http://localhost/api/blob/comments"));
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), {
      error: "pathname query parameter is required"
    });
  });

  it("scopes the select by pathname and caps the result set", () => {
    assert.match(routeSource, /WHERE pathname = \$\{decoded\}/);
    assert.match(routeSource, /LIMIT 500/);
  });
});

describe("POST /api/blob/comments", () => {
  it("returns 400 for invalid JSON", async () => {
    const res = await POST(
      new Request("http://localhost/api/blob/comments", {
        method: "POST",
        body: "{",
        headers: { "content-type": "application/json" }
      })
    );
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { error: "Invalid JSON body" });
  });

  it("returns 400 when pathname is missing", async () => {
    const res = await POST(
      new Request("http://localhost/api/blob/comments", {
        method: "POST",
        body: JSON.stringify({
          startSeconds: 1,
          endSeconds: 2,
          text: "note"
        }),
        headers: { "content-type": "application/json" }
      })
    );
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), { error: "pathname is required" });
  });
});

describe("DELETE /api/blob/comments", () => {
  it("returns 400 when id is missing", async () => {
    const res = await DELETE(new Request("http://localhost/api/blob/comments"));
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), {
      error: "id query parameter is required"
    });
  });
});
