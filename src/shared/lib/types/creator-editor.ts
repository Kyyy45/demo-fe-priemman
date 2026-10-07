import type {
  Project,
  ProjectCollaborator,
  ProjectMedia,
  ProjectVisibility,
} from "./project";
import type { PublicCreatorProfile } from "./public-creator-profile";

export type TextStyle = "heading" | "subheading" | "paragraph" | "caption";
export type ContentAlign = "left" | "center" | "right";
export type SocialPlatform = "instagram" | "linkedin" | "github";
export type TextBlock = {
  id: string;
  type: "text";
  style: TextStyle;
  text: string;
  contentAlign: ContentAlign;
};
export type MediaBlock = {
  id: string;
  type: "image" | "video";
  assetKey: string;
  caption: string;
  width: "inset" | "full";
};
export type GridBlock = {
  id: string;
  type: "grid";
  assetKeys: string[];
};
export type EmbedBlock = {
  id: string;
  type: "embed";
  url: string;
  width: "inset" | "full";
};
export type EditorBlock = TextBlock | MediaBlock | GridBlock | EmbedBlock;
export type EditorAsset = {
  key: string;
  url: string;
  file?: File;
  media?: ProjectMedia;
};
export type StoredBlock =
  | {
      id: string;
      type: "text";
      style: TextStyle;
      text: string;
      contentAlign?: ContentAlign;
    }
  | {
      id: string;
      type: "image" | "video";
      mediaId: string;
      caption?: string;
      width?: "inset" | "full";
    }
  | { id: string; type: "photoGrid"; layout: string; mediaIds: string[] }
  // width tidak ada pada embed lama → dianggap "inset" (tampilan semula).
  | { id: string; type: "embed"; url: string; width?: "inset" | "full" };
export interface StoredContent {
  version: 1;
  editor: "priemman-blocks";
  summary: string;
  appearance: { backgroundColor: string; contentGap: number };
  authorProfile?: PublicCreatorProfile;
  socialLinks?: Partial<Record<SocialPlatform, string>>;
  doc: { type: "doc"; blocks: StoredBlock[] };
}
export interface CreateProjectRecovery {
  title: string;
  tags: string;
  visibility: ProjectVisibility;
  collaborators: ProjectCollaborator[];
  blocks: Array<TextBlock | EmbedBlock>;
  backgroundColor: string;
  contentGap: number;
  selectedSocials: SocialPlatform[];
  hadPendingMedia: boolean;
}
export interface CreateProjectWizardProps {
  project?: Project | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSaved?: (project: Project) => void;
}
