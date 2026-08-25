import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';

test('renders the logo and a login link', () => {
    render(
        <BrowserRouter>
            <Header />
        </BrowserRouter>
    );
    expect(screen.getByAltText('Guzman Career Services')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /login/i })).toBeInTheDocument();
});
