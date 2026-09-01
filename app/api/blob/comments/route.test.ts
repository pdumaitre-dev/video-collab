import assert from "node:assert/strict";
import { describe, it } from "node:test";

async function loadHandlers() {
  process.env.DATABASE_URL ??= "postgresql://user:pass@localhost/db";
  return import("./route");
}

describe("GET /api/blob/comments", () => {
  it("returns 400 when pathname is missing", async () => {
    const { GET } = await loadHandlers();
    const res = await GET(new Request("http://localhost/api/blob/comments"));
    assert.equal(res.status, 400);
    const body = (await res.json()) as { error: string };
    assert.equal(body.error, "pathname query parameter is required");
  });
});

describe("POST /api/blob/comments", () => {
  it("returns 400 for invalid JSON", async () => {
    const { POST } = await loadHandlers();
    const res = await POST(
      new Request("http://localhost/api/blob/comments", {
        method: "POST",
        body: "not-json"
      })
    );
    assert.equal(res.status, 400);
  });

  it("returns 400 when pathname is missing", async () => {
    const { POST } = await loadHandlers();
    const res = await POST(
      new Request("http://localhost/api/blob/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          startSeconds: 1,
          endSeconds: 2,
          text: "note"
        })
      })
    );
    assert.equal(res.status, 400);
  });

  it("returns 400 when pathname is empty", async () => {
    const { POST } = await loadHandlers();
    const res = await POST(
      new Request("http://localhost/api/blob/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pathname: "   ",
          startSeconds: 1,
          endSeconds: 2,
          text: "note"
        })
      })
    );
    assert.equal(res.status, 400);
  });

  it("returns 400 when the time range is invalid", async () => {
    const { POST } = await loadHandlers();
    const res = await POST(
      new Request("http://localhost/api/blob/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pathname: "videos/demo.mp4",
          startSeconds: 5,
          endSeconds: 2,
          text: "note"
        })
      })
    );
    assert.equal(res.status, 400);
  });

  it("returns 400 when comment text is empty", async () => {
    const { POST } = await loadHandlers();
    const res = await POST(
      new Request("http://localhost/api/blob/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pathname: "videos/demo.mp4",
          startSeconds: 1,
          endSeconds: 2,
          text: "   "
        })
      })
    );
    assert.equal(res.status, 400);
  });
});

describe("DELETE /api/blob/comments", () => {
  it("returns 400 when id is missing", async () => {
    const { DELETE } = await loadHandlers();
    const res = await DELETE(new Request("http://localhost/api/blob/comments"));
    assert.equal(res.status, 400);
  });

  it("returns 400 when id is not a positive number", async () => {
    const { DELETE } = await loadHandlers();
    const res = await DELETE(
      new Request("http://localhost/api/blob/comments?id=0")
    );
    assert.equal(res.status, 400);
  });
});
