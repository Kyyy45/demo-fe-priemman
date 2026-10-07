export type ProtoScalar = string | number | boolean | Uint8Array;

export interface ProtoField {
  field: number;
  value: ProtoScalar | ProtoScalar[] | null | undefined;
  type: "string" | "bool" | "int32" | "int64" | "message";
}

export interface DecodedField {
  field: number;
  wireType: number;
  value: number | string | Uint8Array;
}
