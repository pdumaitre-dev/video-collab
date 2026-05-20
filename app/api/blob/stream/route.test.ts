import assert from "node:assert/strict";

type ModuleWithLoad = typeof import("node:module") & {
  _load(request: string, parent: unknown, isMain: boolean): unknown;
};

type BlobMetadata = {
  contentType?: string | null;
  size?: number | null;
};

type BlobStreamResult = {
  stream: ReadableStream<Uint8Array>;
  blob: BlobMetadata;
} | null;

const moduleLoader = require("node:module") as ModuleWithLoad;
const originalLoad = moduleLoader._load;
const originalConsoleError = console.error;

let getBlobStreamCalls: string[] = [];
let getBlobStreamResult: BlobStreamResult = null;
let getBlobStreamError: unknown = null;

moduleLoader._load = function loadMockedModule(
  request: string,
  parent: unknown,
  isMain: boolean
) {
  if (request === "@/lib/blob") {
    return {
      getBlobStream: async (pathname: string) => {
        getBlobStreamCalls.push(pathname);

        if (getBlobStreamError) {
          throw getBlobStreamError;
        }

        return getBlobStreamResult;
      }
    };
  }

  return originalLoad.call(this, request, parent, isMain);
};

const { GET } = require("./route") as {
  GET(request: Request): Promise<Response>;
};

function resetStreamMocks() {
  getBlobStreamCalls = [];
  getBlobStreamResult = null;
  getBlobStreamError = null;
}

function streamResult(body: string, blob: BlobMetadata): BlobStreamResult {
  return {
    stream: new Blob([body]).stream(),
    blob
  };
}

async function readJson(response: Response) {
  return response.json() as Promise<unknown>;
}

async function main() {
  resetStreamMocks();

  let response = await GET(new Request("http://localhost/api/blob/stream"));
  assert.equal(response.status, 400);
  assert.deepEqual(await readJson(response), {
    error: "Missing pathname parameter"
  });
  assert.deepEqual(getBlobStreamCalls, []);

  resetStreamMocks();
  response = await GET(
    new Request(
      "http://localhost/api/blob/stream?pathname=videos%2Frehearsal%20take.mp4"
    )
  );
  assert.equal(response.status, 404);
  assert.deepEqual(await readJson(response), { error: "Blob not found" });
  assert.deepEqual(getBlobStreamCalls, ["videos/rehearsal take.mp4"]);

  resetStreamMocks();
  getBlobStreamResult = streamResult("video bytes", {
    contentType: "video/webm",
    size: 11
  });

  response = await GET(
    new Request(
      "http://localhost/api/blob/stream?pathname=videos%2Frehearsal.webm"
    )
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "video/webm");
  assert.equal(response.headers.get("Content-Length"), "11");
  assert.equal(await response.text(), "video bytes");
  assert.deepEqual(getBlobStreamCalls, ["videos/rehearsal.webm"]);

  resetStreamMocks();
  getBlobStreamResult = streamResult("fallback bytes", {
    contentType: null,
    size: 0
  });

  response = await GET(
    new Request("http://localhost/api/blob/stream?pathname=videos%2Fclip.mp4")
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Type"), "video/mp4");
  assert.equal(response.headers.get("Content-Length"), null);
  assert.equal(await response.text(), "fallback bytes");

  resetStreamMocks();
  getBlobStreamError = new Error("blob storage unavailable");
  const consoleErrors: unknown[][] = [];
  console.error = (...args: unknown[]) => {
    consoleErrors.push(args);
  };

  try {
    response = await GET(
      new Request("http://localhost/api/blob/stream?pathname=videos%2Fclip.mp4")
    );
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(response.status, 500);
  assert.deepEqual(await readJson(response), {
    error: "Failed to stream blob"
  });
  assert.deepEqual(getBlobStreamCalls, ["videos/clip.mp4"]);
  assert.equal(consoleErrors.length, 1);
  assert.equal(consoleErrors[0][0], "Error streaming blob");

  console.log("blob stream route tests ok");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    moduleLoader._load = originalLoad;
  });
