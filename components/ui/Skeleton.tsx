import React from 'react';

interface SkeletonProps {
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return <div className={`bg-slate-200 animate-pulse ${className}`} />;
};

export default Skeleton;
