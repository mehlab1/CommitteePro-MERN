const LoadingSkeleton = ({ className = "h-4 w-full" }) => {
  return <div className={`animate-pulse rounded bg-gray-200 ${className}`} />;
};

export default LoadingSkeleton;
