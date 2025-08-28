import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  children,
}) => {
  return (
    <div className='pb-8 md:flex md:items-center md:justify-between'>
      <div className='flex-1 min-w-0'>
        <h1 className='text-3xl font-bold leading-tight text-slate-800 tracking-tight'>
          {title}
        </h1>
        <p className='mt-2 text-md text-slate-500'>{subtitle}</p>
      </div>
      <div className='mt-4 flex md:mt-0 md:ml-4'>{children}</div>
    </div>
  );
};

export default PageHeader;
