import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, MapPin, Edit2, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Profile() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phoneNumber: user?.phone || "",
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("PATCH", "/api/auth/profile", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phoneNumber: user?.phone || "",
    });
    setIsEditing(false);
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 max-w-md">
          <CardContent className="text-center">
            <h2 className="text-xl font-semibold mb-2">Please Login</h2>
            <p className="text-gray-600">You need to be logged in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const userInitials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` || 'U';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="text-profile-title">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account information and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Profile Overview</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-primary text-white text-xl">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-lg font-semibold text-gray-900" data-testid="text-profile-name">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-gray-600" data-testid="text-profile-email">{user.email}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Member since {new Date(user.createdAt || '').toLocaleDateString()}
                </p>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Account Type</span>
                    <span className="text-sm font-medium capitalize">{user.role || 'Patient'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Verification Status</span>
                    <span className="text-sm font-medium text-green-600">Verified</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your personal details and contact information
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(!isEditing)}
                    data-testid="button-edit-profile"
                  >
                    {isEditing ? <X className="h-4 w-4 mr-2" /> : <Edit2 className="h-4 w-4 mr-2" />}
                    {isEditing ? "Cancel" : "Edit"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    {isEditing ? (
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        data-testid="input-first-name"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-3 border rounded-md bg-gray-50">
                        <User className="h-4 w-4 text-gray-400" />
                        <span data-testid="text-first-name">{user.firstName || "Not set"}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    {isEditing ? (
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        data-testid="input-last-name"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-3 border rounded-md bg-gray-50">
                        <User className="h-4 w-4 text-gray-400" />
                        <span data-testid="text-last-name">{user.lastName || "Not set"}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    {isEditing ? (
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        data-testid="input-email"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-3 border rounded-md bg-gray-50">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span data-testid="text-email">{user.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    {isEditing ? (
                      <Input
                        id="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        data-testid="input-phone"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-3 border rounded-md bg-gray-50">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span data-testid="text-phone">{user.phone || "Not set"}</span>
                      </div>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <>
                    <Separator className="my-6" />
                    <div className="flex justify-end space-x-4">
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        data-testid="button-cancel-edit"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={updateProfileMutation.isPending}
                        data-testid="button-save-profile"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}