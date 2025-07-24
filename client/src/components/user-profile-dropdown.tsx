import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { 
  User, 
  Settings, 
  LogOut, 
  Shield,
  Bell,
  HelpCircle 
} from "lucide-react";

export default function UserProfileDropdown() {
  const { user, logout, isLogoutPending } = useAuth();

  if (!user) return null;

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-10 w-10 rounded-full border-2 border-transparent hover:border-blue-200 transition-colors"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage 
              src={user.profileImageUrl || ""} 
              alt={`${user.firstName} ${user.lastName}`}
              className="object-cover"
            />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-medium">
              {getInitials(user.firstName, user.lastName)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
            <p className="text-xs leading-none text-muted-foreground capitalize">
              {user.role} Account
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <Link href="/profile" className="block">
          <DropdownMenuItem className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            My Profile
          </DropdownMenuItem>
        </Link>
        
        <Link href="/settings" className="block">
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
        </Link>
        
        <DropdownMenuItem>
          <Bell className="mr-2 h-4 w-4" />
          Notifications
        </DropdownMenuItem>
        
        {user.role === "admin" && (
          <Link href="/admin" className="block">
            <DropdownMenuItem className="cursor-pointer">
              <Shield className="mr-2 h-4 w-4" />
              Admin Panel
            </DropdownMenuItem>
          </Link>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem>
          <HelpCircle className="mr-2 h-4 w-4" />
          Help & Support
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={handleLogout}
          disabled={isLogoutPending}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isLogoutPending ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}