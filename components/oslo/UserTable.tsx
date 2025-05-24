//C:\Users\mukas\Downloads\project-bolt-sb1-guerg2d9\project\components\oslo\UserTable.tsx

"use client";

import { useState } from "react";
import { 
  Users, 
  MoreVertical, 
  Edit, 
  Trash, 
  Ban, 
  CheckCircle2, 
  Mail,
  Eye,
  CalendarDays
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  status: 'active' | 'suspended' | 'deleted';
}

interface Subscription {
  plan_id: string;
}

interface UserTableProps {
  users: User[];
  userSubscriptions: Record<string, Subscription>;
  // Add "Serializable" comments to mark functions as serializable
  /** @Serializable */
  onViewUser: (userId: string) => void;
  /** @Serializable */
  onEditUser: (userId: string) => void;
  /** @Serializable */
  onSuspendUser: (userId: string) => void;
  /** @Serializable */
  onReactivateUser: (userId: string) => void;
}

export function UserTable({
  users,
  userSubscriptions,
  onViewUser,
  onEditUser,
  onSuspendUser,
  onReactivateUser
}: UserTableProps) {
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 font-medium text-sm">User</th>
            <th className="text-left p-3 font-medium text-sm">Status</th>
            <th className="text-left p-3 font-medium text-sm">Subscription</th>
            <th className="text-left p-3 font-medium text-sm">Joined</th>
            <th className="text-right p-3 font-medium text-sm">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? (
            users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-muted/30">
                <td className="p-3">
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-muted rounded-full flex items-center justify-center mr-3 text-muted-foreground">
                      {user.first_name?.charAt(0) || user.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="font-medium">
                        {user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unnamed User'}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <Badge 
                    variant={
                      user.status === 'active' ? 'default' : 
                      user.status === 'suspended' ? 'outline' : 'destructive'
                    }
                  >
                    {user.status}
                  </Badge>
                </td>
                <td className="p-3">
                  {userSubscriptions[user.id] ? (
                    <Badge 
                      variant={
                        userSubscriptions[user.id].plan_id === 'pro' ? 'default' :
                        userSubscriptions[user.id].plan_id === 'business' ? 'outline' : 'secondary'
                      }
                      className={
                        userSubscriptions[user.id].plan_id === 'pro' ? 'bg-teal-500' :
                        userSubscriptions[user.id].plan_id === 'business' ? 'border-purple-500 text-purple-500' : ''
                      }
                    >
                      {userSubscriptions[user.id].plan_id.toUpperCase()}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">FREE</Badge>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarDays className="h-3 w-3 mr-1" />
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onViewUser(user.id)}>
                          <Eye className="h-4 w-4 mr-2 text-blue-500" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditUser(user.id)}>
                          <Edit className="h-4 w-4 mr-2 text-amber-500" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {user.status === 'active' ? (
                          <DropdownMenuItem onClick={() => onSuspendUser(user.id)}>
                            <Ban className="h-4 w-4 mr-2 text-red-500" />
                            Suspend User
                          </DropdownMenuItem>
                        ) : user.status === 'suspended' ? (
                          <DropdownMenuItem onClick={() => onReactivateUser(user.id)}>
                            <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                            Reactivate User
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem>
                          <Mail className="h-4 w-4 mr-2 text-indigo-500" />
                          Send Email
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="p-6 text-center text-muted-foreground">
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}