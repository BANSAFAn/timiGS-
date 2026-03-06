import React from "react";

interface IconProps {
  className?: string;
}

// Feature Badge Icons
export const PrivacyIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

export const FocusIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <circle cx="12" cy="12" r="6"></circle>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

export const BreakIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

export const AnalyticsIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="14"></line>
  </svg>
);

export const CrossPlatformIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
    <line x1="8" y1="21" x2="16" y2="21"></line>
    <line x1="12" y1="17" x2="12" y2="21"></line>
  </svg>
);

export const OpenSourceIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
  </svg>
);

// Feature Section Icons
export const TrackingIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
  </svg>
);

export const TimelineIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
);

export const WeatherIcon: React.FC<IconProps> = ({ className = "w-12 h-12" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 18a5 5 0 0 0-10 0"></path>
    <line x1="12" y1="9" x2="12" y2="2"></line>
    <line x1="4.22" y1="10.22" x2="5.64" y2="11.64"></line>
    <line x1="1" y1="18" x2="3" y2="18"></line>
    <line x1="21" y1="18" x2="23" y2="18"></line>
    <line x1="18.36" y1="11.64" x2="19.78" y2="10.22"></line>
    <line x1="23" y1="22" x2="1" y2="22"></line>
    <polyline points="16 5 12 9 8 5"></polyline>
  </svg>
);

// Warning Icon
export const WarningIcon: React.FC<IconProps> = ({ className = "w-5 h-5" }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
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
