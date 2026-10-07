"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/shared/lib/utils";

type Tab = {
  title: string;
  value: string;
  content?: React.ReactNode;
};

type TabsProps = {
  tabs: Tab[];
  containerClassName?: string;
  activeTabClassName?: string;
  tabClassName?: string;
  contentClassName?: string;
  /** Optional element rendered to the right of the tab pills row */
  headerSlot?: React.ReactNode;
};

export const Tabs01 = ({
  tabs,
  containerClassName,
  activeTabClassName,
  tabClassName,
  contentClassName,
  headerSlot,
}: TabsProps) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [hovering, setHovering] = useState(false);

  const handleSelect = (idx: number) => {
    setActiveIdx(idx);
  };

  const reorderedTabs = [
    tabs[activeIdx],
    ...tabs.filter((_, i) => i !== activeIdx),
  ];

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div
          className={cn(
            "flex flex-row items-center justify-start [perspective:1000px] relative overflow-auto sm:overflow-visible no-visible-scrollbar max-w-full w-full",
            containerClassName,
          )}
        >
          {tabs.map((tab, idx) => {
            const isActive = idx === activeIdx;
            return (
              <button
                key={tab.value}
                onClick={() => handleSelect(idx)}
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
                className={cn("relative px-4 py-2 rounded-full", tabClassName)}
                style={{ transformStyle: "preserve-3d" }}
              >
                {isActive && (
                  <motion.div
                    layoutId="clickedbutton"
                    transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
                    className={cn(
                      "absolute inset-0 bg-brand rounded-full",
                      activeTabClassName,
                    )}
                  />
                )}
                <span
                  className={cn(
                    "relative block text-sm font-medium",
                    isActive ? "text-on-brand" : "text-copy",
                  )}
                >
                  {tab.title}
                </span>
              </button>
            );
          })}
        </div>
        {headerSlot && <div className="shrink-0">{headerSlot}</div>}
      </div>

      <FadeInStack
        tabs={reorderedTabs}
        hovering={hovering}
        className={cn("mt-[var(--card-padding)]", contentClassName)}
      />
    </>
  );
};

type FadeInStackProps = {
  className?: string;
  tabs: Tab[];
  hovering?: boolean;
};

const FadeInStack = ({ className, tabs, hovering }: FadeInStackProps) => {
  return (
    <div className="relative w-full">
      {tabs.map((tab, idx) => (
        <motion.div
          key={tab.value}
          layoutId={tab.value}
          style={{
            scale: 1 - idx * 0.1,
            top: hovering ? idx * -15 : 0,
            zIndex: -idx,
            opacity: idx < 3 ? 1 - idx * 0.1 : 0,
          }}
          animate={{
            y: idx === 0 ? [0, 40, 0] : 0,
          }}
          className={cn("w-full", idx === 0 ? "relative" : "absolute top-0 left-0", className)}
        >
          {tab.content}
        </motion.div>
      ))}
    </div>
  );
};
