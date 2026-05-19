import { describe, expect, it, vi, afterEach } from "vitest";
import { DELETE, GET, POST } from "./route";
import { listVideoBlobs } from "@/lib/blob";
import { prisma } from "@/lib/db";

vi.mock("@/lib/blob", () => ({
  listVideoBlobs: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    comment_blob: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn()
    }
  }
}));

type MockFn = ReturnType<typeof vi.fn>;

const comments = prisma.comment_blob as unknown as {
  findMany: MockFn;
  create: MockFn;
  findUnique: MockFn;
  delete: MockFn;
};
const listVideoBlobsMock = listVideoBlobs as unknown as MockFn;

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/blob/comments", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/blob/comments", () => {
  it("requires a pathname query parameter", async () => {
    const response = await GET(new Request("http://localhost/api/blob/comments"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "pathname query parameter is required"
    });
    expect(comments.findMany).not.toHaveBeenCalled();
  });

  it("fetches comments for the decoded pathname in timeline order", async () => {
    const createdAt = new Date("2026-03-20T10:00:00.000Z");
    const updatedAt = new Date("2026-03-20T10:01:00.000Z");
    comments.findMany.mockResolvedValueOnce([
      {
        id: 7,
        pathname: "videos/jump turn.mp4",
        startSeconds: 12,
        endSeconds: 18,
        text: "Check landing",
        createdAt,
        updatedAt
      }
    ]);

    const response = await GET(
      new Request(
        "http://localhost/api/blob/comments?pathname=videos%2Fjump%20turn.mp4"
      )
    );

    expect(response.status).toBe(200);
    expect(comments.findMany).toHaveBeenCalledWith({
      where: { pathname: "videos/jump turn.mp4" },
      orderBy: [{ startSeconds: "asc" }, { createdAt: "asc" }]
    });
    await expect(response.json()).resolves.toEqual([
      {
        id: 7,
        pathname: "videos/jump turn.mp4",
        startSeconds: 12,
        endSeconds: 18,
        text: "Check landing",
        createdAt: "2026-03-20T10:00:00.000Z",
        updatedAt: "2026-03-20T10:01:00.000Z"
      }
    ]);
  });
});

describe("POST /api/blob/comments", () => {
  it("rejects invalid JSON bodies before touching storage", async () => {
    const response = await POST(
      new Request("http://localhost/api/blob/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{"
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid JSON body"
    });
    expect(listVideoBlobsMock).not.toHaveBeenCalled();
    expect(comments.create).not.toHaveBeenCalled();
  });

  it("validates pathname, range, and text before creating a comment", async () => {
    const cases = [
      {
        body: { startSeconds: 0, endSeconds: 1, text: "Valid text" },
        error: "pathname is required"
      },
      {
        body: {
          pathname: "   ",
          startSeconds: 0,
          endSeconds: 1,
          text: "Valid text"
        },
        error: "pathname cannot be empty"
      },
      {
        body: {
          pathname: "videos/clip.mp4",
          startSeconds: Number.NaN,
          endSeconds: 1,
          text: "Valid text"
        },
        error: "startSeconds and endSeconds must be numbers"
      },
      {
        body: {
          pathname: "videos/clip.mp4",
          startSeconds: 5,
          endSeconds: 5,
          text: "Valid text"
        },
        error: "Invalid time range"
      },
      {
        body: {
          pathname: "videos/clip.mp4",
          startSeconds: 0,
          endSeconds: 1,
          text: "   "
        },
        error: "Comment text is required"
      }
    ];

    for (const { body, error } of cases) {
      const response = await POST(jsonRequest(body));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error });
    }

    expect(listVideoBlobsMock).not.toHaveBeenCalled();
    expect(comments.create).not.toHaveBeenCalled();
  });

  it("returns 404 when the requested blob video is not listed", async () => {
    listVideoBlobsMock.mockResolvedValueOnce([
      { pathname: "videos/other.mp4", url: "https://blob/other.mp4", filename: "other.mp4" }
    ]);

    const response = await POST(
      jsonRequest({
        pathname: "videos/missing.mp4",
        startSeconds: 2,
        endSeconds: 4,
        text: "Needs work"
      })
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Blob video not found"
    });
    expect(comments.create).not.toHaveBeenCalled();
  });

  it("trims input and creates a comment for an existing blob video", async () => {
    const createdAt = new Date("2026-03-20T11:00:00.000Z");
    const updatedAt = new Date("2026-03-20T11:00:30.000Z");
    listVideoBlobsMock.mockResolvedValueOnce([
      { pathname: "videos/clip.mp4", url: "https://blob/clip.mp4", filename: "clip.mp4" }
    ]);
    comments.create.mockResolvedValueOnce({
      id: 11,
      pathname: "videos/clip.mp4",
      startSeconds: 1.25,
      endSeconds: 3.5,
      text: "Keep shoulders down",
      createdAt,
      updatedAt
    });

    const response = await POST(
      jsonRequest({
        pathname: " videos/clip.mp4 ",
        startSeconds: 1.25,
        endSeconds: 3.5,
        text: "  Keep shoulders down  "
      })
    );

    expect(response.status).toBe(201);
    expect(comments.create).toHaveBeenCalledWith({
      data: {
        pathname: "videos/clip.mp4",
        startSeconds: 1.25,
        endSeconds: 3.5,
        text: "Keep shoulders down"
      }
    });
    await expect(response.json()).resolves.toEqual({
      id: 11,
      pathname: "videos/clip.mp4",
      startSeconds: 1.25,
      endSeconds: 3.5,
      text: "Keep shoulders down",
      createdAt: "2026-03-20T11:00:00.000Z",
      updatedAt: "2026-03-20T11:00:30.000Z"
    });
  });
});

describe("DELETE /api/blob/comments", () => {
  it("requires a positive numeric id before querying", async () => {
    const cases = [
      {
        url: "http://localhost/api/blob/comments",
        error: "id query parameter is required"
      },
      {
        url: "http://localhost/api/blob/comments?id=abc",
        error: "id must be a positive number"
      },
      {
        url: "http://localhost/api/blob/comments?id=0",
        error: "id must be a positive number"
      }
    ];

    for (const { url, error } of cases) {
      const response = await DELETE(new Request(url));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({ error });
    }

    expect(comments.findUnique).not.toHaveBeenCalled();
    expect(comments.delete).not.toHaveBeenCalled();
  });

  it("returns 404 without deleting when the comment does not exist", async () => {
    comments.findUnique.mockResolvedValueOnce(null);

    const response = await DELETE(
      new Request("http://localhost/api/blob/comments?id=42")
    );

    expect(response.status).toBe(404);
    expect(comments.findUnique).toHaveBeenCalledWith({ where: { id: 42 } });
    expect(comments.delete).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      error: "Comment not found"
    });
  });

  it("deletes an existing comment by id", async () => {
    comments.findUnique.mockResolvedValueOnce({ id: 42 });
    comments.delete.mockResolvedValueOnce({ id: 42 });

    const response = await DELETE(
      new Request("http://localhost/api/blob/comments?id=42")
    );

    expect(response.status).toBe(200);
    expect(comments.findUnique).toHaveBeenCalledWith({ where: { id: 42 } });
    expect(comments.delete).toHaveBeenCalledWith({ where: { id: 42 } });
    await expect(response.json()).resolves.toEqual({ success: true });
  });
});
