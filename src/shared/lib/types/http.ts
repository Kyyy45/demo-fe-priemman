export interface ApiErrorPayload {
  code?: string;
  message: string;
  status: number;
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | null;
  anonymous?: boolean;
}
