import assert from "node:assert/strict";
import * as React from "react";

type ModuleWithLoad = typeof import("node:module") & {
  _load(request: string, parent: unknown, isMain: boolean): unknown;
};

type BlobVideo = {
  pathname: string;
  url: string;
  filename: string;
  size?: number;
};

type StoredVideo = {
  publicId: string;
  name: string;
  pathname: string;
};

const moduleLoader = require("node:module") as ModuleWithLoad;
const originalLoad = moduleLoader._load;
const originalConsoleError = console.error;

class NotFoundError extends Error {}

function FileVideoPageShell() {
  return null;
}

function BackLink() {
  return null;
}

let listedVideos: BlobVideo[] = [];
let storedVideo: StoredVideo | null = null;
let listCalls = 0;
let playbackCalls: BlobVideo[] = [];
let findFirstCalls: unknown[] = [];
let notFoundCalls = 0;
let consoleErrorCalls: unknown[][] = [];

const prisma = {
  video: {
    findFirst: async (args: unknown) => {
      findFirstCalls.push(args);
      return storedVideo;
    }
  }
};

moduleLoader._load = function loadMockedModule(
  request: string,
  parent: unknown,
  isMain: boolean
) {
  if (request === "next/navigation") {
    return {
      notFound: () => {
        notFoundCalls += 1;
        throw new NotFoundError();
      }
    };
  }

  if (request === "../watch/[filename]/FileVideoPageShell") {
    return { __esModule: true, default: FileVideoPageShell };
  }

  if (request === "@/components/ui/BackLink") {
    return { __esModule: true, default: BackLink };
  }

  if (request === "@/lib/blob") {
    return {
      listVideoBlobs: async () => {
        listCalls += 1;
        return listedVideos;
      },
      getVideoPlaybackUrl: (blob: BlobVideo) => {
        playbackCalls.push(blob);
        return `playback:${blob.pathname}`;
      }
    };
  }

  if (request === "@/lib/db") {
    return { prisma };
  }

  return originalLoad.call(this, request, parent, isMain);
};

const { default: VideoPage } = require("./page") as {
  default(props: { params: { videoId: string } }): Promise<React.ReactElement>;
};

function resetMocks() {
  listedVideos = [];
  storedVideo = null;
  listCalls = 0;
  playbackCalls = [];
  findFirstCalls = [];
  notFoundCalls = 0;
  consoleErrorCalls = [];
}

async function renderVideoPage(videoId: string) {
  return VideoPage({ params: { videoId } });
}

function getShellProps(element: React.ReactElement) {
  const children = React.Children.toArray(element.props.children);
  const shell = children.find(
    (child) => React.isValidElement(child) && child.type === FileVideoPageShell
  );

  assert.ok(React.isValidElement(shell), "expected FileVideoPageShell child");

  return shell.props as {
    sourceUrl: string;
    title: string;
    pathname: string;
  };
}

async function main() {
  resetMocks();
  listedVideos = [
    {
      pathname: "videos/solo.mp4",
      url: "https://blob.example/solo.mp4",
      filename: "solo.mp4"
    }
  ];
  storedVideo = {
    publicId: "pub_123",
    name: "Solo review",
    pathname: "videos/solo.mp4"
  };

  let element = await renderVideoPage("pub_123");

  assert.equal(listCalls, 1);
  assert.deepEqual(findFirstCalls, [
    {
      where: {
        OR: [{ publicId: "pub_123" }, { pathname: "pub_123" }]
      },
      select: {
        publicId: true,
        name: true,
        pathname: true
      }
    }
  ]);
  assert.deepEqual(playbackCalls, [listedVideos[0]]);
  assert.deepEqual(getShellProps(element), {
    sourceUrl: "playback:videos/solo.mp4",
    title: "Solo review",
    pathname: "videos/solo.mp4"
  });

  resetMocks();
  const rawPathname = "videos/rehearsal one.mp4";
  listedVideos = [
    {
      pathname: rawPathname,
      url: "https://blob.example/rehearsal-one.mp4",
      filename: "rehearsal one.mp4"
    }
  ];

  element = await renderVideoPage(encodeURIComponent(rawPathname));

  assert.equal(listCalls, 1);
  assert.deepEqual(findFirstCalls, [
    {
      where: {
        OR: [{ publicId: rawPathname }, { pathname: rawPathname }]
      },
      select: {
        publicId: true,
        name: true,
        pathname: true
      }
    }
  ]);
  assert.deepEqual(playbackCalls, [listedVideos[0]]);
  assert.deepEqual(getShellProps(element), {
    sourceUrl: `playback:${rawPathname}`,
    title: "rehearsal one.mp4",
    pathname: rawPathname
  });

  resetMocks();
  storedVideo = {
    publicId: "missing_blob",
    name: "Missing blob",
    pathname: "videos/missing.mp4"
  };

  console.error = (...args: unknown[]) => {
    consoleErrorCalls.push(args);
  };
  try {
    await assert.rejects(
      () => renderVideoPage("missing_blob"),
      NotFoundError,
      "expected missing blob to route through notFound"
    );
  } finally {
    console.error = originalConsoleError;
  }
  assert.ok(notFoundCalls >= 1);
  assert.equal(consoleErrorCalls.length, 1);

  console.log("video page resolution tests ok");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    moduleLoader._load = originalLoad;
    console.error = originalConsoleError;
    delete require.cache[require.resolve("./page")];
  });
