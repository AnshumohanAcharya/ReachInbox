import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from "@/hooks/use-toast";

const AuthCallback = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    useEffect(() => {
        if (location.pathname.includes('success')) {
            toast({
                title: "Success",
                description: "Email account connected successfully!",
            });
            navigate('/dashboard');
        } else if (location.pathname.includes('error')) {
            toast({
                title: "Authentication Error",
                description: "Failed to connect email account. Please try again.",
                variant: "destructive",
            });
            navigate('/auth');
        }
    }, [location, navigate, toast]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <h2 className="text-xl font-semibold mb-4">Processing Authentication...</h2>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
        </div>
    );
};

export default AuthCallback;