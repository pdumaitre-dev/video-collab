import assert from "node:assert/strict";

type ModuleWithLoad = typeof import("node:module") & {
  _load(request: string, parent: unknown, isMain: boolean): unknown;
};

type PutCall = {
  pathname: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  options: {
    access: "private" | "public";
    addRandomSuffix: boolean;
  };
};

type VideoCreateCall = {
  data: {
    title: string;
    name: string;
    publicId: string;
    pathname: string;
    sourceUrl: string;
  };
};

const moduleLoader = require("node:module") as ModuleWithLoad;
const originalLoad = moduleLoader._load;
const originalBlobAccess = process.env.BLOB_ACCESS;

process.env.BLOB_ACCESS = "private";

let putCalls: PutCall[] = [];
let createCalls: VideoCreateCall[] = [];
let createFailures: unknown[] = [];

const put = async (
  pathname: string,
  file: File,
  options: PutCall["options"]
) => {
  putCalls.push({
    pathname,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    options
  });

  return {
    pathname,
    url: `https://blob.example/${encodeURIComponent(pathname)}`
  };
};

const prisma = {
  video: {
    create: async (args: VideoCreateCall) => {
      createCalls.push(args);

      const failure = createFailures.shift();
      if (failure) {
        throw failure;
      }

      return {
        id: 100 + createCalls.length,
        title: args.data.title,
        name: args.data.name,
        publicId: args.data.publicId,
        pathname: args.data.pathname,
        sourceUrl: args.data.sourceUrl
      };
    }
  }
};

moduleLoader._load = function loadMockedModule(
  request: string,
  parent: unknown,
  isMain: boolean
) {
  if (request === "@vercel/blob") {
    return { put };
  }

  if (request === "@/lib/db") {
    return { prisma };
  }

  if (request === "@/lib/video-upload") {
    return originalLoad.call(
      this,
      `${process.cwd()}/lib/video-upload`,
      parent,
      isMain
    );
  }

  return originalLoad.call(this, request, parent, isMain);
};

const { POST } = require("./route") as {
  POST(request: Request): Promise<Response>;
};

function resetUploadMocks() {
  putCalls = [];
  createCalls = [];
  createFailures = [];
}

function publicIdConflict() {
  return {
    code: "P2002",
    meta: {
      target: ["publicId"]
    }
  };
}

async function readJson(response: Response) {
  return response.json() as Promise<unknown>;
}

function createUploadRequest(formData: FormData) {
  return new Request("http://localhost/api/blob/upload", {
    method: "POST",
    body: formData
  });
}

async function main() {
  resetUploadMocks();

  let response = await POST(createUploadRequest(new FormData()));
  assert.equal(response.status, 400);
  assert.deepEqual(await readJson(response), {
    error: "Video file is required"
  });
  assert.deepEqual(putCalls, []);
  assert.deepEqual(createCalls, []);

  resetUploadMocks();
  const invalidFileForm = new FormData();
  invalidFileForm.set(
    "file",
    new File(["not a video"], "notes.txt", { type: "video/mp4" })
  );

  response = await POST(createUploadRequest(invalidFileForm));
  assert.equal(response.status, 400);
  assert.deepEqual(await readJson(response), {
    error: "Choose an .mp4, .mov, or .webm video."
  });
  assert.deepEqual(putCalls, []);
  assert.deepEqual(createCalls, []);

  resetUploadMocks();
  createFailures = [publicIdConflict()];
  const validFileForm = new FormData();
  validFileForm.set(
    "file",
    new File(["video bytes"], "Rehearsal Review: Take 1!.MP4", {
      type: "video/mp4"
    })
  );
  validFileForm.set("name", "  Pirouette review  ");

  response = await POST(createUploadRequest(validFileForm));
  assert.equal(response.status, 201);
  assert.deepEqual(putCalls, [
    {
      pathname: "videos/Rehearsal-Review-Take-1-.MP4",
      fileName: "Rehearsal Review: Take 1!.MP4",
      fileSize: 11,
      fileType: "video/mp4",
      options: {
        access: "private",
        addRandomSuffix: false
      }
    }
  ]);
  assert.equal(createCalls.length, 2);

  for (const call of createCalls) {
    assert.equal(call.data.title, "Pirouette review");
    assert.equal(call.data.name, "Pirouette review");
    assert.equal(call.data.pathname, "videos/Rehearsal-Review-Take-1-.MP4");
    assert.equal(
      call.data.sourceUrl,
      "https://blob.example/videos%2FRehearsal-Review-Take-1-.MP4"
    );
    assert.equal(typeof call.data.publicId, "string");
    assert.equal(call.data.publicId.length, 11);
  }

  assert.deepEqual(await readJson(response), {
    id: 102,
    publicId: createCalls[1].data.publicId,
    name: "Pirouette review",
    pathname: "videos/Rehearsal-Review-Take-1-.MP4",
    url: "https://blob.example/videos%2FRehearsal-Review-Take-1-.MP4"
  });

  console.log("blob upload route tests ok");
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
  });
