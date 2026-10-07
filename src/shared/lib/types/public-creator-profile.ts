export interface PublicCreatorExperience {
  company: string;
  description: string;
  isCurrent: boolean;
  title: string;
}
export interface PublicCreatorProfile {
  aboutDescription: string;
  aboutTitle: string;
  company: string;
  headline: string;
  location: { city: string; country: string };
  socialLinks: Partial<Record<"instagram" | "linkedin" | "github", string>>;
  websiteUrl: string;
  workExperience: PublicCreatorExperience[];
}
