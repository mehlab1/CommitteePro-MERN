const LoadingSpinner = ({ label = "Loading..." }) => {
  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-600" />
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  );
};

export default LoadingSpinner;
