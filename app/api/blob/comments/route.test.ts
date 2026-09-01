import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, listVideoBlobsMock } = vi.hoisted(() => ({
  prismaMock: {
    comment_blob: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn()
    }
  },
  listVideoBlobsMock: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  prisma: prismaMock
}));

vi.mock("@/lib/blob", () => ({
  listVideoBlobs: listVideoBlobsMock
}));

import { DELETE, GET, POST } from "./route";

const PATHNAME = "videos/sample.mp4";

type CommentRow = {
  id: number;
  pathname: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
  parentId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

function commentRow(overrides: Partial<CommentRow> & Pick<CommentRow, "id">): CommentRow {
  return {
    pathname: PATHNAME,
    startSeconds: 0,
    endSeconds: 5,
    text: "comment",
    parentId: null,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    ...overrides
  };
}

async function readJson(response: Response) {
  return {
    status: response.status,
    body: await response.json()
  };
}

describe("GET /api/blob/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires a pathname query parameter", async () => {
    const response = await GET(new Request("http://localhost/api/blob/comments"));
    const { status, body } = await readJson(response);

    expect(status).toBe(400);
    expect(body).toEqual({ error: "pathname query parameter is required" });
  });

  it("returns a nested comment tree sorted by time then createdAt", async () => {
    prismaMock.comment_blob.findMany.mockResolvedValue([
      commentRow({
        id: 2,
        startSeconds: 10,
        endSeconds: 12,
        text: "later root",
        createdAt: new Date("2024-01-01T00:02:00.000Z")
      }),
      commentRow({
        id: 1,
        startSeconds: 3,
        endSeconds: 6,
        text: "earlier root",
        createdAt: new Date("2024-01-01T00:01:00.000Z")
      }),
      commentRow({
        id: 4,
        startSeconds: 3,
        endSeconds: 6,
        text: "second reply",
        parentId: 1,
        createdAt: new Date("2024-01-01T00:04:00.000Z")
      }),
      commentRow({
        id: 3,
        startSeconds: 3,
        endSeconds: 6,
        text: "first reply",
        parentId: 1,
        createdAt: new Date("2024-01-01T00:03:00.000Z")
      })
    ]);

    const response = await GET(
      new Request(`http://localhost/api/blob/comments?pathname=${encodeURIComponent(PATHNAME)}`)
    );
    const { status, body } = await readJson(response);

    expect(status).toBe(200);
    expect(body).toEqual([
      {
        id: 1,
        pathname: PATHNAME,
        startSeconds: 3,
        endSeconds: 6,
        text: "earlier root",
        parentId: null,
        createdAt: "2024-01-01T00:01:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
        replies: [
          {
            id: 3,
            pathname: PATHNAME,
            startSeconds: 3,
            endSeconds: 6,
            text: "first reply",
            parentId: 1,
            createdAt: "2024-01-01T00:03:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
            replies: []
          },
          {
            id: 4,
            pathname: PATHNAME,
            startSeconds: 3,
            endSeconds: 6,
            text: "second reply",
            parentId: 1,
            createdAt: "2024-01-01T00:04:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
            replies: []
          }
        ]
      },
      {
        id: 2,
        pathname: PATHNAME,
        startSeconds: 10,
        endSeconds: 12,
        text: "later root",
        parentId: null,
        createdAt: "2024-01-01T00:02:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
        replies: []
      }
    ]);
  });
});

describe("POST /api/blob/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listVideoBlobsMock.mockResolvedValue([
      { pathname: PATHNAME, url: "https://blob.example/sample.mp4", filename: "sample.mp4" }
    ]);
  });

  it("rejects a non-positive parentId", async () => {
    const response = await POST(
      new Request("http://localhost/api/blob/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pathname: PATHNAME,
          text: "reply",
          parentId: 0
        })
      })
    );
    const { status, body } = await readJson(response);

    expect(status).toBe(400);
    expect(body).toEqual({ error: "parentId must be a positive number" });
    expect(prismaMock.comment_blob.create).not.toHaveBeenCalled();
  });

  it("rejects a reply when the parent comment is missing", async () => {
    prismaMock.comment_blob.findUnique.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/blob/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pathname: PATHNAME,
          text: "reply",
          parentId: 99
        })
      })
    );
    const { status, body } = await readJson(response);

    expect(status).toBe(404);
    expect(body).toEqual({ error: "Parent comment not found" });
  });

  it("rejects a reply to a comment on a different video", async () => {
    prismaMock.comment_blob.findUnique.mockResolvedValue(
      commentRow({ id: 1, pathname: "videos/other.mp4" })
    );

    const response = await POST(
      new Request("http://localhost/api/blob/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pathname: PATHNAME,
          text: "reply",
          parentId: 1
        })
      })
    );
    const { status, body } = await readJson(response);

    expect(status).toBe(400);
    expect(body).toEqual({ error: "Parent comment belongs to a different video" });
  });

  it("rejects a reply to a reply", async () => {
    prismaMock.comment_blob.findUnique.mockResolvedValue(
      commentRow({ id: 2, parentId: 1, text: "existing reply" })
    );

    const response = await POST(
      new Request("http://localhost/api/blob/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pathname: PATHNAME,
          text: "nested reply",
          parentId: 2
        })
      })
    );
    const { status, body } = await readJson(response);

    expect(status).toBe(400);
    expect(body).toEqual({ error: "Replies can only be added to top-level comments" });
    expect(prismaMock.comment_blob.create).not.toHaveBeenCalled();
  });

  it("inherits the parent time range when creating a reply", async () => {
    prismaMock.comment_blob.findUnique.mockResolvedValue(
      commentRow({
        id: 1,
        startSeconds: 12,
        endSeconds: 18,
        text: "parent"
      })
    );
    prismaMock.comment_blob.create.mockResolvedValue(
      commentRow({
        id: 5,
        startSeconds: 12,
        endSeconds: 18,
        text: "reply",
        parentId: 1,
        createdAt: new Date("2024-01-02T00:00:00.000Z"),
        updatedAt: new Date("2024-01-02T00:00:00.000Z")
      })
    );

    const response = await POST(
      new Request("http://localhost/api/blob/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pathname: PATHNAME,
          startSeconds: 0,
          endSeconds: 1,
          text: "reply",
          parentId: 1
        })
      })
    );
    const { status, body } = await readJson(response);

    expect(status).toBe(201);
    expect(prismaMock.comment_blob.create).toHaveBeenCalledWith({
      data: {
        pathname: PATHNAME,
        startSeconds: 12,
        endSeconds: 18,
        text: "reply",
        parentId: 1
      }
    });
    expect(body).toEqual({
      id: 5,
      pathname: PATHNAME,
      startSeconds: 12,
      endSeconds: 18,
      text: "reply",
      parentId: 1,
      createdAt: "2024-01-02T00:00:00.000Z",
      updatedAt: "2024-01-02T00:00:00.000Z"
    });
  });
});

describe("DELETE /api/blob/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes a comment by id", async () => {
    prismaMock.comment_blob.findUnique.mockResolvedValue(commentRow({ id: 1 }));
    prismaMock.comment_blob.delete.mockResolvedValue(commentRow({ id: 1 }));

    const response = await DELETE(
      new Request("http://localhost/api/blob/comments?id=1")
    );
    const { status, body } = await readJson(response);

    expect(status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(prismaMock.comment_blob.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("cascades reply deletes via the Comment_blob parent relation", () => {
    const schema = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8");

    expect(schema).toMatch(
      /parent\s+Comment_blob\?\s+@relation\("CommentReplies",\s*fields: \[parentId\],\s*references: \[id\],\s*onDelete: Cascade\)/
    );
  });
});
