import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menu, LogIn, LogOut } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect } from "react";
import { createOrUpdateUser } from "@/utils/db/actions";

export default function Navbar() {
    const { login, logout, authenticated, user } = usePrivy();



    useEffect(() => {
      if (authenticated && user) {
        handleUserAuthenticated();
      }
    }, [authenticated, user]);



    const handleUserAuthenticated = async () => {
      if (user && user.wallet?.address) {
        try {
          await createOrUpdateUser(
            user.wallet.address,
            user.email?.address || ""
          );
          
          }
         catch (error) {
          console.error("Error updating user information:", error);
        }
      }
    };




    const handleAuth = () => {
        if (authenticated) {
          logout();
        } else {
          login();
        }
      };




  return (
    <>
      <nav className="flex justify-between items-center mb-1 py-2 pt-4 px-4 md:px-8 lg:px-16">
        <Link href="/" className="flex items-center">
          <Image
            src="/svg/lock-square-rounded.svg"
            alt="DecentraHost logo"
            width={40}
            height={40}
            priority
          />
          <span className="ml-2 text-xl font-bold">DecentraHost</span>
        </Link>
        <div className="hidden md:flex items-center space-x-4">
          <Link
            href="/dashboard"
            className="text-foreground hover:text-primary"
          >
            Dashboard
          </Link>
          <Link href="/search" className="text-foreground hover:text-primary">
            Search
          </Link>
          <Link href="/docs" className="text-foreground hover:text-primary">
            Docs
          </Link>

          <Button onClick={handleAuth} variant="outline">
            {authenticated ? (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </>
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/help">Help & Support</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ModeToggle />
        </div>
      </nav>
    </>
  );
}
