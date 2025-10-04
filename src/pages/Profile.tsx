import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Award, Loader2 } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const { isTeacher, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProfile();
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
    } else if (data) {
      setFullName(data.full_name || '');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully!');
    }
    setSaving(false);
  };

  const handleUpgradeToTeacher = async () => {
    if (!user) return;
    setUpgrading(true);

    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: user.id, role: 'teacher' });

    if (error) {
      if (error.message.includes('duplicate')) {
        toast.error('You are already a teacher!');
      } else {
        toast.error('Failed to upgrade to teacher');
      }
    } else {
      toast.success('Successfully upgraded to teacher! 🎉');
      setTimeout(() => window.location.reload(), 1500);
    }
    setUpgrading(false);
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold gradient-text mb-8">Your Profile</h1>

          <Card className="glass-card p-6 mb-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-secondary/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-secondary/50"
                />
              </div>

              <Button 
                onClick={handleSave}
                disabled={saving}
                className="btn-gradient"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Card>

          {!isTeacher && (
            <Card className="glass-card p-6 border-primary/50">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-lg bg-gradient-to-r from-primary to-accent">
                  <Award className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold mb-2">Become a Teacher</h2>
                  <p className="text-muted-foreground mb-4">
                    Upgrade your account to upload and share educational videos with learners worldwide.
                  </p>
                  <Button 
                    onClick={handleUpgradeToTeacher}
                    disabled={upgrading}
                    className="btn-gradient"
                  >
                    {upgrading ? 'Upgrading...' : 'Upgrade to Teacher'}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
