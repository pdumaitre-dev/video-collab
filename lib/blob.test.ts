import assert from "node:assert/strict";

type ModuleWithLoad = typeof import("node:module") & {
  _load(request: string, parent: unknown, isMain: boolean): unknown;
};

type ListedBlob = {
  pathname: string;
  url: string;
  size?: number;
};

const moduleLoader = require("node:module") as ModuleWithLoad;
const originalLoad = moduleLoader._load;
const originalBlobAccess = process.env.BLOB_ACCESS;

let listCalls: unknown[] = [];
let headCalls: string[] = [];
let getCalls: unknown[] = [];
let listedBlobs: ListedBlob[] = [];
let headResult: unknown = null;
let headError: Error | null = null;
let getResult: unknown = null;

moduleLoader._load = function loadMockedModule(
  request: string,
  parent: unknown,
  isMain: boolean
) {
  if (request === "@vercel/blob") {
    return {
      list: async (args: unknown) => {
        listCalls.push(args);
        return { blobs: listedBlobs };
      },
      head: async (pathname: string) => {
        headCalls.push(pathname);
        if (headError) {
          throw headError;
        }
        return headResult;
      },
      get: async (pathname: string, options: unknown) => {
        getCalls.push({ pathname, options });
        return getResult;
      }
    };
  }

  return originalLoad.call(this, request, parent, isMain);
};

function resetMocks() {
  listCalls = [];
  headCalls = [];
  getCalls = [];
  listedBlobs = [];
  headResult = null;
  headError = null;
  getResult = null;
}

function loadBlobModule(blobAccess?: "private" | "public") {
  if (blobAccess) {
    process.env.BLOB_ACCESS = blobAccess;
  } else {
    delete process.env.BLOB_ACCESS;
  }

  delete require.cache[require.resolve("./blob")];
  return require("./blob") as typeof import("./blob");
}

async function main() {
  resetMocks();
  let blobModule = loadBlobModule();

  listedBlobs = [
    {
      pathname: "videos/rehearsal one.mp4",
      url: "https://blob.example/rehearsal-one",
      size: 123
    },
    {
      pathname: "videos/archive/solo.MOV",
      url: "https://blob.example/solo",
      size: 456
    },
    {
      pathname: "videos/notes.txt",
      url: "https://blob.example/notes",
      size: 12
    }
  ];

  const videos = await blobModule.listVideoBlobs();

  assert.deepEqual(listCalls, [{ prefix: "videos/", limit: 1000 }]);
  assert.deepEqual(videos, [
    {
      pathname: "videos/rehearsal one.mp4",
      url: "https://blob.example/rehearsal-one",
      filename: "rehearsal one.mp4",
      size: 123
    },
    {
      pathname: "videos/archive/solo.MOV",
      url: "https://blob.example/solo",
      filename: "solo.MOV",
      size: 456
    }
  ]);

  resetMocks();
  headResult = { pathname: "videos/rehearsal.mp4", size: 321 };
  assert.deepEqual(
    await blobModule.getBlobMetadata("videos/rehearsal.mp4"),
    headResult
  );
  assert.deepEqual(headCalls, ["videos/rehearsal.mp4"]);

  resetMocks();
  headError = new Error("missing blob");
  assert.equal(await blobModule.getBlobMetadata("videos/missing.mp4"), null);
  assert.deepEqual(headCalls, ["videos/missing.mp4"]);

  resetMocks();
  getResult = { stream: "stream", blob: { contentType: "video/mp4" } };
  assert.equal(await blobModule.getBlobStream("videos/rehearsal.mp4"), getResult);
  assert.deepEqual(getCalls, [
    { pathname: "videos/rehearsal.mp4", options: { access: "private" } }
  ]);

  assert.equal(
    blobModule.getVideoPlaybackUrl({
      pathname: "videos/rehearsal take.mp4",
      url: "https://blob.example/rehearsal-take",
      filename: "rehearsal take.mp4"
    }),
    "/api/blob/stream?pathname=videos%2Frehearsal%20take.mp4"
  );

  resetMocks();
  blobModule = loadBlobModule("public");
  getResult = { stream: "stream", blob: { contentType: "video/webm" } };
  assert.equal(await blobModule.getBlobStream("videos/public.webm"), getResult);
  assert.deepEqual(getCalls, [
    { pathname: "videos/public.webm", options: { access: "public" } }
  ]);
  assert.equal(
    blobModule.getVideoPlaybackUrl({
      pathname: "videos/public.webm",
      url: "https://blob.example/public",
      filename: "public.webm"
    }),
    "https://blob.example/public"
  );

  console.log("blob utility tests ok");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    moduleLoader._load = originalLoad;
    if (originalBlobAccess === undefined) {
      delete process.env.BLOB_ACCESS;
    } else {
      process.env.BLOB_ACCESS = originalBlobAccess;
    }
    delete require.cache[require.resolve("./blob")];
  });
