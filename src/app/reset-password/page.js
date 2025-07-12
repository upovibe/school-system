import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Card, Input, Button, Alert, Text } from '../components/ui';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [token, setToken] = useState('');

    useEffect(() => {
        const tokenParam = searchParams.get('token');
        if (tokenParam) {
            setToken(tokenParam);
        } else {
            setError('Invalid reset link. Please check your email for the correct link.');
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        // Validate passwords
        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:8000/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Password reset successful! You can now login with your new password.');
                setPassword('');
                setConfirmPassword('');
            } else {
                setError(data.error || 'Failed to reset password');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <Box className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <Box className="p-6">
                        <Text className="text-center text-red-600 mb-4">
                            {error}
                        </Text>
                        <Text className="text-center text-gray-600">
                            Please check your email for the correct password reset link.
                        </Text>
                    </Box>
                </Card>
            </Box>
        );
    }

    return (
        <Box className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <Box className="p-6">
                    <Box className="text-center mb-6">
                        <Text className="text-2xl font-bold text-gray-900 mb-2">
                            Reset Password
                        </Text>
                        <Text className="text-gray-600">
                            Enter your new password below
                        </Text>
                    </Box>

                    {error && (
                        <Alert variant="error" className="mb-4">
                            {error}
                        </Alert>
                    )}

                    {message && (
                        <Alert variant="success" className="mb-4">
                            {message}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <Box className="space-y-4">
                            <Box>
                                <Text className="block text-sm font-medium text-gray-700 mb-1">
                                    New Password
                                </Text>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    required
                                    disabled={loading}
                                />
                            </Box>

                            <Box>
                                <Text className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm Password
                                </Text>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                    required
                                    disabled={loading}
                                />
                            </Box>

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? 'Resetting Password...' : 'Reset Password'}
                            </Button>
                        </Box>
                    </form>

                    <Box className="mt-6 text-center">
                        <Text className="text-sm text-gray-600">
                            Remember your password?{' '}
                            <a href="/auth" className="text-indigo-600 hover:text-indigo-500 font-medium">
                                Back to Login
                            </a>
                        </Text>
                    </Box>
                </Box>
            </Card>
        </Box>
    );
};

export default ResetPassword; 