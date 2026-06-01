export type CommentData = {
  id: number;
  parentId?: number | null;
  startSeconds: number;
  endSeconds: number;
  text: string;
  createdAt: string;
  replies?: CommentData[];
};

function withReplies(comment: CommentData): CommentData {
  return {
    ...comment,
    replies: sortComments(comment.replies ?? [])
  };
}

export function sortComments(comments: CommentData[]): CommentData[] {
  return comments
    .map(withReplies)
    .sort(
      (a, b) =>
        a.startSeconds - b.startSeconds ||
        Date.parse(a.createdAt) - Date.parse(b.createdAt)
    );
}

export function addReplyToTree(
  comments: CommentData[],
  parentId: number,
  reply: CommentData
): CommentData[] {
  return comments.map((comment) => {
    if (comment.id === parentId) {
      return {
        ...comment,
        replies: sortComments([...(comment.replies ?? []), reply])
      };
    }

    return {
      ...comment,
      replies: addReplyToTree(comment.replies ?? [], parentId, reply)
    };
  });
}

export function removeCommentFromTree(
  comments: CommentData[],
  commentId: number
): CommentData[] {
  return comments
    .filter((comment) => comment.id !== commentId)
    .map((comment) => ({
      ...comment,
      replies: removeCommentFromTree(comment.replies ?? [], commentId)
    }));
}

export function findComment(
  comments: CommentData[],
  commentId: number
): CommentData | null {
  for (const comment of comments) {
    if (comment.id === commentId) return comment;
    const nested = findComment(comment.replies ?? [], commentId);
    if (nested) return nested;
  }
  return null;
}
