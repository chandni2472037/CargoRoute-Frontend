import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login page for unauthenticated users', () => {
  render(<App />);
  expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
});
});
