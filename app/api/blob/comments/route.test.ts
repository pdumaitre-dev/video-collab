import assert from "node:assert/strict";

type CommentRecord = {
  id: number;
  pathname: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
  createdAt: Date;
  updatedAt: Date;
};

type ModuleWithLoad = typeof import("node:module") & {
  _load(request: string, parent: unknown, isMain: boolean): unknown;
};

const moduleLoader = require("node:module") as ModuleWithLoad;
const originalLoad = moduleLoader._load;

let comments: CommentRecord[] = [];
let deleteCalls = 0;

const prisma = {
  comment_blob: {
    findUnique: async ({ where }: { where: { id: number } }) =>
      comments.find((comment) => comment.id === where.id) ?? null,
    delete: async ({ where }: { where: { id: number } }) => {
      deleteCalls += 1;
      const index = comments.findIndex((comment) => comment.id === where.id);
      if (index === -1) {
        throw new Error("Missing comment");
      }
      const [deleted] = comments.splice(index, 1);
      return deleted;
    }
  }
};

moduleLoader._load = function loadMockedModule(
  request: string,
  parent: unknown,
  isMain: boolean
) {
  if (request === "@/lib/db") {
    return { prisma };
  }

  if (request === "@/lib/blob") {
    return { listVideoBlobs: async () => [] };
  }

  return originalLoad.call(this, request, parent, isMain);
};

const { DELETE } = require("./route") as {
  DELETE(request: Request): Promise<Response>;
};

function resetComments() {
  deleteCalls = 0;
  comments = [
    {
      id: 1,
      pathname: "videos/rehearsal.mp4",
      startSeconds: 2,
      endSeconds: 5,
      text: "Keep the shoulder line relaxed.",
      createdAt: new Date("2026-05-19T10:00:00.000Z"),
      updatedAt: new Date("2026-05-19T10:00:00.000Z")
    }
  ];
}

async function readJson(response: Response) {
  return response.json() as Promise<unknown>;
}

async function main() {
  resetComments();

  let response = await DELETE(
    new Request("http://localhost/api/blob/comments")
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await readJson(response), {
    error: "id query parameter is required"
  });
  assert.equal(deleteCalls, 0);

  response = await DELETE(
    new Request("http://localhost/api/blob/comments?id=abc")
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await readJson(response), {
    error: "id must be a positive integer"
  });
  assert.equal(deleteCalls, 0);

  response = await DELETE(
    new Request("http://localhost/api/blob/comments?id=1.5")
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await readJson(response), {
    error: "id must be a positive integer"
  });
  assert.equal(deleteCalls, 0);

  response = await DELETE(
    new Request("http://localhost/api/blob/comments?id=404")
  );
  assert.equal(response.status, 404);
  assert.deepEqual(await readJson(response), { error: "Comment not found" });
  assert.equal(deleteCalls, 0);

  response = await DELETE(
    new Request("http://localhost/api/blob/comments?id=1")
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await readJson(response), { success: true });
  assert.equal(deleteCalls, 1);
  assert.deepEqual(comments, []);

  console.log("blob comment route tests ok");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    moduleLoader._load = originalLoad;
  });
