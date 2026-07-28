import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';

test('renders the company name and a login control', () => {
    render(
        <BrowserRouter>
            <Header />
        </BrowserRouter>
    );
    expect(screen.getByText('Guzman Career Services')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
});
