import {
  ArrowSquareOut,
  Briefcase,
  GithubLogo,
  InstagramLogo,
  LinkedinLogo,
  MapPin,
} from "@phosphor-icons/react";

import type { PublicCreatorProfile } from "@/shared/lib/types/public-creator-profile";
import { cn } from "@/shared/lib/utils";
import { useT } from "@/shared/providers/language-provider";

import { ProjectAvatar } from "./primitives";

interface CreatorProfileCardProps {
  avatarUrl?: string;
  name: string;
  profile: PublicCreatorProfile;
  standalone?: boolean;
}

export function CreatorProfileCard({
  avatarUrl,
  name,
  profile,
  standalone = false,
}: CreatorProfileCardProps) {
  const strings = useT().projectDetail;
  const location = [profile.location.city, profile.location.country]
    .filter(Boolean)
    .join(", ");
  const socialIcons = {
    instagram: InstagramLogo,
    linkedin: LinkedinLogo,
    github: GithubLogo,
  };
  const socialLinks = Object.entries(profile.socialLinks) as Array<
    [keyof typeof socialIcons, string]
  >;
  const hasDetails = Boolean(
    profile.aboutDescription ||
    profile.company ||
    location ||
    profile.websiteUrl ||
    profile.workExperience.length,
  );

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[var(--radius-feature)] bg-surface-muted/35 p-[var(--card-padding)]",
        !standalone && "mt-14",
      )}
    >
      {/* Creator Identity */}
      <div className="flex flex-col gap-5 m3-medium:flex-row m3-medium:items-start m3-medium:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <ProjectAvatar
            avatarUrl={avatarUrl}
            className={cn(
              "size-14 shrink-0",
              standalone && "size-20 m3-medium:size-24",
            )}
            name={name}
          />
          <div className="min-w-0">
            <p className="m3-label-medium uppercase text-copy-secondary">
              {strings.creatorProfile}
            </p>
            <h2
              className={cn(
                "m3-title-medium mt-1 truncate",
                standalone && "m3-headline-large",
              )}
            >
              {name}
            </h2>
            {profile.headline ? (
              <p
                className={cn(
                  "m3-body-small mt-1 text-copy-secondary",
                  standalone && "m3-body-medium mt-2",
                )}
              >
                {profile.headline}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {socialLinks
            .filter(([, url]) => /^https:\/\//i.test(url))
            .map(([platform, url]) => {
              const Icon = socialIcons[platform];
              return (
                <a
                  aria-label={platform}
                  className="flex size-12 items-center justify-center rounded-full border border-border-subtle bg-surface-raised transition-colors hover:border-border-strong hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
                  href={url}
                  key={platform}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Icon className="size-[18px]" />
                </a>
              );
            })}
        </div>
      </div>

      {/* Creator Details */}
      {hasDetails ? (
        <div className="mt-7 grid min-w-0 gap-7 border-t border-border-subtle/70 pt-7 m3-large:grid-cols-[minmax(0,1.25fr)_minmax(240px,0.75fr)]">
          <div className="min-w-0">
            <h3 className="m3-label-large">
              {profile.aboutTitle || strings.aboutCreator}
            </h3>
            {profile.aboutDescription ? (
              <p className="m3-body-medium mt-3 max-w-3xl whitespace-pre-wrap text-copy-secondary">
                {profile.aboutDescription}
              </p>
            ) : null}
            <div className="m3-label-large mt-5 flex flex-wrap gap-x-5 gap-y-3 text-copy-secondary">
              {profile.company ? (
                <span className="flex items-center gap-2">
                  <Briefcase className="size-4" />
                  {profile.company}
                </span>
              ) : null}
              {location ? (
                <span className="flex items-center gap-2">
                  <MapPin className="size-4" />
                  {location}
                </span>
              ) : null}
              {/^(https?:\/\/)/i.test(profile.websiteUrl) ? (
                <a
                  className="flex min-h-12 items-center gap-2 rounded-[var(--radius-control)] hover:text-copy focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand"
                  href={profile.websiteUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <ArrowSquareOut className="size-4" />
                  {strings.website}
                </a>
              ) : null}
            </div>
          </div>

          {profile.workExperience.length ? (
            <div className="min-w-0">
              <h3 className="m3-label-large">{strings.experience}</h3>
              <div className="mt-3 space-y-4">
                {profile.workExperience.slice(0, 2).map((experience, index) => (
                  <div
                    key={`${experience.company}-${experience.title}-${index}`}
                  >
                    <p className="m3-label-large">{experience.title}</p>
                    <p className="m3-label-medium mt-1 text-copy-secondary">
                      {experience.company}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
