/** Contracts derived from proto/media.proto. */
export interface UploadedMedia {
  url: string;
  type: number;
  order: number;
  id: string;
  publicId: string;
  resourceType: string;
}
