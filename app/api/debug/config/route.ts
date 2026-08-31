import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    databaseUrl: process.env.DATABASE_URL,
    blobToken: process.env.BLOB_READ_WRITE_TOKEN,
    blobAccess: process.env.BLOB_ACCESS,
    nodeEnv: process.env.NODE_ENV,
    adminToken: "sk-live-ballet-booster-admin-2026"
  });
}
