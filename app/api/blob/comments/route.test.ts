import assert from "node:assert/strict";

type CommentRecord = {
  id: number;
  pathname: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
  parentId: number | null;
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
let findManyArgs: unknown[] = [];
let createCalls: unknown[] = [];
let availableBlobPathnames: string[] = [];

const prisma = {
  comment_blob: {
    findMany: async (args: unknown) => {
      findManyArgs.push(args);
      const where = args as { where?: { pathname?: string } };
      return comments
        .filter((comment) => comment.pathname === where.where?.pathname)
        .sort(
          (a, b) =>
            a.startSeconds - b.startSeconds ||
            a.createdAt.getTime() - b.createdAt.getTime()
        );
    },
    create: async ({
      data
    }: {
      data: Pick<
        CommentRecord,
        "pathname" | "startSeconds" | "endSeconds" | "text" | "parentId"
      >;
    }) => {
      createCalls.push({ data });
      const now = new Date("2026-05-19T12:00:00.000Z");
      const created = {
        id: comments.length + 1,
        ...data,
        createdAt: now,
        updatedAt: now
      };
      comments.push(created);
      return created;
    },
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
    return {
      listVideoBlobs: async () =>
        availableBlobPathnames.map((pathname) => ({ pathname }))
    };
  }

  return originalLoad.call(this, request, parent, isMain);
};

const { DELETE, GET, POST } = require("./route") as {
  DELETE(request: Request): Promise<Response>;
  GET(request: Request): Promise<Response>;
  POST(request: Request): Promise<Response>;
};

function resetComments() {
  deleteCalls = 0;
  findManyArgs = [];
  createCalls = [];
  availableBlobPathnames = [];
  comments = [
    {
      id: 1,
      pathname: "videos/rehearsal.mp4",
      startSeconds: 2,
      endSeconds: 5,
      text: "Keep the shoulder line relaxed.",
      parentId: null,
      createdAt: new Date("2026-05-19T10:00:00.000Z"),
      updatedAt: new Date("2026-05-19T10:00:00.000Z")
    },
    {
      id: 2,
      pathname: "videos/rehearsal take.mp4",
      startSeconds: 10,
      endSeconds: 14,
      text: "Land through the whole foot.",
      parentId: null,
      createdAt: new Date("2026-05-19T10:04:00.000Z"),
      updatedAt: new Date("2026-05-19T10:04:00.000Z")
    },
    {
      id: 3,
      pathname: "videos/rehearsal take.mp4",
      startSeconds: 2,
      endSeconds: 5,
      text: "Keep the shoulder line relaxed.",
      parentId: null,
      createdAt: new Date("2026-05-19T10:00:00.000Z"),
      updatedAt: new Date("2026-05-19T10:00:00.000Z")
    },
    {
      id: 4,
      pathname: "videos/rehearsal take.mp4",
      startSeconds: 2,
      endSeconds: 5,
      text: "Also watch the wrist.",
      parentId: 3,
      createdAt: new Date("2026-05-19T10:02:00.000Z"),
      updatedAt: new Date("2026-05-19T10:02:00.000Z")
    }
  ];
}

async function readJson(response: Response) {
  return response.json() as Promise<unknown>;
}

async function main() {
  resetComments();

  let response = await GET(
    new Request("http://localhost/api/blob/comments")
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await readJson(response), {
    error: "pathname query parameter is required"
  });
  assert.deepEqual(findManyArgs, []);

  response = await GET(
    new Request(
      "http://localhost/api/blob/comments?pathname=videos%2Frehearsal%20take.mp4"
    )
  );
  assert.equal(response.status, 200);
  assert.deepEqual(findManyArgs, [
    {
      where: { pathname: "videos/rehearsal take.mp4" },
      orderBy: [{ startSeconds: "asc" }, { createdAt: "asc" }]
    }
  ]);
  assert.deepEqual(await readJson(response), [
    {
      id: 3,
      pathname: "videos/rehearsal take.mp4",
      startSeconds: 2,
      endSeconds: 5,
      text: "Keep the shoulder line relaxed.",
      parentId: null,
      createdAt: "2026-05-19T10:00:00.000Z",
      updatedAt: "2026-05-19T10:00:00.000Z",
      replies: [
        {
          id: 4,
          pathname: "videos/rehearsal take.mp4",
          startSeconds: 2,
          endSeconds: 5,
          text: "Also watch the wrist.",
          parentId: 3,
          createdAt: "2026-05-19T10:02:00.000Z",
          updatedAt: "2026-05-19T10:02:00.000Z",
          replies: []
        }
      ]
    },
    {
      id: 2,
      pathname: "videos/rehearsal take.mp4",
      startSeconds: 10,
      endSeconds: 14,
      text: "Land through the whole foot.",
      parentId: null,
      createdAt: "2026-05-19T10:04:00.000Z",
      updatedAt: "2026-05-19T10:04:00.000Z",
      replies: []
    }
  ]);

  resetComments();
  availableBlobPathnames = ["videos/rehearsal.mp4"];
  response = await POST(
    new Request("http://localhost/api/blob/comments", {
      method: "POST",
      body: JSON.stringify({
        pathname: "videos/rehearsal.mp4",
        startSeconds: 5,
        endSeconds: 5,
        text: "Too short"
      })
    })
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await readJson(response), { error: "Invalid time range" });
  assert.deepEqual(createCalls, []);

  response = await POST(
    new Request("http://localhost/api/blob/comments", {
      method: "POST",
      body: JSON.stringify({
        pathname: "videos/missing.mp4",
        startSeconds: 1,
        endSeconds: 3,
        text: "Valid but missing blob"
      })
    })
  );
  assert.equal(response.status, 404);
  assert.deepEqual(await readJson(response), { error: "Blob video not found" });
  assert.deepEqual(createCalls, []);

  availableBlobPathnames = ["videos/rehearsal.mp4"];
  response = await POST(
    new Request("http://localhost/api/blob/comments", {
      method: "POST",
      body: JSON.stringify({
        pathname: " videos/rehearsal.mp4 ",
        startSeconds: 1.5,
        endSeconds: 3.25,
        text: "  Keep the elbow soft.  "
      })
    })
  );
  assert.equal(response.status, 201);
  assert.deepEqual(createCalls, [
    {
      data: {
        pathname: "videos/rehearsal.mp4",
        startSeconds: 1.5,
        endSeconds: 3.25,
        text: "Keep the elbow soft.",
        parentId: null
      }
    }
  ]);
  assert.deepEqual(await readJson(response), {
    id: 5,
    pathname: "videos/rehearsal.mp4",
    startSeconds: 1.5,
    endSeconds: 3.25,
    text: "Keep the elbow soft.",
    parentId: null,
    createdAt: "2026-05-19T12:00:00.000Z",
    updatedAt: "2026-05-19T12:00:00.000Z",
    replies: []
  });

  createCalls = [];
  response = await POST(
    new Request("http://localhost/api/blob/comments", {
      method: "POST",
      body: JSON.stringify({
        pathname: "videos/rehearsal.mp4",
        parentId: 0,
        text: "Bad parent"
      })
    })
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await readJson(response), {
    error: "parentId must be a positive number"
  });
  assert.deepEqual(createCalls, []);

  response = await POST(
    new Request("http://localhost/api/blob/comments", {
      method: "POST",
      body: JSON.stringify({
        pathname: "videos/rehearsal.mp4",
        parentId: 404,
        text: "Missing parent"
      })
    })
  );
  assert.equal(response.status, 404);
  assert.deepEqual(await readJson(response), {
    error: "Parent comment not found"
  });
  assert.deepEqual(createCalls, []);

  response = await POST(
    new Request("http://localhost/api/blob/comments", {
      method: "POST",
      body: JSON.stringify({
        pathname: "videos/rehearsal.mp4",
        parentId: 2,
        text: "Wrong video parent"
      })
    })
  );
  assert.equal(response.status, 404);
  assert.deepEqual(await readJson(response), {
    error: "Parent comment not found"
  });
  assert.deepEqual(createCalls, []);

  comments.push({
    id: 10,
    pathname: "videos/rehearsal.mp4",
    startSeconds: 2,
    endSeconds: 5,
    text: "Existing reply.",
    parentId: 1,
    createdAt: new Date("2026-05-19T10:02:00.000Z"),
    updatedAt: new Date("2026-05-19T10:02:00.000Z")
  });
  response = await POST(
    new Request("http://localhost/api/blob/comments", {
      method: "POST",
      body: JSON.stringify({
        pathname: "videos/rehearsal.mp4",
        parentId: 10,
        text: "Nested reply"
      })
    })
  );
  assert.equal(response.status, 400);
  assert.deepEqual(await readJson(response), {
    error: "Replies cannot be nested"
  });
  assert.deepEqual(createCalls, []);

  response = await POST(
    new Request("http://localhost/api/blob/comments", {
      method: "POST",
      body: JSON.stringify({
        pathname: "videos/rehearsal.mp4",
        parentId: 1,
        startSeconds: 99,
        endSeconds: 100,
        text: "  Nested note.  "
      })
    })
  );
  assert.equal(response.status, 201);
  assert.deepEqual(createCalls, [
    {
      data: {
        pathname: "videos/rehearsal.mp4",
        startSeconds: 2,
        endSeconds: 5,
        text: "Nested note.",
        parentId: 1
      }
    }
  ]);
  assert.deepEqual(await readJson(response), {
    id: 7,
    pathname: "videos/rehearsal.mp4",
    startSeconds: 2,
    endSeconds: 5,
    text: "Nested note.",
    parentId: 1,
    createdAt: "2026-05-19T12:00:00.000Z",
    updatedAt: "2026-05-19T12:00:00.000Z",
    replies: []
  });

  resetComments();
  response = await DELETE(new Request("http://localhost/api/blob/comments"));
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
    error: "id must be a positive number"
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
  assert.deepEqual(
    comments.map((comment) => comment.id),
    [2, 3, 4]
  );

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
