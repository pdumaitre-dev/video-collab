import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { GET } from "./route";

const routeSource = readFileSync(join(process.cwd(), "app/api/blob/stream/route.ts"), "utf8");

describe("GET /api/blob/stream", () => {
  it("returns 400 when pathname and url are missing", async () => {
    const res = await GET(new Request("http://localhost/api/blob/stream"));
    assert.equal(res.status, 400);
    assert.deepEqual(await res.json(), {
      error: "Missing pathname parameter"
    });
  });

  it("proxies url with an explicit abort timeout", async () => {
    const originalFetch = globalThis.fetch;
    let fetchInit: RequestInit | undefined;
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      fetchInit = init;
      return new Response("ok", {
        status: 200,
        headers: { "content-type": "video/mp4" }
      });
    }) as typeof fetch;

    try {
      const res = await GET(
        new Request("http://localhost/api/blob/stream?url=https://example.com/video.mp4")
      );
      assert.equal(res.status, 200);
      assert.ok(fetchInit?.signal instanceof AbortSignal);
      assert.equal(fetchInit?.signal.aborted, false);
      assert.match(routeSource, /AbortSignal\.timeout\(15_000\)/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
