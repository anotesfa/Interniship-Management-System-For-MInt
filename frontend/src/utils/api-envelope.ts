// Standard IMS API response envelope from the NestJS backend
export interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  error: string | null;
}

export function unwrapEnvelope<T>(payload: ApiEnvelope<T> | T): T {
  if (payload && typeof payload === 'object' && 'data' in payload && 'success' in payload) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}
