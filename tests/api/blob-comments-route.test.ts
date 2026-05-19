import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  commentBlobDelete: vi.fn(),
  commentBlobFindMany: vi.fn(),
  commentBlobFindUnique: vi.fn(),
  commentBlobCreate: vi.fn(),
  listVideoBlobs: vi.fn()
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    comment_blob: {
      delete: mocks.commentBlobDelete,
      findMany: mocks.commentBlobFindMany,
      findUnique: mocks.commentBlobFindUnique,
      create: mocks.commentBlobCreate
    }
  }
}));

vi.mock("@/lib/blob", () => ({
  listVideoBlobs: mocks.listVideoBlobs
}));

import { DELETE } from "../../app/api/blob/comments/route";

async function readJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

describe("DELETE /api/blob/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires a comment id", async () => {
    const response = await DELETE(
      new Request("https://example.test/api/blob/comments")
    );

    await expect(readJson(response)).resolves.toEqual({
      error: "id query parameter is required"
    });
    expect(response.status).toBe(400);
    expect(mocks.commentBlobDelete).not.toHaveBeenCalled();
  });

  it("rejects non-integer ids before hitting Prisma", async () => {
    const response = await DELETE(
      new Request("https://example.test/api/blob/comments?id=1.5")
    );

    await expect(readJson(response)).resolves.toEqual({
      error: "id must be a positive integer"
    });
    expect(response.status).toBe(400);
    expect(mocks.commentBlobFindUnique).not.toHaveBeenCalled();
    expect(mocks.commentBlobDelete).not.toHaveBeenCalled();
  });

  it("returns not found without deleting when the comment does not exist", async () => {
    mocks.commentBlobFindUnique.mockResolvedValueOnce(null);

    const response = await DELETE(
      new Request("https://example.test/api/blob/comments?id=42")
    );

    await expect(readJson(response)).resolves.toEqual({
      error: "Comment not found"
    });
    expect(response.status).toBe(404);
    expect(mocks.commentBlobFindUnique).toHaveBeenCalledWith({
      where: { id: 42 }
    });
    expect(mocks.commentBlobDelete).not.toHaveBeenCalled();
  });

  it("deletes the requested comment when it exists", async () => {
    mocks.commentBlobFindUnique.mockResolvedValueOnce({
      id: 7,
      pathname: "videos/rehearsal.mp4"
    });
    mocks.commentBlobDelete.mockResolvedValueOnce({ id: 7 });

    const response = await DELETE(
      new Request("https://example.test/api/blob/comments?id=7")
    );

    await expect(readJson(response)).resolves.toEqual({ success: true });
    expect(response.status).toBe(200);
    expect(mocks.commentBlobFindUnique).toHaveBeenCalledWith({
      where: { id: 7 }
    });
    expect(mocks.commentBlobDelete).toHaveBeenCalledWith({ where: { id: 7 } });
  });
});
