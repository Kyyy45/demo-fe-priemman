import type {
  DecodedField,
  ProtoField,
  ProtoScalar,
} from "@/shared/lib/types/protobuf";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function writeVarint(value: number) {
  const bytes: number[] = [];
  let remaining = Math.max(0, Math.floor(value));

  while (remaining > 0x7f) {
    bytes.push((remaining & 0x7f) | 0x80);
    remaining = Math.floor(remaining / 128);
  }

  bytes.push(remaining);
  return bytes;
}

function readVarint(bytes: Uint8Array, offset: number) {
  let value = 0;
  let shift = 0;
  let currentOffset = offset;

  while (currentOffset < bytes.length) {
    const byte = bytes[currentOffset++];
    value += (byte & 0x7f) * 2 ** shift;
    if ((byte & 0x80) === 0) {
      return { value, offset: currentOffset };
    }
    shift += 7;
  }

  throw new Error("Invalid protobuf varint");
}

function writeLengthDelimited(field: number, value: Uint8Array) {
  return [
    ...writeVarint((field << 3) | 2),
    ...writeVarint(value.length),
    ...Array.from(value),
  ];
}

function encodeScalar({
  field,
  type,
  value,
}: Omit<ProtoField, "value"> & { value: ProtoScalar }) {
  if (type === "string") {
    return writeLengthDelimited(field, textEncoder.encode(String(value)));
  }

  if (type === "message") {
    return writeLengthDelimited(
      field,
      value instanceof Uint8Array ? value : new Uint8Array(),
    );
  }

  if (type === "bool") {
    return [...writeVarint((field << 3) | 0), ...writeVarint(value ? 1 : 0)];
  }

  return [...writeVarint((field << 3) | 0), ...writeVarint(Number(value))];
}

export function encodeMessage(fields: ProtoField[]) {
  const bytes: number[] = [];

  for (const protoField of fields) {
    const { value } = protoField;
    if (value === null || value === undefined) continue;

    const values = Array.isArray(value) ? value : [value];
    for (const scalarValue of values) {
      bytes.push(...encodeScalar({ ...protoField, value: scalarValue }));
    }
  }

  return new Uint8Array(bytes);
}

export function decodeMessage(bytes: Uint8Array): DecodedField[] {
  const fields: DecodedField[] = [];
  let offset = 0;

  while (offset < bytes.length) {
    const tag = readVarint(bytes, offset);
    offset = tag.offset;

    const field = tag.value >> 3;
    const wireType = tag.value & 0x7;

    if (wireType === 0) {
      const result = readVarint(bytes, offset);
      offset = result.offset;
      fields.push({ field, wireType, value: result.value });
      continue;
    }

    if (wireType === 2) {
      const length = readVarint(bytes, offset);
      offset = length.offset;
      const value = bytes.slice(offset, offset + length.value);
      offset += length.value;
      fields.push({ field, wireType, value });
      continue;
    }

    throw new Error(`Unsupported protobuf wire type: ${wireType}`);
  }

  return fields;
}

export function asString(value: DecodedField["value"]) {
  if (!(value instanceof Uint8Array)) return String(value);

  return textDecoder.decode(value);
}

export function asBytes(value: DecodedField["value"]) {
  return value instanceof Uint8Array ? value : new Uint8Array();
}

export function asBool(value: DecodedField["value"]) {
  return Number(value) === 1;
}
