import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const readyElement = screen.getByText(/Ready/i);
  expect(readyElement).toBeInTheDocument();
});
