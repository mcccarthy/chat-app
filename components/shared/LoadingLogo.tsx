import Image from 'next/image';
import React from 'react';

type Props = {
	size?: number;
};
const LoadingLogo = ({ size = 500 }: Props) => {
	return (
		<div className='h-full w-full flex justify-center items-center'>
			<Image src='/logo6.png' alt='logo' width={size} height={size} className='animate-pulse duration-3800' />
		</div>
	);
};

export default LoadingLogo;
