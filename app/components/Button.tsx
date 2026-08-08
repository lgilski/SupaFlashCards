import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonColor = 'tealDark' | 'tealLite' | 'redDark' | 'white';
type ButtonSize = 'sm' | 'md';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
  color: ButtonColor;
  size?: ButtonSize;
};

const buttonColor = {
  // tealDark: 'text-teal-050 bg-teal-600 hover:bg-teal-500',
  tealDark: 'text-teal-050 bg-teal-500 hover:bg-teal-400',
  tealLite: 'text-teal-800 bg-teal-100 hover:bg-teal-200',
  redDark: 'text-red-050 bg-red-600 hover:bg-red-500',
  white: 'text-blue-grey-800 bg-blue-grey-050 hover:bg-blue-grey-100',
};

const buttonSize = {
  sm: 'px-2 py-1',
  md: 'text-lg px-4 py-2',
};

export default function Button({
  children,
  color,
  size = 'md',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`font-medium rounded-md cursor-pointer duration-150 ${buttonColor[color]} ${buttonSize[size]} ${className ?? ''}`}
      {...props}
    >
      {children}
    </button>
  );
}
