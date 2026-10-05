import { render, screen } from '@testing-library/react';
import App from './App';

test('redirects an unauthenticated visitor to login', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Welcome' })).toBeInTheDocument();
});
