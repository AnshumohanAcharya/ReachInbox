import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useState } from "react";
import { FaGoogle, FaMicrosoft } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

const AuthPage = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const { toast } = useToast();

    const handleGoogleAuth = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('http://localhost:3000/auth/gmail');
            const authUrl = response.data.url;
            console.log(authUrl)
            window.location.href = authUrl;
        } catch (error) {
            console.error("Failed to initiate Google auth:", error);
            toast({
                title: "Authentication Error",
                description: "Failed to connect with Google. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleOutlookAuth = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('http://localhost:3000/auth/outlook');
            const authUrl = response.data.url;
            window.location.href = authUrl;
        } catch (error) {
            console.error("Failed to initiate Outlook auth:", error);
            toast({
                title: "Authentication Error",
                description:
                    "Failed to connect with Outlook. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <Card className="w-[350px]">
                <CardHeader>
                    <CardTitle>Email Automation</CardTitle>
                    <CardDescription>
                        Connect your email account to get started
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        className="w-full"
                        onClick={handleGoogleAuth}
                        disabled={isLoading}
                    >
                        <FaGoogle className="mr-2 h-4 w-4" /> Connect with
                        Google
                    </Button>
                    <Button
                        className="w-full"
                        onClick={handleOutlookAuth}
                        disabled={isLoading}
                    >
                        <FaMicrosoft className="mr-2 h-4 w-4" /> Connect with
                        Outlook
                    </Button>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-gray-500">
                        By connecting, you agree to our Terms of Service and
                        Privacy Policy.
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
};

export default AuthPage;
