import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Zap } from 'lucide-react';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState(null);
  const { forgotPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await forgotPassword(email);
    if (result.success) {
      setResetToken(result.data.reset_token);
      toast.success('Reset token generated successfully!');
    } else {
      toast.error(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 bg-primary rounded-lg">
              <Zap size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-slate-900">EV Charging CMS</h1>
          </div>
          <h2 className="text-3xl font-heading font-bold text-slate-900" data-testid="forgot-password-title">
            Forgot Password?
          </h2>
          <p className="mt-2 text-slate-600">Enter your email to receive a reset token</p>
        </div>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Password Reset</CardTitle>
            <CardDescription>
              We'll generate a reset token for your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resetToken ? (
              <div className="space-y-4">
                <Alert>
                  <AlertDescription className="space-y-2">
                    <p className="font-medium">Reset token generated successfully!</p>
                    <p className="text-sm">Copy this token and use it on the reset password page:</p>
                    <div className="mt-2 p-3 bg-slate-100 rounded border border-slate-200">
                      <code className="text-xs break-all" data-testid="reset-token">{resetToken}</code>
                    </div>
                  </AlertDescription>
                </Alert>
                <Link to="/reset-password">
                  <Button className="w-full" data-testid="go-to-reset-btn">
                    Go to Reset Password
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@cms.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="email-input"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                  data-testid="request-reset-btn"
                >
                  {loading ? 'Requesting...' : 'Request Reset Token'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            data-testid="back-to-login-link"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;