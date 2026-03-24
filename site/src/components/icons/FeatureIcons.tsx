import React from "react";
import {
  LockKey,
  Target,
  Coffee,
  ChartBar,
  Devices,
  CodeBlock,
  Cursor,
  ListNumbers,
  CloudSun,
  WarningCircle
} from "@phosphor-icons/react";

interface IconProps {
  className?: string;
  weight?: "regular" | "light" | "bold" | "fill" | "duotone";
}

// Feature Badge Icons
export const PrivacyIcon: React.FC<IconProps> = ({ className = "w-12 h-12", weight = "regular" }) => (
  <LockKey className={className} weight={weight} />
);

export const FocusIcon: React.FC<IconProps> = ({ className = "w-12 h-12", weight = "regular" }) => (
  <Target className={className} weight={weight} />
);

export const BreakIcon: React.FC<IconProps> = ({ className = "w-12 h-12", weight = "regular" }) => (
  <Coffee className={className} weight={weight} />
);

export const AnalyticsIcon: React.FC<IconProps> = ({ className = "w-12 h-12", weight = "regular" }) => (
  <ChartBar className={className} weight={weight} />
);

export const CrossPlatformIcon: React.FC<IconProps> = ({ className = "w-12 h-12", weight = "regular" }) => (
  <Devices className={className} weight={weight} />
);

export const OpenSourceIcon: React.FC<IconProps> = ({ className = "w-12 h-12", weight = "regular" }) => (
  <CodeBlock className={className} weight={weight} />
);

// Feature Section Icons
export const TrackingIcon: React.FC<IconProps> = ({ className = "w-12 h-12", weight = "regular" }) => (
  <Cursor className={className} weight={weight} />
);

export const TimelineIcon: React.FC<IconProps> = ({ className = "w-12 h-12", weight = "regular" }) => (
  <ListNumbers className={className} weight={weight} />
);

export const WeatherIcon: React.FC<IconProps> = ({ className = "w-12 h-12", weight = "regular" }) => (
  <CloudSun className={className} weight={weight} />
);

// Warning Icon
export const WarningIcon: React.FC<IconProps> = ({ className = "w-5 h-5", weight = "regular" }) => (
  <WarningCircle className={className} weight={weight} />
);

// Icon map for easy access
export const FeatureIcons: Record<string, React.FC<IconProps>> = {
  privacy: PrivacyIcon,
  focus: FocusIcon,
  timeout: BreakIcon,
  analytics: AnalyticsIcon,
  crossplatform: CrossPlatformIcon,
  opensource: OpenSourceIcon,
  tracking: TrackingIcon,
  timeline: TimelineIcon,
  weather: WeatherIcon,
};
