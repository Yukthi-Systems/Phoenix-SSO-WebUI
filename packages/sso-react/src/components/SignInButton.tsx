import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { useSSOAuth } from '../useSSOAuth';

export interface SignInButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  children?: ReactNode;
}

/** Renders a button that opens the SSO login popup when clicked. */
export function SignInButton({ children, onClick, ...props }: SignInButtonProps) {
  const { signIn } = useSSOAuth();

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    void signIn();
  };

  return (
    <button type="button" onClick={handleClick} {...props}>
      {children ?? 'Sign in'}
    </button>
  );
}
