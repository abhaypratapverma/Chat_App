import React from "react";
import VerifyOtp from '../../components/VerifyOtp';
import { Suspense } from "react";
import Loading from '../../components/Loading';

const VerifyPage = () => {
  return (
    <Suspense fallback={<Loading />}>
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white text-2xl">
      <VerifyOtp />
    </div>
    </Suspense>
  );
};

export default VerifyPage;
