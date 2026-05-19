import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, POST } from "./route";

const mocks = vi.hoisted(() => ({
  commentBlobCreate: vi.fn(),
  commentBlobDelete: vi.fn(),
  commentBlobFindUnique: vi.fn(),
  listVideoBlobs: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    comment_blob: {
      create: mocks.commentBlobCreate,
      delete: mocks.commentBlobDelete,
      findUnique: mocks.commentBlobFindUnique
    }
  }
}));

vi.mock("@/lib/blob", () => ({
  listVideoBlobs: mocks.listVideoBlobs
}));

function postRequest(body: unknown) {
  return new Request("http://localhost/api/blob/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

async function responseJson(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

describe("POST /api/blob/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid time ranges before touching Blob storage or the database", async () => {
    const response = await POST(
      postRequest({
        pathname: "videos/demo.mp4",
        startSeconds: 12,
        endSeconds: 12,
        text: "Needs work"
      })
    );

    expect(response.status).toBe(400);
    await expect(responseJson(response)).resolves.toEqual({
      error: "Invalid time range"
    });
    expect(mocks.listVideoBlobs).not.toHaveBeenCalled();
    expect(mocks.commentBlobCreate).not.toHaveBeenCalled();
  });

  it("does not create a comment when the requested Blob video is missing", async () => {
    mocks.listVideoBlobs.mockResolvedValue([]);

    const response = await POST(
      postRequest({
        pathname: "videos/missing.mp4",
        startSeconds: 1,
        endSeconds: 5,
        text: "Needs work"
      })
    );

    expect(response.status).toBe(404);
    await expect(responseJson(response)).resolves.toEqual({
      error: "Blob video not found"
    });
    expect(mocks.commentBlobCreate).not.toHaveBeenCalled();
  });

  it("trims persisted comment data and serializes database dates", async () => {
    const createdAt = new Date("2026-05-19T09:00:00.000Z");
    const updatedAt = new Date("2026-05-19T09:05:00.000Z");
    mocks.listVideoBlobs.mockResolvedValue([
      {
        pathname: "videos/demo.mp4",
        url: "https://blob.example/demo.mp4",
        filename: "demo.mp4"
      }
    ]);
    mocks.commentBlobCreate.mockResolvedValue({
      id: 7,
      pathname: "videos/demo.mp4",
      startSeconds: 1.25,
      endSeconds: 5.5,
      text: "Needs work",
      createdAt,
      updatedAt
    });

    const response = await POST(
      postRequest({
        pathname: " videos/demo.mp4 ",
        startSeconds: 1.25,
        endSeconds: 5.5,
        text: "  Needs work  "
      })
    );

    expect(response.status).toBe(201);
    expect(mocks.commentBlobCreate).toHaveBeenCalledWith({
      data: {
        pathname: "videos/demo.mp4",
        startSeconds: 1.25,
        endSeconds: 5.5,
        text: "Needs work"
      }
    });
    await expect(responseJson(response)).resolves.toEqual({
      id: 7,
      pathname: "videos/demo.mp4",
      startSeconds: 1.25,
      endSeconds: 5.5,
      text: "Needs work",
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString()
    });
  });
});

describe("DELETE /api/blob/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects requests without a positive numeric id before querying", async () => {
    const missingResponse = await DELETE(
      new Request("http://localhost/api/blob/comments", { method: "DELETE" })
    );
    const invalidResponse = await DELETE(
      new Request("http://localhost/api/blob/comments?id=not-a-number", {
        method: "DELETE"
      })
    );

    expect(missingResponse.status).toBe(400);
    await expect(responseJson(missingResponse)).resolves.toEqual({
      error: "id query parameter is required"
    });
    expect(invalidResponse.status).toBe(400);
    await expect(responseJson(invalidResponse)).resolves.toEqual({
      error: "id must be a positive number"
    });
    expect(mocks.commentBlobFindUnique).not.toHaveBeenCalled();
    expect(mocks.commentBlobDelete).not.toHaveBeenCalled();
  });

  it("returns 404 and preserves data when the comment does not exist", async () => {
    mocks.commentBlobFindUnique.mockResolvedValue(null);

    const response = await DELETE(
      new Request("http://localhost/api/blob/comments?id=42", {
        method: "DELETE"
      })
    );

    expect(response.status).toBe(404);
    await expect(responseJson(response)).resolves.toEqual({
      error: "Comment not found"
    });
    expect(mocks.commentBlobFindUnique).toHaveBeenCalledWith({
      where: { id: 42 }
    });
    expect(mocks.commentBlobDelete).not.toHaveBeenCalled();
  });

  it("deletes an existing comment by id", async () => {
    mocks.commentBlobFindUnique.mockResolvedValue({ id: 42 });
    mocks.commentBlobDelete.mockResolvedValue({ id: 42 });

    const response = await DELETE(
      new Request("http://localhost/api/blob/comments?id=42", {
        method: "DELETE"
      })
    );

    expect(response.status).toBe(200);
    await expect(responseJson(response)).resolves.toEqual({ success: true });
    expect(mocks.commentBlobDelete).toHaveBeenCalledWith({ where: { id: 42 } });
  });

  it("returns 500 when the database delete fails", async () => {
    mocks.commentBlobFindUnique.mockResolvedValue({ id: 42 });
    mocks.commentBlobDelete.mockRejectedValue(new Error("database unavailable"));

    const response = await DELETE(
      new Request("http://localhost/api/blob/comments?id=42", {
        method: "DELETE"
      })
    );

    expect(response.status).toBe(500);
    await expect(responseJson(response)).resolves.toEqual({
      error: "Failed to delete comment"
    });
  });
});
