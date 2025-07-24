import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "wouter";
import { 
  User, 
  Mail, 
  Calendar,
  Settings,
  Shield,
  Activity,
  FileText,
  MessageSquare
} from "lucide-react";

export default function Profile() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Please log in to view your profile.</p>
          <Link href="/login">
            <Button>Log In</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const stats = [
    { label: "Email Cadences", value: "12", icon: Mail },
    { label: "LinkedIn Posts", value: "8", icon: MessageSquare },
    { label: "Generated Content", value: "45", icon: FileText },
    { label: "Account Research", value: "6", icon: Activity },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage 
                  src={user.profileImageUrl || ""} 
                  alt={`${user.firstName} ${user.lastName}`}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-2xl font-medium">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-bold">
                    {user.firstName} {user.lastName}
                  </h1>
                  <Link href="/settings">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </Link>
                </div>
                
                <div className="flex items-center space-x-4 text-muted-foreground">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-1" />
                    {user.email}
                  </div>
                  <div className="flex items-center">
                    <Shield className="h-4 w-4 mr-1" />
                    <Badge variant="outline" className="capitalize">
                      {user.role}
                    </Badge>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Member since Jan 2025
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <stat.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Your latest actions and generated content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="p-1 bg-green-100 rounded">
                    <Mail className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Generated email cadence for TechCorp</p>
                    <p className="text-sm text-muted-foreground">2 hours ago</p>
                  </div>
                </div>
                <Badge variant="outline">Email</Badge>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="p-1 bg-blue-100 rounded">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Created LinkedIn campaign for Enterprise QA</p>
                    <p className="text-sm text-muted-foreground">4 hours ago</p>
                  </div>
                </div>
                <Badge variant="outline">LinkedIn</Badge>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-3">
                  <div className="p-1 bg-purple-100 rounded">
                    <FileText className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Completed account research for GlobalSoft</p>
                    <p className="text-sm text-muted-foreground">1 day ago</p>
                  </div>
                </div>
                <Badge variant="outline">Research</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-muted-foreground">Personal Details</h4>
                  <Separator className="my-2" />
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Full Name:</span>
                      <span className="text-sm font-medium">{user.firstName} {user.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <span className="text-sm font-medium">{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">User ID:</span>
                      <span className="text-sm font-medium">#{user.id}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-muted-foreground">Account Status</h4>
                  <Separator className="my-2" />
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Account Type:</span>
                      <Badge variant="default" className="capitalize">
                        {user.role}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                        Active
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Member Since:</span>
                      <span className="text-sm font-medium">January 2025</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}