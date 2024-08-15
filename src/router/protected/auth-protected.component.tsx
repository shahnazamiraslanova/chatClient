import { Navigate, Outlet } from 'react-router-dom';
import { Routes } from '../routes';
import { useEffect, useState } from 'react';
import axiosInstance from '../../core/configs/axios.config'; // Adjust the path if necessary

const AuthProtectedComponent = ({ layout = 'public' }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Check if token is available in local storage
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    setIsAuthenticated(false);
                    return;
                }

                // Optional: Validate token with your backend
                await axiosInstance.get('/auth/validate-token', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                setIsAuthenticated(true);
            } catch (error) {
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    if (loading) {
        // Display loading spinner or message while checking auth
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to={Routes.signin} />;
    }

    return (
        <div className={`layout-${layout}`}>
            <Outlet />
        </div>
    );
};

export default AuthProtectedComponent;
