import React from 'react';
import { redirect } from 'next/navigation';

const Page = () => {
  return redirect('/chat');
};

export default Page;