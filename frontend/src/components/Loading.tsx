import React from "react";

const Loading = () => {
  return (
    <div clasName="fixed inset-0 flex items-center justify-center bg-gray-900 text-white text-2xl">
      <div className="h-12 w-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export default Loading;
