const APS_AUTH_URL = "https://developer.api.autodesk.com/authentication/v2/token";
const APS_BUCKETS_URL = "https://developer.api.autodesk.com/oss/v2/buckets";
const APS_OSS_BASE = "https://developer.api.autodesk.com/oss/v2";
const APS_DERIVATIVE_URL = "https://developer.api.autodesk.com/modelderivative/v2/designdata";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} 환경변수가 필요합니다.`);
  }
  return value;
}

export function getApsConfig() {
  const clientId = requiredEnv("APS_CLIENT_ID");
  const clientSecret = requiredEnv("APS_CLIENT_SECRET");
  const bucketKey = (process.env.APS_BUCKET_KEY || "ux-lab-cad-viewer-bucket").toLowerCase();

  return { clientId, clientSecret, bucketKey };
}

export async function getApsToken(scopes: string[]) {
  const { clientId, clientSecret } = getApsConfig();

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: scopes.join(" "),
  });

  const response = await fetch(APS_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`APS 토큰 발급 실패: ${response.status}`);
  }

  return response.json() as Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
  }>;
}

function sanitizeObjectName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function toBase64Urn(raw: string): string {
  return Buffer.from(raw).toString("base64").replace(/=/g, "");
}

export async function ensureBucket(accessToken: string, bucketKey: string) {
  const create = await fetch(APS_BUCKETS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      bucketKey,
      policyKey: "persistent",
    }),
    cache: "no-store",
  });

  if (create.ok || create.status === 409) {
    return;
  }

  throw new Error(`버킷 생성 실패: ${create.status}`);
}

export async function uploadObjectToBucket(params: {
  accessToken: string;
  bucketKey: string;
  objectName: string;
  contentType: string;
  data: ArrayBuffer;
}) {
  const { accessToken, bucketKey, objectName, contentType, data } = params;
  const safeName = sanitizeObjectName(objectName);

  const url = `${APS_OSS_BASE}/buckets/${encodeURIComponent(bucketKey)}/objects/${encodeURIComponent(safeName)}`;

  const upload = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": contentType || "application/octet-stream",
    },
    body: data,
    cache: "no-store",
  });

  if (!upload.ok) {
    throw new Error(`DWG 업로드 실패: ${upload.status}`);
  }

  const payload = (await upload.json()) as { objectId: string };
  return {
    objectId: payload.objectId,
    urn: toBase64Urn(payload.objectId),
  };
}

export async function requestTranslation(accessToken: string, urn: string) {
  const response = await fetch(`${APS_DERIVATIVE_URL}/job`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: { urn },
      output: {
        formats: [{ type: "svf", views: ["2d", "3d"] }],
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`DWG 변환 요청 실패: ${response.status}`);
  }

  return response.json();
}

export async function getManifest(accessToken: string, urn: string) {
  const response = await fetch(`${APS_DERIVATIVE_URL}/${encodeURIComponent(urn)}/manifest`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (response.status === 404) {
    return { status: "not_found" as const };
  }

  if (!response.ok) {
    throw new Error(`매니페스트 조회 실패: ${response.status}`);
  }

  return (await response.json()) as {
    status?: string;
    progress?: string;
    messages?: Array<{ type: string; message: string }>;
    derivatives?: Array<{ outputType?: string; status?: string }>;
  };
}
